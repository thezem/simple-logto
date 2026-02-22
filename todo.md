# @ouim/simple-logto TODO List

## 🔴 Critical (Security & Stability)

- [ ] **Add CSRF protection to backend middleware** - Missing CSRF token validation in Express/Next.js middleware could expose to CSRF attacks. Add CSRF protection helpers.
- [ ] **Implement rate limiting for JWT verification** - Backend endpoints lack rate limiting. Add rate limiting helpers for Express/Next.js to prevent abuse.
- [x] **Add runtime validation of auth config** - `AuthProvider` config validation is missing. Validate `logtoUrl`, `appId`, `audience` at initialization to catch misconfigurations early.
- [ ] **Improve error recovery in auth context** - The rate limiting logic in `context.tsx` (MAX_ERROR_COUNT) might mask real auth failures. Implement better error categorization and recovery strategies.
- [ ] **Add input sanitization for JWT claims** - No validation of claim values before using them. Add schema validation for JWT payload claims.

## 🟠 High Priority (Quality & Core Features)

- [ ] **Clarify and improve `signIn()` API design** - The `signIn(callbackUrl?, usePopup?)` function from `useAuth` hook has unclear behavior:
  - Competing with `enablePopupSignIn` prop on `AuthProvider` - which takes precedence?
  - `usePopup` parameter is unclear - should users pass this? When? Why?
  - No exported `SignInButton` component for basic usage (users must manually call `signIn()`)
  - Should consider simplified API: `signIn()` with no params, or `signIn(options: { popup?, redirectUri? })`

- [ ] **SignInPage component is too specific and auto-executing** - The exported `SignInPage` component automatically calls `signIn()` on mount, making it a route-handler rather than a flexible component:
  - Only useful for popup flow control, not for rendering a custom sign-in UI
  - Should either be an internal route handler or made more flexible with props
  - Consider if this should be documented as a special route requirement instead

- [ ] **Document implicit route requirements** - The sign-in flow implicitly expects `/signin` and `/callback` routes to exist:
  - Not documented where these routes should be set up
  - No guidance for Next.js Pages vs App Router, React Router, etc.
  - Consider creating `useSignInRoute` and `useCallbackRoute` hooks or configuration helpers

- [ ] **Add simple sign-in button component** - Create a built-in `SignInButton` component or export an easy-to-use helper:
  - Simple one-liner for the most common use case: `<SignInButton />`
  - Should work with both redirect and popup flows
  - Current approach requires knowledge of the internal signIn API

- [ ] **Comprehensive test suite** - Only 3 trivial tests exist. Add unit tests for:
  - Auth context provider initialization and state management
  - JWT verification logic (JWKS fetch, token validation, cache)
  - Express/Next.js middleware auth flow
  - useAuth hook with different options (auth middleware, guest mode, redirects)
  - CallbackPage handling both popup and redirect flows
  - UserCenter component rendering states

- [ ] **Add JSDoc/TypeScript documentation** - Most functions lack documentation. Add JSDoc comments to all exported functions with examples.
- [ ] **Implement token refresh mechanism** - Current implementation doesn't handle token expiration gracefully. Add automatic token refresh before expiration.
- [ ] **Add role-based access control (RBAC) helpers** - No RBAC support in backend middleware. Create authorization helpers for common RBAC patterns.
- [x] **Fix potential infinite render in SignInPage** - The component uses `signInCalled.current` ref to prevent re-calling `signIn()`, but combined with `isPopup` state set in another effect, could cause timing issues:
  - Consider using a single effect to detect popup and call signIn atomically
  - Add guard against calling signIn if already in progress (similar to `SignInCalled` but earlier)

- [x] **Fix potential infinite render in CallbackPage** - The `useHandleSignInCallback` callback checks `isPopup` state set in another effect; could cause timing issues.
- [ ] **Add support for custom error boundaries** - Frontend components don't provide error boundaries. Add error boundary wrapper or guidance.

## 🟡 Medium Priority (Documentation & UX)

