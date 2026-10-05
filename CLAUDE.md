# Frontend

SPA for the AI CV Builder. Talks to the NestJS backend over REST; no SSR.

## Stack

Vite + React 19 + TypeScript, React Compiler (Babel preset in `vite.config.ts`), Tailwind CSS v4,
React Router (data mode, `createBrowserRouter`), TanStack Query, React Hook Form + Zod, oxlint.
No UI kit: own primitives in `src/shared/ui` on native elements, `lucide-react` icons,
self-hosted fonts via `@fontsource`. Design tokens, routes, data flow and layouts:
`docs/architecture.md` §11; API contract: `docs/api.md`; statuses: `docs/cv-statuses.md`.

## Commands

- `pnpm dev` — dev server; `/api` is proxied to the backend on `localhost:3000`
- `pnpm typecheck` — `tsc -b`
- `pnpm lint` — oxlint
- `pnpm build` — typecheck + production build

Dependencies are installed from the repo root (`pnpm install`): one workspace, one lockfile.

## Docker

`Dockerfile` (build context: the repo root) builds the SPA and serves it with nginx;
`nginx/default.conf.template` proxies `/api` to `$API_UPSTREAM`.

- On its own: `docker compose up --build` here (or `pnpm stack:frontend` from the root) →
  `http://localhost:8080`, `/api` → backend on the host port 3000. Docker Desktop resolves
  `host.docker.internal`; on plain Linux Docker set `API_UPSTREAM=<host-ip>:3000`.
- Whole stack: the root `compose.yaml` includes this file and sets `API_UPSTREAM=api:3000`.

## Structure

```
src/
  app/         router, providers (QueryClient), root layout
  features/    one folder per feature: auth, cv-list, cv-create, cv-editor
               each holds its components, hooks, api calls and query keys
  shared/      api client, UI primitives, utils — no feature logic
```

A feature may import from `shared/`, never from another feature's internals.

## Rules

- **No manual memoization.** React Compiler handles it — don't add `useMemo`, `useCallback` or
  `memo` unless a measured problem requires it.
- **Server state lives in TanStack Query only.** Never copy query data into `useState` or Context.
  Subscribe narrowly with `select`.
- **Forms use React Hook Form + Zod.** Read values with `useWatch` / `useFieldArray` where they are
  needed, not `watch()` at the form root, so one field edit doesn't re-render the whole form.
- **No global store.** Context only for rarely changing values (current user). Keep UI state in
  the component that uses it.
- **Treat API responses as untrusted:** parse them with the Zod schemas before use.
- **Generation is a background job.** Start it with a mutation, then poll
  `GET /api/cvs/statuses` with `refetchInterval` while any CV `isInProgress` (from `shared`); when
  one leaves that group, invalidate its detail and the list. Never poll the full CV. The CV id is
  in the URL, so a reload resumes polling — don't rely on in-memory state or streaming.
- **Statuses are mapped, never derived.** Label, color and actions come from the status string
  (`docs/cv-statuses.md`); don't infer status from other fields.
- **Mobile first.** Style for phone width, add `sm:` / `md:` breakpoints on top.
- Every async view handles loading, error (with retry) and empty states.

## Performance rules

A subset of Vercel's [react-best-practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices)
that applies to a Vite SPA with React Compiler. Rule ids match the files in its `rules/` folder —
open `rules/<id>.md` there for examples. Its `server-*` rules (Next.js/RSC) and
`client-swr-dedup` (we use TanStack Query) don't apply; memo-related rules are covered by the
compiler.

Re-renders — the compiler does **not** fix these:
- `rerender-no-inline-components` — never declare a component inside another component.
- `rerender-derived-state-no-effect` — compute derived values during render, not with
  `useEffect` + `setState`.
- `rerender-move-effect-to-event` — logic triggered by a user action goes in the event handler,
  not in an effect watching state.
- `rerender-defer-reads` — don't subscribe to state that is only read inside callbacks.
- `rerender-derived-state` — subscribe to the derived boolean/value you need, not the raw object
  (same idea as Query `select`).
- `rerender-lazy-state-init` — `useState(() => expensive())`, not `useState(expensive())`.
- `rerender-transitions` / `rerender-use-deferred-value` — keep typing responsive; mark
  non-urgent updates with `startTransition` / `useDeferredValue`.
- `rerender-use-ref-transient-values` — values that change often but don't affect output go in
  a `useRef`.

Rendering & bundle:
- `rendering-conditional-render` — use a ternary, not `&&`, when the left side can be `0` / `""`.
- `rendering-usetransition-loading` — prefer `useTransition` pending state over manual loading
  flags for local actions.
- `bundle-barrel-imports` — import from the file directly; no `index.ts` re-export barrels in
  `features/` or `shared/`.
- `bundle-dynamic-imports` — lazy-load route screens with `React.lazy` / route `lazy`
  (instead of `next/dynamic`).
- `async-parallel` — independent requests run in parallel, never awaited one after another.

## Committing

Follow the commit rules in the root `CLAUDE.md`. For frontend changes:

- scope is `frontend`: `feat(frontend): add cv editor form`
- before committing run `pnpm typecheck && pnpm lint && pnpm build` — all must pass

## Agent skills

The root `CLAUDE.md` sections apply; this subproject narrows them:

- **Issue tracker:** work that changes only frontend internals lives in `frontend/.scratch/`
  (`frontend/docs/agents/issue-tracker.md`). Anything touching the contract (`docs/api.md`,
  `docs/cv-statuses.md`, `shared/`) or the backend goes to the root tracker.
- **Domain docs:** frontend terms in `frontend/GLOSSARY.md`, frontend-only decisions in
  `frontend/docs/adr/`; product terms in `shared/GLOSSARY.md` (`GLOSSARY-MAP.md` at the root).
