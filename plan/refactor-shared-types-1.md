---
goal: Extract and centralize shared TypeScript types from apps/web and apps/api into packages/types
version: 1
date_created: 2026-04-08
last_updated: 2026-04-08
owner: ''
status: 'Planned'
tags: [refactor, architecture, chore, migration]
---

# Refactor: Extract Shared TypeScript Types into packages/types

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

Both `apps/web` (`@repo/frontend`) and `apps/api` (`@repo/backend`) currently define their own types in isolation, creating a risk of type drift between the API contract and the frontend consumer. This plan establishes a `packages/types` workspace package (`@repo/types`) that becomes the single source of truth for all domain-level types shared across apps. Success means both apps import shared types exclusively from `@repo/types`, the package builds cleanly, and no duplicate or divergent type definitions exist across the boundary.

## 1. Requirements & Constraints

- **REQ-001**: Create a `packages/types` package exporting all domain-level TypeScript interfaces, enums, and type aliases that are referenced in both `apps/api` and `apps/web`.
- **REQ-002**: The package must be consumable by both `@repo/frontend` (Vite / ESNext bundler resolution) and `@repo/backend` (CommonJS / NestJS build).
- **REQ-003**: `apps/api` response DTOs that are also consumed by `apps/web` must be defined (or re-exported) from `@repo/types`.
- **REQ-004**: No type duplicates may remain in `apps/web/src` or `apps/api/src` after migration; only app-specific types (e.g., component prop types, NestJS decorators) stay in their respective apps.
- **CON-001**: Must not break the existing `pnpm -r build` pipeline — both apps must continue to build after the migration.
- **CON-002**: `apps/web` uses `"moduleResolution": "bundler"` (Vite) and `apps/api` uses `"moduleResolution": "node"` (CommonJS); the shared package must emit `.js` + `.d.ts` so NestJS can resolve it at runtime, while the frontend can consume type-only imports.
- **CON-003**: Do not add `.js` source files to `packages/types/src/` — TypeScript only, per monorepo conventions.
- **CON-004**: Do not import from `apps/` inside `packages/` — dependency direction is packages → apps only.
- **GUD-001**: No barrel `index.ts` unless the package explicitly exports a public API surface — `packages/types` is a public API surface, so a single `src/index.ts` re-export barrel is appropriate here.
- **GUD-002**: Use the workspace protocol for cross-package references: `"@repo/types": "workspace:*"`.
- **PAT-001**: Follow the NestJS DTO naming convention: `CreateFooDto`, `UpdateFooDto`, `FooResponseDto` for request/response shapes.
- **PAT-002**: Use `interface` for object shapes, `enum` (or `const` enum) for finite value sets, and `type` aliases for unions/intersections.

## 2. Implementation Steps

### Phase 1: Scaffold the packages/types Package

- GOAL-001: Create a fully configured, buildable `@repo/types` package with its own `package.json`, `tsconfig.json`, and entry point so that it can be referenced by both apps before any types are migrated.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Create directory `packages/types/src/` | | |
| TASK-002 | Write `packages/types/package.json` with `"name": "@repo/types"`, `"main": "dist/index.js"`, `"types": "dist/index.d.ts"`, `"exports"` field covering CJS and ESM, and a `"build": "tsc"` script | | |
| TASK-003 | Write `packages/types/tsconfig.json` targeting `ES2020`, `"module": "CommonJS"`, `"declaration": true`, `"outDir": "dist"`, `"rootDir": "src"` — no `emitDecoratorMetadata` needed since this package is type-only | | |
| TASK-004 | Create `packages/types/src/index.ts` as the public re-export barrel (empty initially) | | |
| TASK-005 | Verify `pnpm-workspace.yaml` already includes `"packages/*"` (it does — no change needed) | | |
| TASK-006 | Run `pnpm install` from repo root to register `@repo/types` in the workspace | | |
| TASK-007 | Run `pnpm -F @repo/types build` to confirm the empty package compiles cleanly | | |

### Phase 2: Identify and Define Shared Types

- GOAL-002: Audit both apps for type definitions that cross the API boundary, write canonical versions in `packages/types/src/`, and re-export them from the barrel. Because the project is in its initial state, this phase also establishes the foundational domain types the apps will grow into.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-008 | Audit `apps/api/src/` for all exported interfaces, classes used as response shapes, and DTOs (currently: `app.service.ts` returns `string` from `getHello()` — document existing API surface as baseline) | | |
| TASK-009 | Audit `apps/web/src/` for any locally defined interfaces or type aliases used in API calls or shared data models (currently minimal — document as baseline) | | |
| TASK-010 | Create `packages/types/src/api.ts` defining the `HelloResponse` interface (`{ message: string }`) to represent the existing `GET /api` response contract from `app.controller.ts` | | |
| TASK-011 | Create `packages/types/src/common.ts` for any utility types shared across the boundary (e.g., `ApiResponse<T>`, `PaginatedResult<T>`, `ErrorResponse`) | | |
| TASK-012 | Re-export all new types from `packages/types/src/index.ts` | | |
| TASK-013 | Run `pnpm -F @repo/types build` and confirm all types compile without errors | | |

