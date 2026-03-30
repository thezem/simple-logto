# Permissions & Role-Based Authorization

This guide covers permission and role-based authorization using the built-in helpers in `@ouim/simple-logto`.

## Overview

The library provides tools for both **frontend conditional rendering** and **backend authorization decisions**:

- **Frontend:** Use `usePermission` to show/hide UI based on user claims
- **Backend:** Use `checkRoleAuthorization` and `checkMultiScopeAuthorization` to enforce access control

**Important:** Frontend checks are for UX only. Always validate permissions on the backend before performing sensitive operations.

---

## Frontend: `usePermission` Hook

### Basic Usage

Check if the current user has a specific permission:

```jsx
import { usePermission } from '@ouim/simple-logto'

export function DeleteButton() {
  const canDelete = usePermission('content:delete')

  if (!canDelete) return null

  return <button onClick={handleDelete}>Delete</button>
}
```

### Multiple Permissions

#### Require ALL permissions (default):

```jsx
// User must have both 'content:write' AND 'content:publish'
const canPublish = usePermission(['content:write', 'content:publish'])
```

#### Require ANY permission:

```jsx
// User must have either 'content:admin' OR 'content:write'
const canEdit = usePermission(['content:admin', 'content:write'], { mode: 'any' })
```

### Custom Permission Claim Keys

By default, `usePermission` looks for permissions in these JWT claims (in order):

1. `permissions` (standard)
2. `scope` (OAuth standard)
3. `scp` (scope abbreviation)

If your permissions are stored under different claim keys, specify them:

```jsx
// Check 'roles' claim first, fall back to 'permissions'
const isAdmin = usePermission('admin', {
  claimKeys: ['roles', 'permissions']
})

// Check custom Logto organization role
const isOrgAdmin = usePermission('org_admin', {
  claimKeys: ['org_roles']
})
```

### Handling Missing User

The hook returns `false` while the user is loading:

```jsx
export function ProtectedFeature() {
  const isAdmin = usePermission('admin')

  // Returns false when:
  // 1. User is loading (isLoadingUser = true)
  // 2. No user is logged in
  // 3. User lacks the 'admin' permission

  return isAdmin ? <AdminPanel /> : null
}
```

To explicitly check if the user is authenticated:

```jsx
import { useAuth } from '@ouim/simple-logto'

export function Dashboard() {
  const { user, isLoadingUser } = useAuth()
  const isAdmin = usePermission('admin')

  if (isLoadingUser) return <div>Loading...</div>
  if (!user) return <div>Please sign in</div>
  if (!isAdmin) return <div>Not authorized</div>

  return <AdminDashboard />
}
```

### Permission Claim Formats

The library automatically normalizes permission claims from different formats:

#### Space-separated string:
```
permissions: "read write delete"
→ ['read', 'write', 'delete']
```

#### Comma-separated string:
```
permissions: "read, write, delete"
→ ['read', 'write', 'delete']
```

#### Array:
```
permissions: ["read", "write", "delete"]
→ ['read', 'write', 'delete']
```

All formats are supported and normalized automatically.

---

## Backend: Authorization Helpers

### Single Role Check

```javascript
import { checkRoleAuthorization, verifyNextAuth } from '@ouim/simple-logto/backend'

export async function GET(request) {
  const authResult = await verifyNextAuth(request, {
    logtoUrl: process.env.LOGTO_URL,
    audience: 'your-api-resource',
  })

  if (!authResult.success) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user has 'admin' role
  const isAdmin = checkRoleAuthorization(authResult.auth.payload, 'admin')

  if (!isAdmin) {
    return Response.json({ error: 'Forbidden: admin access required' }, { status: 403 })
  }

  return Response.json({ data: 'admin-only data' })
}
```

### Multiple Scope Check

```javascript
import { checkMultiScopeAuthorization, verifyNextAuth } from '@ouim/simple-logto/backend'

export async function POST(request) {
  const authResult = await verifyNextAuth(request, {
    logtoUrl: process.env.LOGTO_URL,
    audience: 'your-api-resource',
  })

  if (!authResult.success) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Require ALL scopes
  const canModerate = checkMultiScopeAuthorization(
    authResult.auth.payload,
    ['content:write', 'content:review'],
    'all' // ← all scopes required
  )

  if (!canModerate) {
    return Response.json({ error: 'Forbidden: review access required' }, { status: 403 })
  }

  return Response.json({ reviewed: true })
}
```

### ANY Scope Match

```javascript
// User needs either 'admin' OR 'moderator' role
const hasModerationAccess = checkMultiScopeAuthorization(
  payload,
  ['admin', 'moderator'],
  'any' // ← any scope required
)
```

### Express.js Middleware

```javascript
import { createExpressAuthMiddleware, checkRoleAuthorization } from '@ouim/simple-logto/backend'

const authMiddleware = createExpressAuthMiddleware({
  logtoUrl: process.env.LOGTO_URL,
  audience: 'your-api-resource',
})

// Protect a route
app.delete('/api/posts/:id', authMiddleware, (req, res) => {
  const isAdmin = checkRoleAuthorization(req.auth.payload, 'admin')

  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  // Delete the post
  res.json({ deleted: true })
})
```

### Express.js Custom Authorization Middleware

Create a reusable middleware for role checks:

