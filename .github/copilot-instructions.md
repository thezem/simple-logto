# Project Guidelines for simple-logto

This repository contains a small monolithic library for simplifying Logto authentication in React apps. It packages both frontend UI/hooks/contexts and backend JWT verification helpers in a single npm module.

## Code Style

- Language: **TypeScript with ES modules** targeting `ES2020`.
- The `tsconfig.json` enables `strict` mode and common safety flags (`noUnusedLocals`, `noFallthroughCasesInSwitch`, etc.). Follow these expectations when adding new code.
- No linter configuration is present; use the existing source as examples for formatting:
  - `src/*.ts(x)` files show idiomatic exports, functional React components, and `async/await` usage.
  - Keep imports ordered logically (external packages first, then internal paths).
- All new exports must be re‑exported in `src/index.ts` so they become part of the package API.
- Backend helpers live under `src/backend` with CJS/ESM output controlled by the `exports` field in `package.json`.

## Architecture

- **Frontend**: React components/hooks under `src/` such as `AuthProvider`, `useAuth`, `UserCenter`, `CallbackPage`, etc. UI primitives are in `src/components/ui` and `src/components/utils`.
- **Bundler configuration helpers** exist in `bundler-config.ts` for Vite, Webpack and Next.js.
- **Backend**: JWT verification helpers and middleware live in `src/backend`. This code is shipped as part of the npm package and is independent of React.
- Types are declared in `src/types.ts` and exported through the index file.
- Examples of usage are available in markdown files at the root (`CALLBACK_EXAMPLE.md`, `INFINITE_RENDER_FIX.md`) and in `src/backend/README.md`.

## Build and Test

- **Install dependencies**: `npm install` (workspace has no tests).
- **Build** the library with `npm run build` which runs `vite build` and `tsc --emitDeclarationOnly`.
- `npm run clean` removes the `dist` folder.
- During development you can run `npm run dev` to watch TypeScript; the library does not include a runnable demo application.

_Note: there are no automated tests in this repository; any new functionality should be manually verified by integrating it into a consuming project or adding new example files._

## Project Conventions

- The package is published under the scope `@ouim/simple-logto`.
- Keep `peerDependencies` up‑to‑date (`@logto/react`, `react`, `react-dom`).
- Avoid introducing runtime dependencies that will bloat consumer bundles; most of the frontend is zero‑dependencies apart from UI primitives already used.
- When touching backend code, remember it is used by Node.js and must not rely on DOM APIs.
- Documentation is primarily the root `readme.md` and `src/backend/README.md`—update these when behavior changes.
- Example servers are provided in `src/backend/example-express.js` and other files; they illustrate how middleware is used and can be executed via Node for manual testing.

## Integration Points

- External dependencies include `@logto/react`, `jose` for JWT handling, `@fingerprintjs/fingerprintjs` for guest mode, and various Radix UI components for the user center.
- Bundler configuration helpers are necessary to support multiple build environments; use `getBundlerConfig` or the pre‑built configs when customizing.
- The backend JWT helpers reach out to a JWKS endpoint; ensure network calls are mocked or stubbed when writing new code.

## Security

- Authentication code deals with JWTs; maintain strict validation and do not disable runtime checks.
- The backend README describes error cases and token sources. Any changes to token parsing must preserve the order: cookie first, then Authorization header.
- No secrets or environment variables are stored in the repo. Users configure `logtoUrl`, `audience`, etc., at runtime.

---

> _If anything isn't covered above or you need more context for a particular area, please open an issue or ask for clarification so the instructions can be improved._
