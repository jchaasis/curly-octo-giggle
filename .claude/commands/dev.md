Start the full development environment — both the frontend (Vite, port 3000) and backend (NestJS, port 4000) in parallel.

Run this command from the monorepo root:

```bash
pnpm dev
```

This executes `pnpm --parallel -r dev`, which runs the `dev` script in every workspace package simultaneously.

- **Frontend** (`@repo/frontend`): `vite` — hot-reload at http://localhost:3000
- **Backend** (`@repo/backend`): `nest start --watch` — hot-reload at http://localhost:4000

To start only one service:

```bash
pnpm -F @repo/frontend dev   # frontend only
pnpm -F @repo/backend dev    # backend only
```
