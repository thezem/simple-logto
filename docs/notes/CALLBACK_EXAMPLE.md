# OAuth Callback Setup Guide

When using @ouim/better-logto-react, you need to set up a callback route to handle the OAuth redirect after authentication.

## Step 1: Create a Callback Route

### For Next.js App Router

Create `app/callback/page.tsx`:

```tsx
'use client'

import { CallbackPage } from '@ouim/better-logto-react'

export default function Callback() {
  return (
    <CallbackPage
      onSuccess={() => {
        // Optional: Custom redirect after successful auth
        window.location.href = '/dashboard'
      }}
      onError={error => {
        // Optional: Handle authentication errors
        console.error('Auth error:', error)
        window.location.href = '/login?error=auth_failed'
      }}
    />
  )
}
```

### For Next.js Pages Router

Create `pages/callback.tsx`:

```tsx
import { CallbackPage } from '@ouim/better-logto-react'

export default function Callback() {
  return <CallbackPage />
}
```

### For React Router

```tsx
import { CallbackPage } from '@ouim/better-logto-react'

function CallbackRoute() {
  return <CallbackPage />
}
```

## Step 2: Configure AuthProvider

Update your AuthProvider to use the callback URL:

```tsx
import { AuthProvider } from '@ouim/better-logto-react'

// Configure your Logto authentication
const config = {
  endpoint: 'https://your-logto-endpoint.com',
  appId: 'your-app-id',
}

function App() {
  return (
    <AuthProvider
      config={config}
      callbackUrl="http://localhost:3000/callback" // For development
      // callbackUrl="https://yourdomain.com/callback" // For production
    >
      <YourApp />
    </AuthProvider>
  )
}
```

## Step 3: Register Redirect URI in Logto

1. Go to your Logto Console
2. Navigate to your application settings
3. In the "Redirect URIs" section, add:
   - `http://localhost:3000/callback` (for development)
   - `https://yourdomain.com/callback` (for production)

## Step 4: Test the Flow

1. Click the "Sign in" button in your UserCenter component
2. Complete authentication on Logto
3. You should be redirected to `/callback`
4. The callback page will handle the authentication and redirect you back to your app

## Troubleshooting

### Error: "redirect_uri did not match"

- Make sure the callback URL in your `AuthProvider` matches exactly what you registered in Logto
- Include the protocol (`http://` or `https://`)
- Make sure there are no trailing slashes unless you included them in both places

### Error: "Invalid state"

- This usually means the authentication flow was interrupted
- Try clearing your browser cache and cookies
- Make sure you're not navigating away from the callback page too quickly
