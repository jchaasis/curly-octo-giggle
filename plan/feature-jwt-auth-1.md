---
goal: Add JWT authentication to the NestJS backend API
version: 1
date_created: 2026-04-08
last_updated: 2026-04-08
owner: ''
status: 'Planned'
tags: [feature, auth, security]
---

# JWT Authentication for NestJS Backend API

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This plan adds JWT-based authentication to the `@repo/backend` NestJS 11 application. The implementation introduces a dedicated `auth` module with registration, login, and token-refresh endpoints, plus a reusable JWT guard that protects any route decorated with `@UseGuards(JwtAuthGuard)`. Success means the API refuses unauthenticated requests to protected routes with a `401 Unauthorized` response, and returns signed JWTs to valid login requests.

## 1. Requirements & Constraints

- **REQ-001**: Users can register with an email and password; the API stores a bcrypt-hashed password (never plaintext).
- **REQ-002**: A `POST /api/auth/login` endpoint accepts credentials and returns a signed JWT access token (and optionally a refresh token).
- **REQ-003**: A `POST /api/auth/register` endpoint creates a new user and returns basic profile data.
- **REQ-004**: Protected routes validate the JWT from the `Authorization: Bearer <token>` header and reject requests with a missing or invalid token.
- **REQ-005**: A `GET /api/auth/me` endpoint returns the authenticated user's profile using the JWT payload.
- **SEC-001**: JWT secrets are read from environment variables (`JWT_SECRET`, `JWT_EXPIRES_IN`) via `@nestjs/config` — never hard-coded.
- **SEC-002**: Passwords are hashed with `bcrypt` (cost factor ≥ 10) before storage.
- **SEC-003**: JWT payloads must contain only non-sensitive fields (`sub`, `email`) — no password hash or internal IDs beyond user ID.
- **CON-001**: No database is currently installed; a simple in-memory user store suffices for the initial implementation. The `UsersService` must be designed so it is straightforward to swap in TypeORM/Prisma later.
- **CON-002**: Must not break the existing `GET /api` endpoint in `AppController`.
- **GUD-001**: Follow the NestJS module-per-feature pattern documented in `apps/api/CLAUDE.md` — each feature lives under `src/<feature>/`.
- **GUD-002**: DTOs use `class-validator` decorators; `ValidationPipe` is enabled globally in `main.ts` with `{ whitelist: true, forbidNonWhitelisted: true }`.
- **PAT-001**: Controllers are thin HTTP adapters; all logic lives in services.
- **PAT-002**: Response DTOs are distinct from request DTOs — never expose the internal user object (which includes the password hash) directly.

## 2. Implementation Steps

### Phase 1: Install Dependencies & Enable ValidationPipe

- GOAL-001: Install all required packages and globally enable request validation so subsequent phases can rely on DTO decorators.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Run `pnpm -F @repo/backend add @nestjs/jwt @nestjs/passport passport passport-jwt @nestjs/config bcrypt` to add runtime dependencies. | | |
| TASK-002 | Run `pnpm -F @repo/backend add -D @types/passport-jwt @types/bcrypt` to add dev type definitions. | | |
| TASK-003 | Run `pnpm -F @repo/backend add class-validator class-transformer` (noted as not-yet-installed in `apps/api/CLAUDE.md`). | | |
| TASK-004 | In `apps/api/src/main.ts`, add `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))` after `NestFactory.create`. Also import `ConfigModule` setup so env vars are available at bootstrap. | | |

### Phase 2: ConfigModule Setup

- GOAL-002: Make `JWT_SECRET` and `JWT_EXPIRES_IN` available across the application through `@nestjs/config`.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-005 | Import `ConfigModule.forRoot({ isGlobal: true })` inside `AppModule` at `apps/api/src/app.module.ts`. This makes `ConfigService` injectable anywhere without re-importing `ConfigModule` in each feature module. | | |
| TASK-006 | Create `apps/api/.env` (not committed) with `JWT_SECRET=<random-secret>` and `JWT_EXPIRES_IN=3600s`. Add `.env` to `.gitignore` if not already present. | | |

