# Quick Implementation Guide for @ouim/simple-logto

This guide walks you through the fastest way to get Logto authentication working in a typical React frontend / Express backend stack using the **@ouim/simple-logto** library. The example configuration is minimal––you can always add more options as needed.

---

## 1. Install the package

```bash
npm install @ouim/simple-logto
```

> The library contains both frontend React helpers and backend JWT/authentication utilities. No separate installation is required for the server.

---

## 2. Frontend (React)

### a. Configure `AuthProvider`

Wrap your app at the top level and supply your Logto endpoint and app ID.

```tsx
import { AuthProvider } from '@ouim/simple-logto'

const logtoConfig = {
  endpoint: 'https://your-logto-domain.com',
  appId: 'your-app-id',
}

function App() {
  return (
    <AuthProvider config={logtoConfig} callbackUrl={`${window.location.origin}/callback`}>
      <YourRoutesOrComponents />
    </AuthProvider>
  )
}
```

Use `customNavigate` prop if you need to integrate with React Router or Next.js `useRouter`.

### b. Add authentication UI

The easiest way to show sign‑in / sign‑out and a user menu is with `UserCenter`.

```tsx
import { UserCenter } from '@ouim/simple-logto'

function Navbar() {
  return (
    <nav>
      <div>My App</div>
      <UserCenter />
    </nav>
  )
}
```

If you prefer to build your own buttons you can use the `useAuth` hook directly for `signIn()`, `signOut()` and `user` state.

### c. Handle the OAuth callback

Create a route that renders `CallbackPage` to process redirects or popup responses.

```tsx
import { CallbackPage } from '@ouim/simple-logto'

export default function Callback() {
  return <CallbackPage />
}
```

Optionally provide `onSuccess`, `onError`, or custom loading/success components.

### d. Protect routes (optional)

```tsx
import { useAuth } from '@ouim/simple-logto'

function Dashboard() {
  const { user } = useAuth({ middleware: 'auth', redirectTo: '/login' })
  if (!user) return null
  return <div>Secure content</div>
}
```

For guest mode allow `middleware: 'guest'` and the hook will return either an authenticated user or a generated guest identity behind the scenes.

---

## 3. Backend (Express)

### a. Create the middleware

```js
// server.js or app.js
import express from 'express'
import { createExpressAuthMiddleware } from '@ouim/simple-logto/backend'

const app = express()

const auth = createExpressAuthMiddleware({
  logtoUrl: 'https://your-logto-domain.com',
  audience: 'https://your-api.com', // API resource identifier from Logto
  cookieName: 'logto_authtoken', // optional
  allowGuest: true, // enables guest mode
})

// Protected endpoint example
app.get('/api/profile', auth, (req, res) => {
  res.json({
    userId: req.auth.userId,
    isAuthenticated: req.auth.isAuthenticated,
    isGuest: req.auth.isGuest,
  })
})

app.listen(4000, () => console.log('Server running'))
```

`createExpressAuthMiddleware` internally parses cookies and Authorization headers in the preferred order, so no `cookie-parser` is needed.

### b. Verifying manually (optional)

You can use `verifyAuth` for ad‑hoc token verification if you’re not using Express:

```js
import { verifyAuth } from '@ouim/simple-logto/backend'

async function checkToken(token) {
  try {
    const auth = await verifyAuth(token, {
      logtoUrl: 'https://your-logto-domain.com',
      audience: 'https://your-api.com',
    })
    console.log(auth.userId)
  } catch (err) {
    console.error('Invalid token', err)
  }
}
```

### c. Next.js (bonus)

If your backend is Next.js you’ll use `verifyNextAuth` in API routes or middleware. Refer to the README for examples – the patterns are nearly identical to Express.

---

## 4. Bundler Configuration

Ensure `jose` works in your build environment by extending the provided config helpers.

```js
// vite.config.js
import { viteConfig } from '@ouim/simple-logto/bundler-config'
export default { ...viteConfig }
```

Use `webpackConfig` or `nextjsConfig` for Webpack/Next.js. You can also call `getBundlerConfig('vite' | 'webpack' | 'nextjs')` if you need dynamic logic.

---

## 5. TypeScript & Types

All public types are exported from the root. Example:

```ts
import type { LogtoUser, AuthOptions } from '@ouim/simple-logto'
```

Backend types live under `@ouim/simple-logto/backend` and include `AuthContext` and `VerifyAuthOptions`.

---

## 6. Tips & Troubleshooting

1. **Callback URL mismatch**: make sure the URL passed to `AuthProvider` matches the redirect URI registered in Logto.
2. **Guest mode tokens**: enable `allowGuest` both frontend and backend if you want un‑authenticated visitors to receive a fingerprint-based ID.
3. **Token refresh**: call `refreshAuth()` from `useAuth` when you need to renew tokens without a full reload.
4. **Migration path**: if you outgrow `@ouim/simple-logto`, you can drop down to `@logto/react` or your own UI while still using backend helpers.

---

With these steps you’ll have a working authentication flow in minutes. Happy coding! 🎉