```javascript
function requireRole(role) {
  return (req, res, next) => {
    const hasRole = checkRoleAuthorization(req.auth.payload, role)
    if (!hasRole) {
      return res.status(403).json({ error: `Forbidden: ${role} access required` })
    }
    next()
  }
}

app.delete('/api/posts/:id', authMiddleware, requireRole('admin'), (req, res) => {
  // Only admin users reach here
  res.json({ deleted: true })
})
```

---

## Common Patterns

### Owner-Based Access Control (OBAC)

Check if the user is the owner of a resource:

```javascript
import { verifyNextAuth } from '@ouim/simple-logto/backend'

export async function PUT(request, { params }) {
  const authResult = await verifyNextAuth(request, {
    logtoUrl: process.env.LOGTO_URL,
    audience: 'your-api-resource',
  })

  if (!authResult.success) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const post = await db.getPost(params.id)
  const userId = authResult.auth.userId

  // User can only edit their own posts, or admins can edit any post
  const canEdit =
    post.authorId === userId ||
    checkRoleAuthorization(authResult.auth.payload, 'admin')

  if (!canEdit) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Update the post
  await db.updatePost(params.id, await request.json())
  return Response.json({ updated: true })
}
```

### Tenant-Scoped Authorization

If your app is multi-tenant, validate the user's organization access:

```javascript
export async function GET(request, { params }) {
  const authResult = await verifyNextAuth(request, {
    logtoUrl: process.env.LOGTO_URL,
    audience: 'your-api-resource',
  })

  if (!authResult.success) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const organizationId = params.orgId
  const userId = authResult.auth.userId

  // Check if user belongs to this organization
  const userOrgs = await db.getUserOrganizations(userId)
  if (!userOrgs.includes(organizationId)) {
    return Response.json({ error: 'Forbidden: not a member' }, { status: 403 })
  }

  // Check if user has admin role in this org
  const isOrgAdmin = userOrgs[organizationId]?.role === 'admin'
  if (!isOrgAdmin) {
    return Response.json({ error: 'Forbidden: not an admin' }, { status: 403 })
  }

  return Response.json({ data: 'org-admin-only data' })
}
```

### Time-Based Access Control

Enforce expiring permissions:

```javascript
const isActive = checkRoleAuthorization(payload, 'beta_tester')
const betaExpires = payload.beta_expires_at ? new Date(payload.beta_expires_at * 1000) : null

if (isActive && betaExpires && betaExpires < new Date()) {
  return Response.json({ error: 'Beta access expired' }, { status: 403 })
}
```

---

## Setting Up Permissions in Logto

### 1. Define Resources

In your Logto dashboard:

1. Go to **Resources**
2. Create a resource for your API (e.g., `https://api.example.com`)

### 2. Define Scopes

For each resource:

1. Go to **Scopes** tab
2. Add scopes like:
   - `content:read`
   - `content:write`
   - `content:delete`
   - `content:publish`

### 3. Assign Scopes to Roles

In **Roles**:

1. Create roles like `admin`, `editor`, `viewer`
2. Assign scopes to each role
3. Assign roles to users

### 4. Request Scopes in Frontend

Make sure your Logto config requests the resource:

```jsx
<AuthProvider
  config={{
    endpoint: 'https://your-tenant.logto.app',
    appId: 'your-app-id',
    resources: ['https://api.example.com'], // ← Include your API resource
  }}
>
  <App />
</AuthProvider>
```

The JWT will now include scopes in the `scope` or `scp` claim.

---

## Debugging Permissions

### Check the JWT

In your browser DevTools, decode the JWT token and inspect the claims:

```javascript
// In browser console
const token = document.cookie
  .split('; ')
  .find(c => c.startsWith('logto_authtoken='))
  ?.split('=')[1]

// Go to jwt.io and paste the token to see the claims
```

### Verify on Frontend

```jsx
export function DebugPermissions() {
  const { user } = useAuth()

  return (
    <details>
      <summary>Debug Info</summary>
      <pre>{JSON.stringify({ user }, null, 2)}</pre>
    </details>
  )
}
```

### Verify on Backend

```javascript
export async function GET(request) {
  const authResult = await verifyNextAuth(request, {
    logtoUrl: process.env.LOGTO_URL,
    audience: 'your-api',
  })

  // Return the full payload for debugging
  return Response.json({
    success: authResult.success,
    userId: authResult.auth?.userId,
    allClaims: authResult.auth?.payload, // ← See all claims
  })
}
```

---

## Best Practices

1. **Always check on the backend** — Frontend checks are for UX only. Never trust the frontend for security.
2. **Use specific scopes** — Instead of `admin`, use `users:write`, `posts:delete`, etc.
3. **Fail securely** — Default to denying access if in doubt.
4. **Validate early** — Check permissions at the route/middleware level, not deep in business logic.
5. **Log authorization failures** — Track who tries to access what, for security audits.
6. **Use role-based access** — Roles (groups of scopes) are easier to manage than individual permissions.
7. **Refresh when needed** — If permissions change frequently, consider shorter token lifetimes.

---

## See Also

- [docs/SECURITY_AND_FEATURES.md](./SECURITY_AND_FEATURES.md) — Role authorization details
- [src/backend/README.md](../src/backend/README.md) — Backend verification API
- [CONTRIBUTING.md](../CONTRIBUTING.md) — How to contribute permission-related improvements