### Phase 3: Users Module (in-memory store)

- GOAL-003: Provide a `UsersService` that can create users and look them up by email — the only data layer JWT auth needs.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-007 | Create `apps/api/src/users/users.module.ts` exporting `UsersService`. | | |
| TASK-008 | Create `apps/api/src/users/users.service.ts` with an in-memory `Map<string, User>`. Implement `create(email, hashedPassword): User` and `findByEmail(email): User \| undefined`. Define a private `User` interface with `{ id: string; email: string; passwordHash: string }`. | | |
| TASK-009 | Create `apps/api/src/users/dto/create-user.dto.ts` with `@IsEmail()` on `email` and `@IsString() @MinLength(8)` on `password`. | | |
| TASK-010 | Create `apps/api/src/users/dto/user-response.dto.ts` with only `id` and `email` (no `passwordHash`) — used as the public user shape. | | |
| TASK-011 | Import `UsersModule` in `apps/api/src/app.module.ts`. | | |

### Phase 4: Auth Module — Services & Guards

- GOAL-004: Implement the core authentication logic: password hashing, JWT signing/verification, and a reusable guard.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-012 | Create `apps/api/src/auth/auth.module.ts`. Import `UsersModule`, `JwtModule.registerAsync({ useFactory: (cfg) => ({ secret: cfg.get('JWT_SECRET'), signOptions: { expiresIn: cfg.get('JWT_EXPIRES_IN', '3600s') } }), inject: [ConfigService] })`, and `PassportModule`. Export `AuthService` and `JwtAuthGuard`. | | |
| TASK-013 | Create `apps/api/src/auth/auth.service.ts` with: `register(dto: CreateUserDto): Promise<UserResponseDto>` — hashes password with `bcrypt.hash(password, 10)`, calls `UsersService.create`, returns `UserResponseDto`. `login(dto: LoginDto): Promise<{ accessToken: string }>` — finds user by email, verifies password with `bcrypt.compare`, calls `JwtService.sign({ sub: user.id, email: user.email })`, returns token. | | |
| TASK-014 | Create `apps/api/src/auth/dto/login.dto.ts` with `@IsEmail() email` and `@IsString() password`. | | |
| TASK-015 | Create `apps/api/src/auth/strategies/jwt.strategy.ts` implementing `PassportStrategy(Strategy)`. In the constructor inject `ConfigService` to pass `secretOrKey: configService.get('JWT_SECRET')`. Implement `validate(payload): { userId: string; email: string }` returning `{ userId: payload.sub, email: payload.email }`. | | |
| TASK-016 | Create `apps/api/src/auth/guards/jwt-auth.guard.ts` extending `AuthGuard('jwt')` — a thin wrapper so consumers import a named class rather than a magic string. | | |
| TASK-017 | Import `AuthModule` in `apps/api/src/app.module.ts`. | | |

### Phase 5: Auth Controller

- GOAL-005: Expose the register, login, and profile endpoints over HTTP.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-018 | Create `apps/api/src/auth/auth.controller.ts` with: `POST /auth/register` calling `AuthService.register`, `POST /auth/login` calling `AuthService.login`, `GET /auth/me` guarded by `@UseGuards(JwtAuthGuard)` — reads user from `@Request() req` (injected by Passport) and returns `{ userId, email }`. | | |
| TASK-019 | Declare `AuthController` inside `AuthModule`. | | |

### Phase 6: Tests

- GOAL-006: Unit-test the happy path and key error cases so regressions are caught early.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-020 | Create `apps/api/src/auth/auth.service.spec.ts`. Mock `UsersService` and `JwtService`. Test: successful login returns `{ accessToken }`, login with unknown email throws `UnauthorizedException`, login with wrong password throws `UnauthorizedException`, register creates user and returns `UserResponseDto` without `passwordHash`. | | |
| TASK-021 | Create `apps/api/src/users/users.service.spec.ts`. Test: `create` stores a user and returns it, `findByEmail` returns `undefined` for unknown email. | | |
| TASK-022 | Create `apps/api/src/auth/auth.controller.spec.ts`. Mock `AuthService`. Test that controller passes DTO to service and returns the service result unchanged. | | |