- [ ] **Create comprehensive troubleshooting guide** - Document common issues:
  - "redirect_uri did not match"
  - Token not persisting across page reloads
  - Callback infinite redirects
  - Guest mode fingerprint errors
  - Hydration mismatches in SSR
  - Popup vs redirect sign-in flow - when to use each, setup required for each

- [ ] **Add migration guide from other auth libraries** - Help users migrate from Auth0, Firebase, etc.
- [ ] **Document guest mode fully** - Add examples and explain fingerprinting, limitations, and use cases.
- [ ] **Create React Router integration guide** - Current `customNavigate` example is minimal. Add full Next.js and React Router examples.
- [ ] **Add API reference documentation** - Generate API docs for all exported components, hooks, and utilities.
- [ ] **Document backend authorization patterns** - Add examples for:
  - Protecting API routes by user ID
  - Checking scopes in middleware
  - Multi-tenant authorization
  - Admin-only routes

- [ ] **Create changelog and version management guide** - No CHANGELOG.md exists. Add changelog and document semver policy.
- [ ] **Add environment variable setup guide** - Document recommended way to pass config in different environments (dev/staging/prod).

## 🔵 Medium Priority (Performance & Optimization)

- [ ] **Make JWKS caching configurable** - Currently hardcoded to 5 minutes. Allow customization and add cache invalidation strategies.
- [ ] **Optimize SSR/Hydration pattern** - Multiple components use `hasMounted` pattern. Consider creating a reusable `useHasMounted` hook to reduce code duplication.
- [ ] **Add performance benchmarks** - Document token verification performance characteristics.
- [ ] **Consider making @fingerprintjs optional** - Currently always bundled. Could be optional dependency for users not using guest mode.
- [ ] **Monitor bundle size** - Add bundle size monitoring in CI/CD pipeline to prevent regressions.

## 🟡 Medium Priority (Features & DX)

- [ ] **Add built-in React Router integration** - Create router-specific context providers to avoid needing `customNavigate`.
- [ ] **Add Next.js App Router examples** - Document and provide hooks for App Router (pages/app directories).
- [ ] **Improve navigation error handling** - Add callbacks and events for navigation failures.
- [ ] **Add SignInPage customization options** - Current `SignInPage` is fairly rigid. Allow customizing loading state, error handling.
- [ ] **Create prebuilt theme variants for UserCenter** - Add light/dark mode, customizable UI component sets.
- [ ] **Add multi-language support utilities** - Create i18n helpers for UI strings (Sign in, Sign out, etc).

## 🔵 Lower Priority (Nice to Have)

- [ ] **Build example applications** - Create example apps demonstrating:
  - React + Express backend
  - Next.js with API routes
  - React Router SPA
  - Guest mode usage

- [ ] **Add development mode logging** - Developers could opt-in to verbose logs for debugging.
- [ ] **Create storybook documentation** - Document components with interactive Storybook stories.
- [ ] **Add analytics event helpers** - Provide utilities to track auth events (sign in, sign out, callback).
- [ ] **Support other JWT libraries** - Currently uses `jose`. Consider making it library-agnostic.
- [ ] **Add PWA/offline support guidance** - Document limitations and patterns for offline scenarios.

## 🛠️ Maintenance Tasks

- [ ] **Update peerDependencies checks** - Document minimum @logto/react version requirements
- [ ] **Add pre-commit hooks** - Set up prettier, eslint, type checking
- [ ] **Create contributing guide** - Add CONTRIBUTING.md with code style, PR process
- [ ] **Add GitHub issue templates** - Create templates for bugs, features, documentation
- [ ] **Set up GitHub workflows** - Add CI/CD for tests, type checking, build verification

---

## Legend

- 🔴 Critical: Security, stability, blocking issues
- 🟠 High: Core functionality, quality, important gaps
- 🟡 Medium: Documentation, UX, important features
- 🔵 Lower: Nice-to-haves, optimizations, maintenance
