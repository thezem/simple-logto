# Repository Files Overview

This document provides a high-level overview of the key files in the `@ouim/logto-authkit` repository.

## Root-Level Documentation

```
├── README.md                 Main entry point with quick-start and feature overview
├── CONTRIBUTING.md           How to contribute code and run the development workflow
├── CODE_OF_CONDUCT.md        Community standards
├── SECURITY.md               Vulnerability disclosure policy
├── CHANGELOG.md              Complete version history
├── AGENTS.md                 Guidance for AI code assistants
├── package.json              npm metadata, dependencies, and scripts
└── tsconfig.json             TypeScript configuration
```

## Source Code (`src/`)

### Frontend (`src/*.tsx`, `src/*.ts`)
```
src/
├── index.ts                  Main entrypoint — exports all frontend APIs
├── context.tsx               AuthProvider: wraps @logto/react, manages token refresh
├── useAuth.ts                useAuth hook: user state and auth actions
├── usePermission.ts          usePermission hook: frontend permission checks (NEW)
├── user-center.tsx           UserCenter: Radix UI account dropdown component
├── signin.tsx                SignInPage component and signIn() function
├── callback.tsx              CallbackPage: handles redirect and popup callbacks
├── navigation.tsx            Custom navigation handler for SPA routers
├── types.ts                  Shared TypeScript types
├── utils.ts                  Cookie utilities and helper functions
└── *.test.tsx                Comprehensive vitest unit and integration tests
```

### Backend (`src/server/`)
```
src/server/
├── index.ts                  Backend entrypoint — exports all backend APIs
├── README.md                 Backend API reference with examples
├── verify-auth.ts            Core JWT verification logic
├── authorization.ts          Role and scope authorization helpers (NEW)
├── csrf.ts                   CSRF protection helpers (NEW)
├── types.ts                  Backend TypeScript types
├── middleware.ts             Express.js middleware implementation
├── utils.ts                  Backend helper utilities
└── *.test.ts                 Backend integration tests
```

### Bundler Config (`src/`)
```
src/
├── bundler-config.ts         Vite/Webpack/Next.js config helpers
└── bundler-config.test.ts    Bundler integration tests
```

## Examples

```
example_app/                          Vite + React playground with Express backend
├── README.md
├── package.json
├── src/
│   ├── App.jsx                       Main React app using AuthProvider and useAuth
│   └── styles.css
├── server/
│   ├── README.md
│   ├── auth-server.mjs                Express.js server with JWT verification
│   └── models/Sample.js
├── vite.config.js
└── index.html

examples/nextjs-app-router/           Next.js App Router example
├── README.md
├── app/
│   ├── layout.tsx                     App wrapper with AuthProvider
│   ├── page.tsx                       Home page
│   ├── signin/page.tsx                Sign-in route with SignInPage
│   ├── callback/page.tsx              Callback route with CallbackPage
│   ├── api/session/route.ts           Protected API route with verifyNextAuth
│   └── providers.tsx
├── package.json
└── tsconfig.json
```

## Smoke Tests (Real-World Integration Tests)

```
smoke-fixtures/
├── vite-react/                       Vite + React build test
├── react-router/                     React Router integration test
├── next-app-router/                  Next.js App Router test
├── node-backend/                     Node.js backend verification test
└── bundler-config/                   Bundler config resolution test

Each fixture validates:
- Package installation
- Module imports (ESM + CommonJS)
- Type correctness
- Runtime behavior
```

## GitHub

```
.github/
├── workflows/
│   ├── ci.yml                        Validation: lint → type-check → test → build
│   └── publish.yml                   Release: publish to npm with provenance
├── ISSUE_TEMPLATE/
│   ├── bug_report.yml
│   ├── feature_request.yml
│   └── config.yml
├── copilot-instructions.md           Instructions for GitHub Copilot
└── pull_request_template.md          PR template with checklist
```

## Configuration

```
.eslintrc.json                 ESLint configuration
.gitignore                     Git ignore patterns
.npmrc                         npm configuration (registry settings)
tsconfig.json                  TypeScript configuration (base)
tsconfig.build.json            TypeScript configuration (build only)
vitest.config.ts               Vitest test runner configuration
```

## Documentation (`docs/`)