## 3. Alternatives

- **ALT-001**: **Session-based authentication (express-session + cookies)** — Not chosen because JWTs are stateless and do not require server-side session storage, making horizontal scaling easier and aligning with the likely future of a SPA/API architecture.
- **ALT-002**: **Use `@nestjs/passport` `LocalStrategy` for login** — Not chosen to reduce boilerplate for this initial pass; `AuthService.login` performs credential validation directly. `LocalStrategy` can be added later if needed for consistency.
- **ALT-003**: **Refresh token rotation** — Not included in this plan to keep scope small. The plan can be extended with a `POST /auth/refresh` endpoint and a separate short-lived/long-lived token pair once the core flow is working.
- **ALT-004**: **Database-backed user store (TypeORM/Prisma)** — Not chosen now because no database is configured in the repo. The `UsersService` in-memory store is designed to be replaced without touching the auth layer.

## 4. Dependencies

- **DEP-001**: `@nestjs/jwt@^10` — JWT signing and verification integrated with the NestJS DI container.
- **DEP-002**: `@nestjs/passport@^10` — Passport.js integration for NestJS; provides `AuthGuard` and `PassportStrategy` base classes.
- **DEP-003**: `passport@^0.7` — Core Passport.js library; peer dependency of `@nestjs/passport`.
- **DEP-004**: `passport-jwt@^4` — Passport strategy that validates JWTs from the `Authorization` header.
- **DEP-005**: `@nestjs/config@^3` — Reads environment variables into `ConfigService`; already a common NestJS package.
- **DEP-006**: `bcrypt@^5` — Password hashing. Dev type: `@types/bcrypt`.
- **DEP-007**: `class-validator@^0.14` + `class-transformer@^0.5` — DTO validation (noted as not-yet-installed in `apps/api/CLAUDE.md`).

## 5. Files

- **FILE-001**: `apps/api/src/main.ts` — Add `ValidationPipe` global setup and `ConfigModule` bootstrap.
- **FILE-002**: `apps/api/src/app.module.ts` — Import `ConfigModule`, `UsersModule`, and `AuthModule`.
- **FILE-003**: `apps/api/src/users/users.module.ts` — New file; NestJS module exporting `UsersService`.
- **FILE-004**: `apps/api/src/users/users.service.ts` — New file; in-memory user store with `create` and `findByEmail`.
- **FILE-005**: `apps/api/src/users/dto/create-user.dto.ts` — New file; validated DTO for user creation.
- **FILE-006**: `apps/api/src/users/dto/user-response.dto.ts` — New file; public user shape (no password hash).
- **FILE-007**: `apps/api/src/auth/auth.module.ts` — New file; imports `JwtModule`, `PassportModule`, `UsersModule`.
- **FILE-008**: `apps/api/src/auth/auth.service.ts` — New file; register, login, and token issuance logic.
- **FILE-009**: `apps/api/src/auth/auth.controller.ts` — New file; `POST /auth/register`, `POST /auth/login`, `GET /auth/me`.
- **FILE-010**: `apps/api/src/auth/dto/login.dto.ts` — New file; validated DTO for login.
- **FILE-011**: `apps/api/src/auth/strategies/jwt.strategy.ts` — New file; Passport JWT strategy, reads secret from `ConfigService`.
- **FILE-012**: `apps/api/src/auth/guards/jwt-auth.guard.ts` — New file; named wrapper around `AuthGuard('jwt')`.
- **FILE-013**: `apps/api/src/auth/auth.service.spec.ts` — New file; unit tests for `AuthService`.
- **FILE-014**: `apps/api/src/users/users.service.spec.ts` — New file; unit tests for `UsersService`.
- **FILE-015**: `apps/api/src/auth/auth.controller.spec.ts` — New file; unit tests for `AuthController`.
- **FILE-016**: `apps/api/package.json` — Updated with new runtime and dev dependencies after `pnpm add`.

