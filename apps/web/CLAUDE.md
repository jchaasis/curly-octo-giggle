# Frontend — Claude Code Guide (`@repo/frontend`)

## Stack

- React 19, TypeScript, Vite 6
- Dev server: `http://localhost:3000`
- API proxy: `/api/*` → `http://localhost:4000` (configured in `vite.config.ts`)

## Running

```bash
pnpm -F @repo/frontend dev      # start dev server
pnpm -F @repo/frontend build    # tsc + vite build → dist/
pnpm -F @repo/frontend preview  # preview production build
pnpm -F @repo/frontend lint     # eslint
```

## Component Conventions

- One component per file; filename matches the exported component name (`UserCard.tsx`).
- Co-locate related files: `UserCard.tsx`, `UserCard.module.css`, `UserCard.test.tsx` in the same directory.
- Use function declarations for top-level components, arrow functions for inline/local components.
- Props interfaces are named `<ComponentName>Props` and defined directly above the component.
- Do not use `React.FC` — type props directly: `function Foo({ bar }: FooProps)`.
- Prefer named exports over default exports for components so refactoring tools work reliably.
  Exception: page-level route components may use default exports if the router requires it.

## State & Data Fetching

- Local UI state: `useState` / `useReducer`.
- Server state: add a data-fetching library (React Query, SWR) — **none is installed yet, choose and add one**.
- Avoid prop-drilling beyond 2 levels; use context or a state library instead.

## Vite Config (`vite.config.ts`)

- Plugins: `@vitejs/plugin-react` (Babel-based fast refresh).
- **Do not change the proxy target** without also updating the NestJS port in `apps/api`.
- Path aliases (e.g. `@/` → `src/`) can be added under `resolve.alias` — also add them to `tsconfig.json#paths`.

## TypeScript

- `tsconfig.json` uses `"moduleResolution": "bundler"` — Vite handles resolution, not Node.
- Shared types from `packages/` are imported as `@repo/<package-name>`.

## Testing

> No test runner is installed yet. Recommended: **Vitest** (shares Vite config, zero extra setup).
>
> To add: `pnpm -F @repo/frontend add -D vitest @testing-library/react @testing-library/user-event jsdom`
>
> Then add to `package.json`: `"test": "vitest run"` and `"test:watch": "vitest"`.

- Test files: `*.test.tsx` or `*.spec.tsx` co-located with the component.
- Test behaviour, not implementation — prefer `@testing-library/react` queries over internal state assertions.

## What NOT to Do

- **Never import from `apps/api`** — consume the backend only via HTTP through the `/api` proxy.
- **Never hard-code `localhost:4000`** — always use relative `/api/...` paths so the proxy handles routing.
- **Never use `dangerouslySetInnerHTML`** without sanitizing user-supplied content.
- **Never commit `.env.local`** — it contains secrets.