### Phase 3: Wire @repo/types into apps/api

- GOAL-003: Add `@repo/types` as a dependency of `@repo/backend` and update `apps/api/src/` to import shared types from the package instead of defining them locally.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-014 | Add `"@repo/types": "workspace:*"` to `dependencies` in `apps/api/package.json` | | |
| TASK-015 | Run `pnpm install` from repo root | | |
| TASK-016 | Update `apps/api/src/app.service.ts`: change `getHello()` return type to use the shared `HelloResponse` type from `@repo/types` (or keep `string` if the response is bare — document the decision) | | |
| TASK-017 | Add `paths` alias `"@repo/types": ["../../packages/types/dist/index.d.ts"]` (or use `tsconfig-paths`) to `apps/api/tsconfig.json` so TypeScript resolves the package during compilation without relying solely on `node_modules` symlinks | | |
| TASK-018 | Run `pnpm -F @repo/backend build` and verify it succeeds | | |
| TASK-019 | Run `pnpm -F @repo/backend test` and verify all existing tests pass | | |

### Phase 4: Wire @repo/types into apps/web

- GOAL-004: Add `@repo/types` as a dependency of `@repo/frontend` and update `apps/web/src/` to import shared types from the package.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-020 | Add `"@repo/types": "workspace:*"` to `dependencies` in `apps/web/package.json` | | |
| TASK-021 | Run `pnpm install` from repo root | | |
| TASK-022 | Add `paths` alias `"@repo/types": ["../../packages/types/src/index.ts"]` to `apps/web/tsconfig.json` under `compilerOptions.paths` (Vite resolves from source; no build step needed for type-only imports) | | |
| TASK-023 | Update `apps/web/vite.config.ts`: add `resolve.alias` entry mapping `@repo/types` to `../../packages/types/src/index.ts` so Vite can bundle the types at runtime if any runtime values (enums) are imported | | |
| TASK-024 | Update `apps/web/src/App.tsx` (or any component making API calls) to import response types from `@repo/types` rather than defining them inline | | |
| TASK-025 | Run `pnpm -F @repo/frontend build` and verify it succeeds | | |

### Phase 5: Validation and Cleanup

- GOAL-005: Confirm no duplicate type definitions remain across apps, the full monorepo build is green, and lint passes.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-026 | Search `apps/web/src/` and `apps/api/src/` for any remaining inline definitions of types that have been migrated to `@repo/types`; remove duplicates | | |
| TASK-027 | Run `pnpm build` from repo root (builds all packages in dependency order) and verify all three packages succeed | | |
| TASK-028 | Run `pnpm lint` from repo root and fix any import-related lint errors | | |
| TASK-029 | Run `pnpm test` from repo root and verify all existing tests pass | | |
| TASK-030 | Add `packages/types/dist/` to `.gitignore` (or verify it is already excluded) | | |

## 3. Alternatives

- **ALT-001**: Keep types defined locally in `apps/api` and use OpenAPI/Swagger code generation to produce types for `apps/web` — Not chosen because it adds significant tooling complexity (codegen pipeline, schema maintenance) for a project that is in its early stages and can share types directly via the workspace.
- **ALT-002**: Define shared types directly in `apps/api` and import them into `apps/web` — Not chosen because `apps/web` must never import from `apps/api` (CLAUDE.md constraint) and this would create a circular dependency risk.
- **ALT-003**: Use `packages/types` as a source-only package without a build step, relying on `paths` aliases in both apps — Not chosen because `apps/api` uses CommonJS and NestJS resolves modules at runtime; the package needs a compiled `dist/` to be reliably resolvable in the NestJS process.
- **ALT-004**: Use `zod` schemas as the single source of truth and infer TypeScript types from them — Not chosen at this stage because it introduces a runtime dependency and adds complexity beyond what is needed for the current scope; can be revisited as a future enhancement.

## 4. Dependencies

- **DEP-001**: `pnpm` workspaces (already configured via `pnpm-workspace.yaml`) — Required to link `@repo/types` into both apps via the `workspace:*` protocol.
- **DEP-002**: `typescript ~5.7.2` — Already installed in both apps; `packages/types` will use the same version pinned as a dev dependency to ensure consistent compilation.
- **DEP-003**: `tsconfig-paths ^4.2.0` — Already a dev dependency of `@repo/backend`; used so NestJS resolves workspace package paths at runtime during `nest start --watch`.

## 5. Files