## 6. Testing

- **TEST-001**: `auth.service.spec.ts` — `AuthService.login` returns `{ accessToken: string }` for valid credentials; uses `Test.createTestingModule` with mocked `UsersService` and `JwtService`.
- **TEST-002**: `auth.service.spec.ts` — `AuthService.login` throws `UnauthorizedException` when email not found.
- **TEST-003**: `auth.service.spec.ts` — `AuthService.login` throws `UnauthorizedException` when `bcrypt.compare` returns `false` (wrong password).
- **TEST-004**: `auth.service.spec.ts` — `AuthService.register` stores user and returns `UserResponseDto` with no `passwordHash` field.
- **TEST-005**: `users.service.spec.ts` — `UsersService.create` inserts a record; subsequent `findByEmail` returns it.
- **TEST-006**: `users.service.spec.ts` — `UsersService.findByEmail` returns `undefined` for an unknown email.
- **TEST-007**: `auth.controller.spec.ts` — `AuthController.register` delegates to `AuthService.register` and returns the result.
- **TEST-008**: `auth.controller.spec.ts` — `AuthController.login` delegates to `AuthService.login` and returns `{ accessToken }`.
- **TEST-009**: Manual / e2e smoke test — `curl -X POST http://localhost:4000/api/auth/register` with valid body returns `200` and user object; `POST /api/auth/login` with same credentials returns `{ accessToken }`; `GET /api/auth/me` with token in `Authorization` header returns profile; `GET /api/auth/me` without token returns `401`.

## 7. Risks & Assumptions

- **RISK-001**: `@nestjs/jwt` and `@nestjs/passport` versions may require a peer dependency of `passport` that conflicts with `@types/express` version pinned in `devDependencies`. — Mitigation: pin to `passport@^0.7` which is compatible with NestJS 11; resolve peer warnings after install before proceeding.
- **RISK-002**: The in-memory user store is lost on server restart — no persistence. — Mitigation: this is an explicit constraint (CON-001) and is acceptable for the initial implementation; document a clear upgrade path to a database-backed store.
- **RISK-003**: `ConfigModule.forRoot()` will fail silently if `.env` is missing and no default is set for `JWT_SECRET`. — Mitigation: add a startup validation step (e.g., `@nestjs/config` `validationSchema` with Joi, or a simple guard in `JwtStrategy` constructor) to throw on missing secret.
- **ASSUMPTION-001**: No database (TypeORM, Prisma, MongoDB) is currently set up in `@repo/backend`. The plan assumes a clean in-memory store is acceptable for this phase.
- **ASSUMPTION-002**: The frontend (`@repo/frontend`) will handle storing the JWT in memory or `localStorage` and sending it as a `Bearer` token — this is out of scope for this plan.
- **ASSUMPTION-003**: There is no existing `users` module or `auth` module in `apps/api/src/` — confirmed by codebase exploration.
- **ASSUMPTION-004**: `JWT_EXPIRES_IN` will be set to `3600s` (1 hour) as a reasonable default; this can be changed via the environment variable without code changes.

## 8. Related Specifications / Further Reading

- [NestJS Authentication documentation](https://docs.nestjs.com/security/authentication)
- [NestJS JWT module](https://github.com/nestjs/jwt)
- [passport-jwt strategy](https://www.passportjs.org/packages/passport-jwt/)
- [`apps/api/CLAUDE.md`](../apps/api/CLAUDE.md) — Backend module/controller/service conventions
- [`apps/api/src/app.module.ts`](../apps/api/src/app.module.ts) — Root module to be updated
- [`apps/api/src/main.ts`](../apps/api/src/main.ts) — Bootstrap file to be updated with `ValidationPipe`
