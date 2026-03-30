# Infinite Render Fix Documentation

## Problem Solved

The `redirectIfAuthenticated` option in `useAuth` was causing infinite re-renders due to:

1. **Options Object Reference Changes**: When passing options as an inline object, React would create a new object reference on each render, causing the `useEffect` to run repeatedly.

2. **Navigation Loop**: The original `navigateTo` function used `window.location.href`, which causes full page reloads and could lead to redirect loops.

## Solutions Implemented

### 1. Memoized Options

The `useAuth` hook now uses `useMemo` to properly memoize the options:

```typescript
const memoizedOptions = useMemo(
  () => ({
    middleware: options?.middleware,
    redirectTo: options?.redirectTo,
    redirectIfAuthenticated: options?.redirectIfAuthenticated,
    navigationOptions: options?.navigationOptions,
  }),
  [options?.middleware, options?.redirectTo, options?.redirectIfAuthenticated, options?.navigationOptions],
)
```

### 2. Enhanced Navigation

The `navigateTo` function now:

- **Prevents loops**: Checks if already on the target URL before navigating
- **Supports client-side routing**: Uses History API when possible for SPAs
- **Custom navigation support**: Allows custom navigate functions from router libraries
- **Fallback support**: Falls back to `window.location` when needed

### 3. Navigation Options

New `NavigationOptions` type provides more control:

```typescript
interface NavigationOptions {
  replace?: boolean // Use replaceState instead of pushState
  force?: boolean // Force navigation even if already on the same page
}
```

### 4. Custom Navigation Support

You can now provide a custom navigation function via `AuthProvider`:

```typescript
import { useNavigate } from 'react-router-dom'

function App() {
  const navigate = useNavigate()

  return (
    <AuthProvider
      config={config}
      customNavigate={(url, options) => {
        navigate(url, { replace: options?.replace })
      }}
    >
      <YourApp />
    </AuthProvider>
  )
}
```

## Usage Examples

### Basic Usage (Fixed)

```typescript
// This now works without infinite renders
function ProtectedPage() {
  const { user } = useAuth({
    middleware: 'auth',
    redirectTo: '/login',
  })

  return <div>Protected content</div>
}
```

### Guest Page (Fixed)

```typescript
// This now works without infinite renders
function LoginPage() {
  const { user } = useAuth({
    middleware: 'guest',
    redirectIfAuthenticated: '/dashboard',
  })

  return <LoginForm />
}
```

### Advanced Usage with Navigation Options

```typescript
function LoginPage() {
  const { user } = useAuth({
    middleware: 'guest',
    redirectIfAuthenticated: '/dashboard',
    navigationOptions: {
      replace: true, // Use replaceState instead of pushState
      force: false, // Don't force if already on the same page
    },
  })

  return <LoginForm />
}
```

### With React Router

```typescript
import { BrowserRouter, useNavigate } from 'react-router-dom'

function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
}

function App() {
  const navigate = useNavigate()

  return (
    <AuthProvider
      config={config}
      customNavigate={(url, options) => {
        navigate(url, { replace: options?.replace })
      }}
    >
      <YourRoutes />
    </AuthProvider>
  )
}
```

## Breaking Changes

None - all changes are backward compatible. Existing code will continue to work, but will now benefit from the infinite render fixes.

## Migration Guide

No migration needed, but you can optionally:

1. Add `navigationOptions` to your `useAuth` calls for more control
2. Provide a `customNavigate` function to `AuthProvider` for better SPA integration
