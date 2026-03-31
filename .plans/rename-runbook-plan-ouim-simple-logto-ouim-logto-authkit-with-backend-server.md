# Rename Runbook Plan: `@ouim/simple-logto` -> `@ouim/logto-authkit` with `/backend` -> `/server`

## Summary

Execute a hard-cut major rename from `@ouim/simple-logto` to `@ouim/logto-authkit`, and rename the published backend subpath from `@ouim/simple-logto/backend` to `@ouim/logto-authkit/server`. There will be no compatibility shim. Instead, make one final release on the old package name that adds explicit deprecation/migration messaging, then publish the renamed package as the new canonical package.

The GitHub repository rename remains a follow-up step after the npm/package transition is stable.

## Decisions Locked

- Canonical new package name: `@ouim/logto-authkit`
- Old package strategy: no shim, cold-cut rename
- Transitional action on old package: publish one final update with strong deprecation/migration messaging
- Release signal: major release
- Backend subpath rename: `/backend` -> `/server`
- Internal code/docs rename scope: full internal rename, not just public imports
- Bundler helper subpath: keep `/bundler-config`
- GitHub repo rename: later, after the package release is stable
- Repo-kept markdown artifact: internal execution runbook
- Recommended runbook path: `docs/RENAME_TO_LOGTO_AUTHKIT_RUNBOOK.md`

## Current State Confirmed

- Current package name in [package.json](G:/simple-logto/package.json): `@ouim/simple-logto`
- Current public subpaths:
  - root: `@ouim/simple-logto`
  - backend: `@ouim/simple-logto/backend`
  - bundler config: `@ouim/simple-logto/bundler-config`
- Current repo/docs/examples contain roughly 232 references to `simple-logto` or `@ouim/simple-logto`
- `@ouim/logto-authkit` appeared unclaimed on npm on March 30, 2026

## Deliverable To Add To Repo

Create:

- [docs/RENAME_TO_LOGTO_AUTHKIT_RUNBOOK.md](G:/simple-logto/docs/RENAME_TO_LOGTO_AUTHKIT_RUNBOOK.md)

Purpose:
- internal execution runbook for any agent/engineer
- exact rename targets
- exact file classes to update
- release order
- validation steps
- npm deprecation steps
- GitHub follow-up steps
- rollback notes

## Public API / Interface Changes

This release intentionally introduces breaking package identity changes only.

### Package install name

- Old: `@ouim/simple-logto`
- New: `@ouim/logto-authkit`

### Root import

- Old: `@ouim/simple-logto`
- New: `@ouim/logto-authkit`

### Server import

- Old: `@ouim/simple-logto/backend`
- New: `@ouim/logto-authkit/server`

### Bundler helper import

- Old: `@ouim/simple-logto/bundler-config`
- New: `@ouim/logto-authkit/bundler-config`

### Behavioral compatibility goal

- Preserve runtime behavior and exported symbols
- Do not bundle unrelated feature changes into this release
- The only intended breaks are package/subpath naming breaks and user-facing branding strings

## Internal Codebase Rename Scope

Because you chose a full internal rename, implementation should update both public imports and internal structure.

### Source layout target

Recommended internal rename:

- `src/backend/` -> `src/server/`

Affected internal references should be updated accordingly:
- source imports
- test imports
- build outputs
- docs references
- example references
- comments and code samples

### Export map target

`package.json` should publish:

- `.` -> root entrypoint
- `./server` -> server entrypoint
- `./bundler-config` -> bundler entrypoint

The old `./backend` export should be removed from the new package.

## Required Repo Changes

### 1. Package metadata

Update:

- `package.json`
  - `name`
  - `description`
  - `exports`
  - `repository.url` only when repo rename later happens
  - keywords if desired to strengthen `authkit` discovery
- `package-lock.json`
- any scripts or audits that assert the old package name
- tarball expectations in docs/scripts/tests

### 2. Source and entrypoints

Update:

- root package imports/comments/examples
- backend/server folder paths and imports
- any entrypoint re-export paths
- any tests referencing `src/backend`
- any generated declaration assumptions that include backend paths

### 3. Documentation and examples

Update all active docs/examples to new install/import strings:

- [README.md](G:/simple-logto/README.md)
- [AGENTS.md](G:/simple-logto/AGENTS.md)
- [CONTRIBUTING.md](G:/simple-logto/CONTRIBUTING.md)
- [CHANGELOG.md](G:/simple-logto/CHANGELOG.md)
- [SECURITY.md](G:/simple-logto/SECURITY.md)
- `docs/`
- `example_app/`
- `examples/`
- `smoke-fixtures/`

### 4. Branding strings

Rename consumer-visible branding:

- titles using “simple-logto”
- docs headings
- README title
- example page copy
- warning/log prefixes such as `[simple-logto]` -> `[logto-authkit]`

## Release Strategy

## Phase 0: Final old-package release

Make one final release under `@ouim/simple-logto` before the rename.

Purpose:
- warn existing users clearly
- point them to the new package and the `/server` path change
- reduce surprise before the cold-cut rename

Content of this final old-package release:
- README notice at top
- changelog entry announcing the move
- optional runtime/dev warnings where appropriate if they are low-risk and not noisy
- updated docs that clearly say the next release line moves to `@ouim/logto-authkit`
- no large refactors in this release

Recommended message content:
- package moved to `@ouim/logto-authkit`
- backend import path becomes `/server`
- `@ouim/simple-logto/backend` will not continue
- next release line is a major rename

After publishing this old-package update:
- deprecate `@ouim/simple-logto` on npm with a precise message after the new package is live

