---
goal: Add React error boundaries to prevent blank screens on component crashes
version: 1
date_created: 2026-04-08
last_updated: 2026-04-08
owner: frontend team
status: 'Planned'
tags: [bugfix, frontend, react, error-handling]
---

# Bugfix: Missing React Error Boundaries

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

The React frontend (`@repo/frontend`) has no error boundaries, meaning any unhandled render-time exception propagates all the way to the root and causes the entire React tree to unmount — leaving users with a blank white screen and no feedback. This plan adds a layered error boundary strategy: a root-level catch-all boundary in `apps/web/src/main.tsx` and a reusable `ErrorBoundary` component that can wrap individual feature areas inside `App.tsx` as the app grows.

## 1. Requirements & Constraints

- **REQ-001**: Unhandled render errors must never produce a blank screen; users must always see a helpful fallback UI.
- **REQ-002**: The root of the application (`main.tsx`) must be wrapped in an error boundary so no crash can escape to the browser's default blank-page behavior.
- **REQ-003**: The `ErrorBoundary` component must accept a custom `fallback` prop so each usage site can provide context-appropriate recovery UI.
- **REQ-004**: The `ErrorBoundary` component must expose an optional `onError` callback prop for logging errors to an external service in the future.
- **REQ-005**: Error details (message + stack) must be displayed in development mode and hidden (generic message only) in production.
- **CON-001**: React error boundaries must be class components — React 19 does not support error boundaries as function components (no hook equivalent for `componentDidCatch`).
- **CON-002**: Must not install new runtime packages if a class-component boundary can be written in-house; the app currently has no error-boundary library.
- **CON-003**: TypeScript strict mode is enabled (`tsconfig.json` — `"strict": true`); all new code must be fully typed.
- **GUD-001**: One component per file; filename matches exported component name (`ErrorBoundary.tsx`) — per `apps/web/CLAUDE.md`.
- **GUD-002**: Named exports are preferred over default exports for components — per `apps/web/CLAUDE.md`. Exception: `App` may keep its default export.
- **PAT-001**: Co-locate the component with any future `ErrorBoundary.test.tsx` in the same directory.
- **PAT-002**: Do not use `React.FC` — type props directly using an explicit props interface.

## 2. Implementation Steps

### Phase 1: Create the Reusable `ErrorBoundary` Component

- GOAL-001: Produce a single, typed, reusable `ErrorBoundary` class component that can be dropped anywhere in the tree.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Create `apps/web/src/components/ErrorBoundary.tsx`. Define `ErrorBoundaryProps` interface with `children: React.ReactNode`, optional `fallback: React.ReactNode`, and optional `onError: (error: Error, info: React.ErrorInfo) => void`. | | |
| TASK-002 | Define `ErrorBoundaryState` interface with `hasError: boolean` and `error: Error \| null`. | | |
| TASK-003 | Implement `ErrorBoundary` as a `React.Component<ErrorBoundaryProps, ErrorBoundaryState>` with `static getDerivedStateFromError` and `componentDidCatch`. In `componentDidCatch`, call `this.props.onError?.(error, info)` to support future logging integrations. | | |
| TASK-004 | In the `render` method, when `hasError` is true, show the `fallback` prop if provided; otherwise render a default fallback that shows the error message + stack only when `import.meta.env.DEV` is `true`, and a generic "Something went wrong" message in production. | | |
| TASK-005 | Export `ErrorBoundary` as a named export from `apps/web/src/components/ErrorBoundary.tsx`. | | |

### Phase 2: Integrate Error Boundaries at the Root and App Level

- GOAL-002: Wrap the application root and top-level feature areas so no unhandled render error can produce a blank screen.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-006 | In `apps/web/src/main.tsx`, import `ErrorBoundary` and wrap `<StrictMode><App /></StrictMode>` with `<ErrorBoundary>` as the outermost element before `createRoot(...).render(...)`. This catches any error that escapes `App`. | | |
| TASK-007 | In `apps/web/src/App.tsx`, wrap the returned JSX with `<ErrorBoundary>` so that future child components added to `App` each have a safety net. Pass a minimal inline fallback (e.g. `<p>This section failed to load.</p>`) as the `fallback` prop. | | |
| TASK-008 | Verify the app still renders normally by running `pnpm -F @repo/frontend dev` and checking `http://localhost:3000`. | | |

### Phase 3: Add Tests

- GOAL-003: Confirm that `ErrorBoundary` catches errors and renders fallback UI rather than crashing.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-009 | Install Vitest and React Testing Library as dev dependencies: `pnpm -F @repo/frontend add -D vitest @testing-library/react @testing-library/user-event jsdom`. Add `"test": "vitest run"` and `"test:watch": "vitest"` scripts to `apps/web/package.json`. Configure Vitest in `vite.config.ts` under the `test` key (`environment: 'jsdom'`). | | |
| TASK-010 | Create `apps/web/src/components/ErrorBoundary.test.tsx`. Write a test that renders a child component that throws during render and asserts that the fallback UI appears and the thrown error does not propagate. | | |
| TASK-011 | Write a test confirming that when no error is thrown, `ErrorBoundary` renders its children normally. | | |
| TASK-012 | Write a test confirming that the `onError` callback is invoked with the error and error info when a child throws. | | |
| TASK-013 | Run `pnpm -F @repo/frontend test` to confirm all tests pass. | | |

