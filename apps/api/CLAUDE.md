# Backend — Claude Code Guide (`@repo/backend`)

## Stack

- NestJS 11, TypeScript, Express platform
- Runs on: `http://localhost:4000`
- Build output: `dist/`

## Running

```bash
pnpm -F @repo/backend dev          # nest start --watch (hot-reload)
pnpm -F @repo/backend build        # nest build → dist/
pnpm -F @repo/backend start        # run compiled dist/main.js
pnpm -F @repo/backend test         # jest unit tests
pnpm -F @repo/backend test:e2e     # jest e2e tests
pnpm -F @repo/backend lint         # eslint
```

## Module / Controller / Service Architecture

NestJS uses a modules-first architecture. Every feature lives in its own module folder:

```
src/
├── main.ts
├── app.module.ts          # root module — imports feature modules
└── <feature>/
    ├── <feature>.module.ts
    ├── <feature>.controller.ts   # HTTP layer only — no business logic
    ├── <feature>.service.ts      # business logic & data access
    ├── dto/
    │   ├── create-<feature>.dto.ts
    │   └── update-<feature>.dto.ts
    └── <feature>.spec.ts         # unit tests for the service
```

**Controller responsibility**: parse/validate request, call service, return response. No business logic.  
**Service responsibility**: all logic, database calls, external API calls. No HTTP concepts.

## DTO Conventions

- DTOs are plain classes decorated with `class-validator` decorators.
- Name pattern: `CreateFooDto`, `UpdateFooDto`, `FooResponseDto`.
- Use `@IsString()`, `@IsInt()`, `@IsEmail()`, etc. from `class-validator`.
- Enable `ValidationPipe` globally in `main.ts` with `{ whitelist: true, forbidNonWhitelisted: true }`.
- Separate request DTOs from response DTOs — never expose internal DB entities directly.

> `class-validator` and `class-transformer` are not installed yet. Add when needed:
> `pnpm -F @repo/backend add class-validator class-transformer`
> Then enable: `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))` in `main.ts`.

## NestJS CLI

Use `nest generate` (or `nest g`) to scaffold — always run from `apps/api/`:

```bash
pnpm -F @repo/backend exec nest g module users
pnpm -F @repo/backend exec nest g controller users --no-spec
pnpm -F @repo/backend exec nest g service users
```

## Testing

- **Unit tests**: `*.spec.ts` co-located with the file under test. Use `@nestjs/testing` `Test.createTestingModule`.
- **E2E tests**: `test/*.e2e-spec.ts`. Uses `supertest` against a full NestJS app instance.
- Mock services in unit tests using `jest.fn()` providers — do not spin up the real app.
- Run all unit tests: `pnpm -F @repo/backend test`
- Run e2e: `pnpm -F @repo/backend test:e2e`

## TypeScript

- `tsconfig.json` enables `emitDecoratorMetadata` and `experimentalDecorators` — required by NestJS.
- Use `tsconfig.build.json` (excludes test files) for the production build.

## What NOT to Do

- **Never put business logic in controllers** — keep them thin HTTP adapters.
- **Never expose database entities directly** from endpoints — always map to a response DTO.
- **Never use `any` types** — define proper interfaces or DTOs.
- **Never modify `.env` or `.env.*` files** — use `@nestjs/config` to read them.
- **Never import from `apps/web`** — the backend is unaware of the frontend.
