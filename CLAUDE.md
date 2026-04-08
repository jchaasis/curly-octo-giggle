# Monorepo — Claude Code Guide

## Structure

```
curly-octo-giggle/
├── apps/
│   ├── web/          # @repo/frontend  — React 19 + Vite 6 (port 3000)
│   └── api/          # @repo/backend   — NestJS 11 (port 4000)
├── packages/         # Shared packages (types, utils, etc.) — currently empty
├── pnpm-workspace.yaml
└── package.json      # Root scripts only; no production deps here
```

`apps/web` proxies `/api/*` → `http://localhost:4000` via Vite's dev server proxy.

## Package Manager

**Always use pnpm. Never use npm or yarn.**

| Task | Command |
|------|---------|
| Install all deps | `pnpm install` |
| Add dep to a package | `pnpm -F @repo/frontend add <pkg>` |
| Add dev dep to root | `pnpm add -Dw <pkg>` |
| Run script in one package | `pnpm -F @repo/backend dev` |
| Run script across all packages | `pnpm -r build` |
| Run scripts in parallel | `pnpm --parallel -r dev` |

Filter flag aliases: `-F` = `--filter`. Package names come from each `package.json#name`.

## Root Scripts

```bash
pnpm dev       # starts all apps in parallel (web + api)
pnpm build     # builds all packages recursively
pnpm lint      # lints all packages recursively
pnpm test      # tests all packages recursively
```

## Shared Packages (`packages/`)

Place cross-cutting code here (e.g. `packages/types`, `packages/utils`).
Reference them with workspace protocol: `"@repo/types": "workspace:*"`.
Each shared package needs its own `package.json` with a `name` field.

## Conventions

- TypeScript everywhere — do not add `.js` files to `src/` directories.
- Import paths within a package use relative imports (`./foo`); cross-package imports use the package name (`@repo/types`).
- Environment variables live in `.env` files — **never read, edit, or commit them**.
- No barrel `index.ts` files unless the package explicitly exports a public API surface.

## What NOT to Do

- **Never use `npm` or `yarn`** — this breaks the pnpm lockfile.
- **Never modify `.env` or `.env.*` files** — treat them as read-only secrets.
- **Never install packages at the root** unless they are shared dev tooling (ESLint, TypeScript, etc.).
- **Never import from `apps/` inside `packages/`** — dependency direction is packages → apps only.
- **Never commit `dist/` or `build/` output** — these are gitignored artifacts.
- **Never run `nest generate` without confirming the target directory** — NestJS CLI generates in cwd.

## Linting & Formatting

- ESLint is configured per-package. Run `pnpm lint` from root to lint everything.
- Add a shared ESLint config under `packages/eslint-config` if you want a unified ruleset.

## CI

> Add CI notes here once a pipeline (GitHub Actions, etc.) is configured.
