# Frontend

SPA for the AI CV Builder. Talks to the NestJS backend over REST; no SSR.

## Stack

Vite + React 19 + TypeScript, React Compiler (Babel preset in `vite.config.ts`), Tailwind CSS v4,
React Router (data mode, `createBrowserRouter`), TanStack Query, React Hook Form + Zod, oxlint.
No UI kit: own primitives in `src/shared/ui` on native elements, `lucide-react` icons,
self-hosted fonts via `@fontsource`. Look, tokens, primitives, layouts and states:
`frontend/docs/design.md`; structure, routes and data flow: `frontend/docs/architecture.md`; API
contract: `docs/api.md`; statuses: `docs/cv-statuses.md`.

## Commands

- `pnpm dev` — dev server; `/api` is proxied to the backend on `localhost:3000`
- `pnpm typecheck` — `tsc -b`
- `pnpm lint` — oxlint (layer boundaries, `import/no-cycle`, `jsx-a11y`)
- `pnpm format` / `pnpm format:check` — Prettier with `prettier-plugin-tailwindcss` (write / check)
- `pnpm test` / `pnpm test:watch` — Vitest + Testing Library in jsdom (once / watch)
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

Full reference: `frontend/docs/architecture.md` (the tree, the import table, routes, server
state, mock mode, tests, and a "where does it go" table). Read it before adding a file. In short:

```
src/
  app/         router factory, providers (QueryClient), layout, thin route modules in routes/
  features/    one folder per user task: auth, cv-list, cv-create, cv-editor (the CV screen)
  entities/
    cv/        what two or more features need about a CV: queries, shared mutations,
               status → label/tone/actions, status pill, match bar, status polling
  shared/      api client, UI primitives (ui/), utils (lib/), paths (config/) — no domain logic
  mocks/       mock mode (MSW); outside the layers, imports only the contract package
  tests/       tests that drive the whole app; outside the layers
```

- Imports go only downwards: `app → features → entities → shared`; a feature never imports
  another feature. No layer imports `mocks` or `tests`. oxlint enforces the layers
  (`no-restricted-imports` per folder, `import/no-cycle`).
- Import via the `@/` alias; relative imports are for `./` siblings only, `../` fails the lint.
  No `index.ts` barrels.
- A new feature folder gets its own override in `.oxlintrc.json`; until then it can't import from
  `@/features` at all.
- Every feature and entity uses the same segments: `components/`, `api/` (query options,
  mutations), `model/` (form schemas, maps, error texts, pure functions). No `hooks/`, `types/`
  or `utils/` folders.
- URL strings are written only in `src/shared/config/paths.ts`; links and redirects use its
  builders.
- A route module takes from a feature only its `<Name>Screen` component and its `api/`.
- Why four layers and not FSD: `docs/adr/0002-layers-app-features-entities-shared.md`. Why mocks
  sit outside them: `docs/adr/0003-mock-mode-outside-the-layers.md`.

Two different "shared": the **`src/shared` layer** (this app's primitives and client) and the
**`shared` workspace package** (the contract: Zod schemas, `isInProgress`, `computeMatch`). Always
say which one you mean.

Files: one component per `PascalCase.tsx`, hooks in `useX.ts`, **named exports only** (route
modules export `Component` / `loader` / `ErrorBoundary` as React Router expects). A unit test sits
next to its file (`X.test.tsx`); a test of a user flow goes to `src/tests/`.

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
  `GET /api/cvs/statuses` with `refetchInterval` while any CV `isInProgress` (from the `shared`
  package); when one leaves that group, invalidate its detail and the list. Never poll the full
  CV. The CV id is in the URL, so a reload resumes polling — don't rely on in-memory state or
  streaming.
- **Statuses are mapped, never derived.** Label, tone and actions come from the status string
  (`docs/cv-statuses.md`) via the map in `entities/cv`; don't infer status from other fields.
- **Data loading:** a route `loader` calls `queryClient.ensureQueryData(...)`, the screen reads
  with `useSuspenseQuery`; errors go to the route `ErrorBoundary` (`ErrorState` with Retry).
  Polling stays on plain `useQuery`. A failed mutation shows its error next to its control; no
  toasts.
- **Mobile first.** Style for phone width, add `md:` (760 px) / `lg:` (980 px) on top.
- Every async view handles loading, error (with retry) and empty states.
- **Tests:** Vitest + Testing Library against MSW handlers; the same handlers power mock mode.
  Flow tests render the whole app with `renderApp()` from `src/tests`.

## Styling

Full reference: `frontend/docs/design.md`. The rules an agent must not break:

- **Tokens only.** Colours come from the semantic `@theme` tokens (`ink`, `surface`, `accent`,
  `wait`…); the default Tailwind palette is off and arbitrary colours (`text-[#…]`) are banned.
- **Look belongs to primitives.** `features/` and `entities/` use only layout utilities (flex,
  grid, gap, spacing, size, breakpoints); colour, border, radius, shadow and type come from
  `src/shared/ui`. Need a new look → add a primitive variant.
- **Variants** are a `Record<Variant, string>` + `cx()`; no `cva`, `tailwind-merge`, CSS-in-JS or
  inline `style` (except passing a CSS variable).
- **Primitives:** native element props, `ref` as a prop, named export, built when first needed,
  names from the catalogue in `design.md` — don't invent a `Badge` next to `Pill`.
- **Tone, not colour:** primitives take `tone: neutral | accent | wait | ok | bad`.
- **Glass only on the glass layer** (top bar, tab switcher, save bar, auth card) via the `glass`
  utility inside `src/shared/ui` / `src/app/layout`; content, inputs and the preview sheet stay
  solid; text on glass is `ink` or `accent` only. Why:
  `docs/adr/0001-own-css-glass-on-glass-layer-only.md`.
- **Light theme only.** No dark variants.
- **Motion:** CSS only, behind `motion-safe:`; never animate blur.
- **a11y:** `focus-visible:`, touch targets ≥ 40 px, 16 px inputs, `aria-label` on icon-only
  buttons, decorative icons `aria-hidden`.
- **Check the look:** UI tickets end with screenshots at 390 px and 1280 px in mock mode
  (`design.md` → *Checking the look*).

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
- before committing run
  `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build` — all must pass

## Agent skills

The root `CLAUDE.md` sections apply; this subproject narrows them:

- **Issue tracker:** work that changes only frontend internals lives in `frontend/.scratch/`
  (`frontend/docs/agents/issue-tracker.md`). Anything touching the contract (`docs/api.md`,
  `docs/cv-statuses.md`, `shared/`) or the backend goes to the root tracker.
- **Domain docs:** frontend terms in `frontend/GLOSSARY.md`, frontend-only decisions in
  `frontend/docs/adr/`; product terms in `shared/GLOSSARY.md` (`GLOSSARY-MAP.md` at the root).
