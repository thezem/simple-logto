# @ouim/simple-logto

A simpler way to use [@logto/react](https://github.com/logto-io/logto) with prebuilt UI components and hooks for fast authentication setup in React apps.

---

## Features

### Frontend Components & Hooks

- **AuthProvider**: Easy context provider for Logto authentication
- **UserCenter**: Prebuilt user dropdown/avatar for your navbar
- **CallbackPage**: Handles OAuth callback and popup flows
- **useAuth**: React hook for accessing user and auth actions
- **Custom navigation**: Integrates with React Router, Next.js, etc.
- **Guest mode**: Built-in guest user support with fingerprinting

### Backend Authentication

- **JWT Verification**: Manual JWT verification with JWKS caching
- **Express.js Middleware**: Ready-to-use Express middleware
- **Next.js Support**: API routes and middleware helpers
- **TypeScript Support**: Full TypeScript definitions

### Bundler Configuration

- **Vite**: Pre-configured Vite settings
- **Webpack**: Webpack configuration helpers
- **Next.js**: Next.js bundler configuration

---

This library is intended to be a plug-and-play solution for most common use cases, while still allowing you to customize the underlying Logto experience as needed. to save you the hassle of setting up authentication from scratch. and connecting frontend and backend authentication flows.

But if you need more control over auth flows, you can always fall back to using the official @logto/react

You can start with with @ouim/simple-logto for a quick setup,<br> And you won't find it hard to migrate to the official Logto SDK later if you need more advanced features.

## Installation

```sh
npm install @ouim/simple-logto
```

## Quick Start

### Frontend Setup

#### 1. AuthProvider

Wrap your app with `AuthProvider` and pass your Logto config:

```tsx
import { AuthProvider } from '@ouim/simple-logto'

const config = {
  endpoint: 'https://your-logto-endpoint.com',
  appId: 'your-app-id',
}

function App() {
  return (
    <AuthProvider
      config={config}
      callbackUrl="http://localhost:3000/callback"
      // Optionally: customNavigate for SPA routing
      // customNavigate={(url, options) => { ... }}
    >
      <YourApp />
    </AuthProvider>
  )
}
```

#### 2. UserCenter Component

Drop the `UserCenter` component into your navbar for a ready-to-use user menu:

![UserCenter](image.png)

```tsx
import { UserCenter } from '@ouim/simple-logto'

function Navbar() {
  return (
    <nav className="flex items-center justify-between h-16 px-4 border-b">
      <div className="font-bold">MyApp</div>
      <UserCenter />
    </nav>
  )
}
```

- Shows avatar, name, and sign out when authenticated.
- Shows sign in button when not authenticated.
- Accepts optional props:
  - `className`
  - `signoutCallbackUrl` (defaults to `/`)
  - `globalSignOut` (defaults to `true`)
  - `additionalPages` - array of `{ link: string; text: string; icon?: ReactNode }`

Example adding custom pages:

```tsx
<UserCenter additionalPages={[{ link: '/settings', text: 'Go to your settings' }]} />
```

![UserCenter logged in](image-1.png)

---

#### 3. CallbackPage

Create a route (e.g. `/callback`) and render `CallbackPage` to handle OAuth redirects:

```tsx
import { CallbackPage } from '@ouim/simple-logto'

export default function Callback() {
  return <CallbackPage />
}
```

- Optional props:
  - `onSuccess`, `onError`, `loadingComponent`, `successComponent`

#### 4. useAuth Hook

Access the current user and authentication actions anywhere in your app:

```tsx
import { useAuth } from '@ouim/simple-logto'

function Dashboard() {
  const { user, isLoadingUser, signIn, signOut } = useAuth()

  if (isLoadingUser) return <div>Loading...</div>
  if (!user) return <button onClick={() => signIn()}>Sign in</button>

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  )
}
```

#### 5. useAuth Hook

Access the current user and authentication actions anywhere in your app:

```tsx
import { useAuth } from '@ouim/simple-logto'

function Dashboard() {
  const { user, isLoadingUser, signIn, signOut, refreshAuth } = useAuth()

  if (isLoadingUser) return <div>Loading...</div>
  if (!user) return <button onClick={() => signIn()}>Sign in</button>

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={() => signOut()}>Sign out</button>
      <button onClick={refreshAuth}>Refresh Auth</button>
    </div>
  )
}
```

##### Route Protection Example

```tsx
function ProtectedPage() {
  const { user } = useAuth({
    middleware: 'auth',
    redirectTo: '/login', // Redirect if not authenticated
  })

  if (!user) return null // or loading indicator
  return <div>Protected content</div>
}
```

##### Guest Mode Example

```tsx
function MixedContent() {
  const { user } = useAuth({
    middleware: 'guest', // Allow guest users
  })

  return <div>{user ? <p>Welcome back, {user.name}!</p> : <p>You're browsing as a guest</p>}</div>
}
```

---

## Backend Authentication

> **Note:** Express middleware now includes built-in cookie parsing. You don’t need to install or call `cookie-parser` yourself anymore.

The library includes powerful backend authentication helpers for Node.js applications.

### Installation

Backend features are included with the main package:

```bash
npm install @ouim/simple-logto
```

### Express.js Middleware

```javascript
import { createExpressAuthMiddleware } from '@ouim/simple-logto/backend'

const authMiddleware = createExpressAuthMiddleware({
  logtoUrl: 'https://your-logto-domain.com',
  audience: 'your-api-resource-identifier', // A url you get when you register your API Resource in Logto, usually something like 'https://yourdomain.com/api'
  cookieName: 'logto_authtoken', // optional, defaults to 'logto_authtoken'
  allowGuest: true, // optional, enables guest mode
})

// Use in your Express routes
app.get('/protected', authMiddleware, (req, res) => {
  res.json({
    message: 'Hello authenticated user!',
    userId: req.auth.userId,
    isAuthenticated: req.auth.isAuthenticated,
    isGuest: req.auth.isGuest,
  })
})
```

### Next.js API Routes

```javascript
// app/api/protected/route.js
import { verifyNextAuth } from '@ouim/simple-logto/backend'

export async function GET(request) {
  const authResult = await verifyNextAuth(request, {
    logtoUrl: 'https://your-logto-domain.com',
    audience: 'your-api-resource-identifier',
    cookieName: 'logto_authtoken', // optional
    requiredScope: 'some_scope', // optional
    allowGuest: true, // optional
  })

  if (!authResult.success) {
    return Response.json({ error: authResult.error }, { status: 401 })
  }

  return Response.json({
    message: 'Hello authenticated user!',
    userId: authResult.auth.userId,
    payload: authResult.auth.payload,
  })
}
```

### Next.js Middleware

```javascript
// middleware.js
import { verifyNextAuth } from '@ouim/simple-logto/backend'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  if (request.nextUrl.pathname.startsWith('/api/protected')) {
    const authResult = await verifyNextAuth(request, {
      logtoUrl: process.env.LOGTO_URL,
      audience: process.env.LOGTO_AUDIENCE,
    })

    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Add auth info to headers for the API route
    const response = NextResponse.next()
    response.headers.set('x-user-id', authResult.auth.userId)
    return response
  }
}

export const config = {
  matcher: '/api/protected/:path*',
}
```

### Generic Usage

```javascript
import { verifyAuth } from '@ouim/simple-logto/backend'

// Verify with token string
try {
  const auth = await verifyAuth('your-jwt-token', {
    logtoUrl: 'https://your-logto-domain.com',
    audience: 'your-api-resource-identifier',
  })

  console.log('User ID:', auth.userId)
} catch (error) {
  console.error('Auth failed:', error.message)
}

// Verify with request object
try {
  const auth = await verifyAuth(requestObject, {
    logtoUrl: 'https://your-logto-domain.com',
    audience: 'your-api-resource-identifier',
  })
} catch (error) {
  console.error('Auth failed:', error.message)
}
```

### Backend Configuration Options

- `logtoUrl`: Your Logto server URL (required)
- `audience`: Your API resource identifier (required)
- `cookieName`: Custom cookie name (optional, defaults to 'logto_authtoken')
- `requiredScope`: Required scope for access (optional)
- `allowGuest`: Enable guest mode with fingerprinting (optional)

### Auth Context

When authentication is successful, you'll get an `AuthContext` object:

```typescript
interface AuthContext {
  userId: string | null // User ID from token (null for guests)
  isAuthenticated: boolean // true for authenticated users
  isGuest: boolean // true for guest users
  payload: AuthPayload | null // Full JWT payload (null for guests)
  guestId?: string // Guest fingerprint ID (when allowGuest is true)
}
```

---

## Bundler Configuration

The library provides pre-configured bundler settings to resolve common issues with the `jose` library and other dependencies.

### Vite

```javascript
// vite.config.js
import { viteConfig } from '@ouim/simple-logto'

export default {
  ...viteConfig,
  // your other config
}
```

### Webpack

```javascript
// webpack.config.js
import { webpackConfig } from '@ouim/simple-logto'

module.exports = {
  ...webpackConfig,
  // your other config
}
```

### Next.js

```javascript
// next.config.js
import { nextjsConfig } from '@ouim/simple-logto'

module.exports = {
  ...nextjsConfig,
  // your other config
}
```

### Custom Configuration

```javascript
import { getBundlerConfig } from '@ouim/simple-logto'

// Get configuration for specific bundler
const config = getBundlerConfig('vite') // 'vite' | 'webpack' | 'nextjs'
```

---

## TypeScript Support

The library is written in TypeScript and provides comprehensive type definitions:

```typescript
import type { LogtoUser, AuthOptions, AuthMiddleware, CallbackPageProps, NavigationOptions, AdditionalPage } from '@ouim/simple-logto'

// Backend types
import type { AuthContext, AuthPayload, VerifyAuthOptions } from '@ouim/simple-logto/backend'
```

---