```
docs/
├── README.md                         Documentation index and navigation
├── SECURITY_AND_FEATURES.md          Security hardening and advanced features
├── PERMISSIONS_AND_AUTHORIZATION.md  Role-based authorization guide
├── MIGRATION_GUIDE.md                Upgrade guide for v0.1.9+
├── CI_CD_AND_RELEASES.md             CI/CD workflows and release process
├── DOCUMENTATION_SUMMARY.md          This documentation update summary
├── FILES_OVERVIEW.md                 This file
├── assets/
│   ├── image.png                     Screenshot of UserCenter unsigned in
│   ├── image-1.png                   Screenshot of UserCenter signed in
│   └── feature-image.png             Feature announcement image
└── notes/
    ├── tasks-v2.md                   Detailed task breakdown (v0.1.9 improvements)
    ├── tasks-imprv.md                Improvement backlog and completed tasks
    ├── implement_auth.md             Auth flow implementation notes
    ├── todo.md                        Project TODO list
    ├── CALLBACK_EXAMPLE.md            Callback handling reference
    └── INFINITE_RENDER_FIX.md         Notes on infinite render fix
```

## Scripts (Package Commands)

```
package.json scripts:
├── npm run build             Vite build + TypeScript declarations
├── npm run build:check       Check bundle size against budget
├── npm run dev               Watch mode for TypeScript
├── npm run lint              ESLint check
├── npm run lint:fix          ESLint auto-fix
├── npm run type-check        TypeScript type checking
├── npm run test              Vitest unit and integration tests
├── npm run test:watch        Vitest watch mode
├── npm run test:ui           Vitest interactive UI
├── npm run test:coverage     Test coverage report
├── npm run test:smoke        Smoke test fixtures
├── npm run validate          Full CI validation (lint → types → test → build)
└── npm run clean             Remove build artifacts

See package.json for the full list.
```

## Key Statistics

- **Total files:** ~130 (including tests and examples)
- **Core library files:** ~25 (src/*.ts + src/server/*.ts)
- **Test files:** ~20 (vitest coverage)
- **Example apps:** 2 (Vite + Next.js)
- **Smoke fixtures:** 5 (comprehensive integration tests)
- **Documentation files:** 10+ (guides, API refs, examples)
- **Lines of code (src/):** ~3,000
- **Lines of tests:** ~2,500
- **Bundle size (main):** ~45 KB gzipped
- **Bundle size (backend):** ~15 KB gzipped

## File Dependencies

```
Frontend:
  AuthProvider (context.tsx)
    ├── @logto/react
    ├── useAuthContext (internal)
    ├── jwtCookieUtils (utils.ts)
    └── ...

  useAuth hook
    └── useAuthContext (context.tsx)

  usePermission hook
    └── useAuthContext (context.tsx)

Backend:
  verifyNextAuth
    ├── verifyLogtoToken (verify-auth.ts)
    ├── JWT verification (jose)
    └── JWKS caching

  createExpressAuthMiddleware
    ├── verifyAuth helper
    └── Cookie parsing

CSRF:
  createCsrfMiddleware (Express)
  verifyCsrfToken (Next.js)
    └── Crypto for token generation
```

## Publishing

```
Published Entrypoints:
├── @ouim/logto-authkit              src/index.ts
├── @ouim/logto-authkit/server      src/server/index.ts
└── @ouim/logto-authkit/bundler-config  src/bundler-config.ts

Distribution:
├── dist/esm/                        ES modules (for bundlers)
├── dist/cjs/                        CommonJS (for Node.js)
└── dist/types/                      TypeScript type definitions
```

## Development Workflow

1. **Edit source** → `src/`
2. **Run tests** → `npm test`
3. **Build locally** → `npm run build`
4. **Check types** → `npm run type-check`
5. **Validate all** → `npm run validate`
6. **Commit & push** → GitHub Actions CI runs
7. **Create release** → npm publish workflow

## Additional Resources

See `docs/` folder for detailed guides:
- [docs/README.md](./README.md) — Full documentation index
- [CONTRIBUTING.md](../CONTRIBUTING.md) — Contributing guidelines
- [AGENTS.md](../AGENTS.md) — AI assistant guidance

---

**Last updated:** March 30, 2026