- **FILE-001**: `packages/types/package.json` — Created. Defines `@repo/types` with build script, main/types/exports fields.
- **FILE-002**: `packages/types/tsconfig.json` — Created. TypeScript config targeting CommonJS with declaration emit.
- **FILE-003**: `packages/types/src/index.ts` — Created. Public re-export barrel for all shared types.
- **FILE-004**: `packages/types/src/api.ts` — Created. Defines `HelloResponse` and future API contract types.
- **FILE-005**: `packages/types/src/common.ts` — Created. Defines generic utility types: `ApiResponse<T>`, `ErrorResponse`, `PaginatedResult<T>`.
- **FILE-006**: `apps/api/package.json` — Modified. Adds `"@repo/types": "workspace:*"` to `dependencies`.
- **FILE-007**: `apps/api/tsconfig.json` — Modified. Adds `paths` alias for `@repo/types` pointing to compiled declarations.
- **FILE-008**: `apps/api/src/app.service.ts` — Modified. Updates return type annotation to reference `@repo/types` where applicable.
- **FILE-009**: `apps/web/package.json` — Modified. Adds `"@repo/types": "workspace:*"` to `dependencies`.
- **FILE-010**: `apps/web/tsconfig.json` — Modified. Adds `paths` alias for `@repo/types` pointing to package source.
- **FILE-011**: `apps/web/vite.config.ts` — Modified. Adds `resolve.alias` for `@repo/types` so Vite can bundle enum values.
- **FILE-012**: `apps/web/src/App.tsx` — Modified. Imports API response types from `@repo/types` when making API calls.
- **FILE-013**: `.gitignore` (root or `packages/types/`) — Modified. Ensures `packages/types/dist/` is excluded from version control.
- **FILE-014**: `pnpm-lock.yaml` — Modified automatically by `pnpm install` after adding workspace deps.

## 6. Testing

- **TEST-001**: Verify `packages/types` compiles without TypeScript errors — Run `pnpm -F @repo/types build` and assert exit code 0. No dedicated test file needed for a type-only package, but a `tsc --noEmit` check confirms type validity.
- **TEST-002**: Verify `apps/api` unit tests still pass after migration — Run `pnpm -F @repo/backend test`; existing `app.controller.spec.ts` (if present) and `app.service.spec.ts` should pass without changes.
- **TEST-003**: Verify `apps/web` builds cleanly after adding the `@repo/types` dependency — Run `pnpm -F @repo/frontend build` and assert exit code 0.
- **TEST-004**: Type assignment test — Add a `packages/types/src/index.test-d.ts` (type-only assertions using `tsd` or inline `satisfies`) to confirm exported types are assignable as expected; run as part of the types package build check.
- **TEST-005**: End-to-end smoke test — After `pnpm dev`, confirm `GET http://localhost:4000/api` returns `"Hello from NestJS!"` and the frontend at `http://localhost:3000` renders without console type errors.

## 7. Risks & Assumptions

- **RISK-001**: The two apps use different `moduleResolution` strategies (`bundler` vs `node`/CommonJS), which can cause `@repo/types` to be resolved differently. — Mitigation: Emit both CJS (`dist/index.js`) and type declarations (`dist/index.d.ts`) from the package, and configure `exports` in `package.json` to cover both; use `paths` aliases in each app's tsconfig to guarantee resolution during type-checking.
- **RISK-002**: Vite may not resolve the compiled `dist/` of `@repo/types` for runtime enum values if the alias is not configured. — Mitigation: Add `resolve.alias` in `apps/web/vite.config.ts` pointing to `packages/types/src/index.ts` (source) so Vite can bundle runtime values directly.
- **RISK-003**: NestJS `nest start --watch` may fail to resolve `@repo/types` at runtime without `tsconfig-paths`. — Mitigation: `tsconfig-paths` is already a dev dependency in `@repo/backend`; ensure it is registered in `main.ts` bootstrap or confirm the NestJS CLI webpack config handles it.
- **RISK-004**: Future type additions in `packages/types` may need to trigger rebuilds in both apps during watch mode. — Mitigation: Document that developers must restart `pnpm dev` after modifying `packages/types` until a watch-mode build pipeline (e.g., `tsc --watch` in the types package) is added.
- **ASSUMPTION-001**: The project is in its initial state with minimal business logic; no deeply nested shared types exist yet. The plan establishes the infrastructure and seeds the first types — migrating all domain types is an ongoing practice, not a one-time large migration.
- **ASSUMPTION-002**: No CI pipeline is configured yet (per CLAUDE.md); verification is done locally via `pnpm build`, `pnpm lint`, and `pnpm test`.
- **ASSUMPTION-003**: The `packages/` directory does not yet exist on disk; it will be created as part of TASK-001 when `packages/types/src/` is scaffolded.

## 8. Related Specifications / Further Reading

- `CLAUDE.md` (root) — Monorepo conventions, pnpm workspace setup, package naming, and what not to do.
- `apps/web/CLAUDE.md` — Frontend TypeScript config details (`"moduleResolution": "bundler"`) and shared type import convention (`@repo/<package-name>`).
- `apps/api/CLAUDE.md` — Backend DTO conventions, NestJS module architecture, and TypeScript config (`emitDecoratorMetadata`, CommonJS module).
- [pnpm Workspaces documentation](https://pnpm.io/workspaces) — Workspace protocol and cross-package linking.
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html) — Alternative to `paths` aliases for monorepo type resolution; consider for a future enhancement.