## Phase 1: Rename implementation in repo

Implement the actual rename:

- package name -> `@ouim/logto-authkit`
- subpath `./backend` -> `./server`
- internal folder `src/backend` -> `src/server`
- all examples/docs/tests/comments updated
- old package and old `/backend` references removed from active code paths

## Phase 2: Validation

Run the full local gate required by repo instructions:

- `npm run lint`
- `npx tsc --project tsconfig.build.json --noEmit`
- `npx vitest run`
- `npm run build`
- `npm run test:size`
- `npm run test:package`
- `npm run test:smoke`

Also verify:
- packed tarball contains correct new package metadata
- no export map references to `backend`
- smoke fixtures import `/server` successfully
- README import examples match actual exports

## Phase 3: Publish new canonical package

Immediately before publish:

1. Re-check availability of `@ouim/logto-authkit`
2. Confirm npm scope permissions
3. Confirm provenance/publish settings still work under the new name

Publish:
- `@ouim/logto-authkit`

Post-publish verification:
- `npm view @ouim/logto-authkit`
- install in a clean temp project
- root import works
- `/server` import works
- `/bundler-config` import works

## Phase 4: Deprecate old package

After the new package is confirmed live:

1. Deprecate `@ouim/simple-logto` on npm
2. Use a concrete deprecation message such as:
   - `Package moved to @ouim/logto-authkit. Replace @ouim/simple-logto with @ouim/logto-authkit and change /backend imports to /server.`

No shim package is created.

## GitHub Follow-up Plan

Do this after the new npm package is stable.

### Repository rename follow-up

1. Rename GitHub repository from `simple-logto` to `logto-authkit`
2. Update:
   - `repository.url` in `package.json`
   - README links
   - changelog compare links
   - docs links
   - badges
   - contributing/setup clone URLs
3. Confirm GitHub redirects from old repo URLs work
4. Confirm npm package page points to the correct repository after the rename

### Communication follow-up

1. Publish a major release note
2. Create or pin an issue/discussion with:
   - old package name
   - new package name
   - old backend path
   - new server path
   - exact install/import replacements
3. Update any release docs/workflows that still mention the old repo name

## Exact Migration Messaging To Standardize

Use the same replacement mapping everywhere:

- `npm install @ouim/simple-logto` -> `npm install @ouim/logto-authkit`
- `from '@ouim/simple-logto'` -> `from '@ouim/logto-authkit'`
- `from '@ouim/simple-logto/backend'` -> `from '@ouim/logto-authkit/server'`
- `from '@ouim/simple-logto/bundler-config'` -> `from '@ouim/logto-authkit/bundler-config'`

## Markdown File Content Plan

The planned `docs/RENAME_TO_LOGTO_AUTHKIT_RUNBOOK.md` should include:

- Title: `Runbook: Rename @ouim/simple-logto to @ouim/logto-authkit`
- Goal
- Locked decisions
- Old -> new mapping table
- Files and areas likely to change
- Pre-rename old-package release checklist
- Main rename execution checklist
- Validation commands
- npm publish steps
- npm deprecation steps
- GitHub follow-up steps
- Rollback notes

Recommended mapping table in the file:

- package: `@ouim/simple-logto` -> `@ouim/logto-authkit`
- subpath: `/backend` -> `/server`
- subpath: `/bundler-config` -> unchanged
- repo name: `simple-logto` -> `logto-authkit` later

## Test Cases and Validation Scenarios

### Source-level checks

- No active source imports refer to `@ouim/simple-logto`
- No active source imports refer to `/backend`
- internal source tree no longer uses `src/backend`
- export map uses `./server`, not `./backend`
- type declarations resolve correctly for root, `/server`, and `/bundler-config`

### Consumer smoke checks

Update and pass smoke tests for:
- React/Vite fixture using `@ouim/logto-authkit`
- Node backend fixture using `@ouim/logto-authkit/server`
- bundler-config fixture using `@ouim/logto-authkit/bundler-config`
- Next.js app-router fixture using the new root and `/server` paths

### Package checks

- `npm pack` tarball filename reflects the new package name
- tarball contents include the correct entrypoints
- `npm run test:package` passes with new README import strings
- `npm run test:size` still passes after rename
- `npm run test:smoke` passes after fixture updates

### Documentation checks

- README quickstart uses only the new package name
- backend/server docs consistently say `server`, not `backend`, except where migration notes intentionally mention the old path
- contributor docs and release docs reflect the rename plan accurately

### Registry checks

- old package final update is published successfully
- new package is published successfully
- old package is deprecated after the new package goes live
- deprecation message includes both package rename and `/backend` -> `/server`

## Acceptance Criteria

The rename is complete when all of the following are true:

- Final old-package update has been published with migration/deprecation messaging
- New package `@ouim/logto-authkit` is published and installable
- `@ouim/logto-authkit/server` works as the replacement for the old backend entrypoint
- `@ouim/logto-authkit/bundler-config` works unchanged
- No shim package exists
- Old package `@ouim/simple-logto` is deprecated on npm with a precise replacement message
- Full local CI gate passes under the new package/subpath names
- Smoke tests pass with `/server`
- Internal docs/runbook are committed in repo
- GitHub repo rename is either completed later or explicitly tracked as follow-up

## Assumptions and Defaults

- The `@ouim` npm scope is publishable for the new package
- The rename release should not include unrelated behavior changes
- The old package gets one final pre-rename release before full deprecation
- `/bundler-config` remains unchanged
- The internal runbook belongs under `docs/`
- All active references to `backend` should be converted to `server`
- GitHub repo rename stays deferred until after the npm rename is stable
