Run all tests across the monorepo.

```bash
pnpm test
```

This executes `pnpm -r test` recursively across all workspace packages.

## Per-package test commands

```bash
# Backend unit tests
pnpm -F @repo/backend test

# Backend unit tests in watch mode
pnpm -F @repo/backend test -- --watch

# Backend e2e tests
pnpm -F @repo/backend test:e2e

# Backend coverage report
pnpm -F @repo/backend test -- --coverage
```

## Frontend

> No test runner is configured yet in `@repo/frontend`. Add Vitest:
>
> ```bash
> pnpm -F @repo/frontend add -D vitest @testing-library/react @testing-library/user-event jsdom
> ```
>
> Then add `"test": "vitest run"` to `apps/web/package.json#scripts`.

## Notes

- Backend tests use Jest with `ts-jest`. Config lives in `apps/api/package.json#jest`.
- E2E tests require the NestJS app to boot — ensure port 4000 is free before running them.