## 3. Alternatives

- **ALT-001**: Use the `react-error-boundary` npm package — Not chosen because the required behavior is straightforward and can be implemented without an additional runtime dependency. The package adds value for complex reset/retry patterns not yet needed here.
- **ALT-002**: Add a global `window.onerror` / `window.addEventListener('unhandledrejection')` handler instead — Not chosen because these event listeners catch errors outside the React lifecycle (e.g. async promise rejections) but do not intercept React render errors, which only `componentDidCatch` can handle.
- **ALT-003**: Wait for an official React hook equivalent to `componentDidCatch` — Not chosen because no such hook exists as of React 19; class components remain the only supported mechanism.

## 4. Dependencies

- **DEP-001**: `react@^19.0.0` (already installed in `@repo/frontend`) — `React.Component`, `React.ErrorInfo`, and `React.ReactNode` are all required for the implementation.
- **DEP-002**: `vitest` (dev, to be installed) — Test runner that shares the existing Vite 6 config; recommended in `apps/web/CLAUDE.md`.
- **DEP-003**: `@testing-library/react` (dev, to be installed) — Provides `render` and query helpers for component testing.
- **DEP-004**: `@testing-library/user-event` (dev, to be installed) — Simulates user interactions for future boundary reset tests.
- **DEP-005**: `jsdom` (dev, to be installed) — DOM environment required by Vitest when running outside a browser.

## 5. Files

- **FILE-001**: `apps/web/src/components/ErrorBoundary.tsx` — **Create**. The new reusable error boundary class component.
- **FILE-002**: `apps/web/src/components/ErrorBoundary.test.tsx` — **Create**. Unit tests for `ErrorBoundary`.
- **FILE-003**: `apps/web/src/main.tsx` — **Modify**. Import `ErrorBoundary` and wrap the root render call.
- **FILE-004**: `apps/web/src/App.tsx` — **Modify**. Wrap the component's returned JSX with `<ErrorBoundary>`.
- **FILE-005**: `apps/web/package.json` — **Modify**. Add `test` and `test:watch` scripts; Vitest and Testing Library will be added to `devDependencies` via pnpm.
- **FILE-006**: `apps/web/vite.config.ts` — **Modify**. Add a `test` key with `{ environment: 'jsdom' }` so Vitest uses jsdom for component tests.

## 6. Testing

- **TEST-001**: `ErrorBoundary` renders fallback when a child throws — `apps/web/src/components/ErrorBoundary.test.tsx`. Mount a component that throws in its render body; assert the fallback text appears in the DOM and the thrown error does not propagate to the test runner.
- **TEST-002**: `ErrorBoundary` renders children normally when no error occurs — `apps/web/src/components/ErrorBoundary.test.tsx`. Mount a normal child; assert the child's content is visible.
- **TEST-003**: `onError` callback is called with correct arguments — `apps/web/src/components/ErrorBoundary.test.tsx`. Provide a mock `onError` prop; trigger a child error; assert the mock was called once with an `Error` instance and an object containing `componentStack`.
- **TEST-004**: Production fallback hides error details — `apps/web/src/components/ErrorBoundary.test.tsx`. Temporarily set `import.meta.env.DEV` to `false` via Vitest's env mock; trigger an error; assert the stack trace is not rendered.

## 7. Risks & Assumptions

- **RISK-001**: React 19 may introduce a function-component-based error boundary API in a future release, making the class component approach obsolete — Mitigation: encapsulate all boundary logic inside `ErrorBoundary.tsx` so it can be swapped out in one file without touching call sites.
- **RISK-002**: Suppressing `console.error` output in tests (React emits errors from boundaries) may require explicit `vi.spyOn(console, 'error').mockImplementation(() => {})` to keep test output clean — Mitigation: add the spy in a `beforeEach` block inside the test file.
- **ASSUMPTION-001**: The app currently has no routing layer (React Router, TanStack Router, etc.); if one is added later, per-route error boundaries should be introduced at the route-definition level in addition to the root boundary.
- **ASSUMPTION-002**: No external error reporting service (Sentry, Datadog, etc.) is configured yet; the `onError` callback prop is intentionally left as a no-op hook point for future integration.
- **ASSUMPTION-003**: The `plan/` directory already exists at the repo root (confirmed during planning).

## 8. Related Specifications / Further Reading

- [React Docs — Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Vitest — Getting Started](https://vitest.dev/guide/)
- [Testing Library — React](https://testing-library.com/docs/react-testing-library/intro/)
- `apps/web/CLAUDE.md` — Component conventions and testing setup guidance for `@repo/frontend`
