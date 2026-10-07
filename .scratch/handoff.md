# Frontend: handoff

The frontend as built, for whoever picks it up next (2026-10-06, `main` after `704cdd6`). The
inside is in `docs/architecture.md`, the look in `docs/design.md`, the reasons in `docs/adr/`;
this file is the short map and what is not written down elsewhere.

## State

- Every SPA ticket is done: `.scratch/spa/issues/01–13` (tooling and layer lint, design
  foundation, auth, My CVs, create from text + generation, PDF upload, editor, preview and block
  order, questions, PDF download, match panel, "Also fits", usage + form autosave). The root UI
  tickets `.scratch/frontend-first/issues/03–13` were moved here.
- A whole-stack run against the real backend and Claude passed. Its findings are fixed (list
  below); after it the mocks were brought in line with the server.
- `.scratch/spa/spec.md` still says `Status: ready-for-agent`; every ticket under it is done, so
  it can be set to `done`.
- Checks: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build`; all
  green (299 tests in 29 files). `pnpm screenshots` captures every screen at 390 and 1280 px in
  mock mode.

## What it does

A React SPA on the REST contract (`docs/api.md`, `docs/cv-statuses.md` at the root, schemas from
`@cv/shared`). Served by nginx in Docker, which also proxies `/api`, so the cookie is first-party
and there is no CORS; in `pnpm dev` the Vite proxy does the same.

- **Auth** — sign up / log in / log out. Signed in is known only from `GET /api/auth/me`; the
  token lives in an httpOnly cookie the app never reads. A `401` anywhere is handled in one place
  (`createQueryClient({ onUnauthorized })`): empty the cache, `['me']` → `null`, redirect to login
  with a safe `next`.
- **My CVs** — rows with status pill, open questions, match figure, updated time; actions by
  status (Open, Watch progress, Retry, two-step Delete); an empty state.
- **New CV** — target role, role note, CV language (native `<select>`), background as text or a
  PDF (`POST /api/ingest/pdf`, the extracted text lands in the textarea for review, with a note
  when it is outside the limits); the generation limits from `GET /api/usage`, Create CV disabled
  with the reason while one is hit. The unsent form survives a reload (`sessionStorage`).
  `?fromCvId=&role=` starts a CV for another role from an existing one.
- **CV screen** — picked by status group: in progress (stage, "N ahead of you", "attempt 2 of 3",
  a drifting backdrop), failed (Retry, Delete), has draft (editor + Questions / Match / Preview).
- **Generation** is a background job: the app polls `GET /api/cvs/statuses` every 3 s only for
  CVs in progress, patches status/stage/attempt/queue position into the cache, and refetches the
  detail and the list when a CV leaves that group. The full CV is never polled; a reload resumes
  from the URL.
- **Editor** — all eight blocks, add / remove / move items, blocks below contacts move up / down,
  bullets one per line, skills as chips, missing required parts marked (`findMissing`). Explicit
  Save with a sticky save bar and the optimistic `version`; a conflict shows "Reload latest".
- **Questions** — cards by kind (`text`, `choice`, `multi`, `confirm`), Skip except for
  `confirm`, the verification notice above them, answered ones collapsed under "Answered (N)".
  Answer and Skip only mark a card (it folds to one line with Change); the apply bar sends every
  replied card in one `POST …/replies` after saving unsaved edits, says "Updating your CV…"
  while the server words the answers, and keeps every reply when the batch fails. Unapplied
  replies live in `localStorage` per user and CV, so a reload keeps them.
- **Match** — `computeMatch` in the browser on the deferred form values: no request, no LLM.
- **Preview** — an A4 sheet laid out like the server PDF, from unsaved values, in the order of
  `sectionOrder`, headings in the CV language.
- **PDF** — "Save & download" saves a dirty form first, then fetches the server PDF and hands it
  to downloads (filename from `Content-Disposition`).
- **Mock mode** — `pnpm dev:mock`: MSW plays the whole API in the browser (adr/0003).

## How it is built

- **Stack:** Vite 8, React 19 + React Compiler, React Router 8 (data mode, every route lazy),
  TanStack Query 5, React Hook Form + Zod, Tailwind v4 with own tokens, own primitives in
  `src/shared/ui`, `lucide-react`, self-hosted fonts, oxlint + Prettier, Vitest + Testing Library.
- **Layers** `app → features → entities → shared`, imports only downwards, enforced by oxlint
  together with the `../` ban, cycles and the feature-to-feature ban (adr/0002). Features:
  `auth`, `cv-list`, `cv-create`, `cv-editor`; `entities/cv` holds what two features need (CV
  queries, polling, delete / retry, usage, status → label / tone / actions, `StatusPill`,
  `MatchBar`). Each segment is `components/`, `api/`, `model/`; no barrels.
- **Routes** are thin modules: the loader calls `ensureQueryData`, the screen reads with
  `useSuspenseQuery`, errors go to `RouteError` (Retry or Not found). The router and the
  QueryClient come from `createApp()`, so each test gets a fresh pair. URLs are written only in
  `src/shared/config/paths.ts`.
- **State:** server data only in TanStack Query; the CV id and the panel tab (`?tab=`) in the
  URL; form values in RHF; everything else in the component's own `useState`. No store, no
  Context for app state.
- **API client** — one `fetch` wrapper that parses every response with the contract schema and
  throws `ApiError`; error texts for specific codes live in the feature that shows them.
- **Look** — light theme only, pastel backdrop, frosted glass only on the top bar, tab switcher,
  save bar and auth card (adr/0001); tokens only, look belongs to primitives.
- **Tests** — flow tests in `src/tests` render the whole app with `renderApp()` against the same
  MSW handlers mock mode uses; unit tests only for pure functions, next to the file.

## Decisions that are easy to miss

Most are in `docs/architecture.md` §5–§7; these are the ones that cost a debugging session:

- **The editor is keyed by CV id + version.** A new server version remounts it with fresh
  defaults; Cancel remounts it too, by a counter in the key, because RHF's `reset()` plus React
  Compiler kept the typed values.
- **The detail query does not refetch on focus or reconnect**, so a version fetched behind the
  user's back can't drop unsaved edits; fields are disabled while a save runs.
- **The replies and download mutations live in `DraftView`, above the form's key**, so their
  pending state and errors outlive the remount that their own answer causes; so do the cards'
  drafts and replied marks (`{ drafts, replied }`), mirrored to `localStorage`
  (`entities/cv/model/storedReplies.ts`: pruned to open questions on load, removed after an
  apply and on delete). While a save or a batch runs, the editor and every card wait.
- **The batch is built from the CV as cached after the save-first**, not from the `cv` prop of
  the render before: a save that removed an item closed its questions. The route passes the
  user's id to the CV screen (replies are keyed per user); without one it renders nothing.
- **Leaving with unsaved edits** asks via `beforeunload` and a router blocker; the blocker lets
  through `?tab=` changes, the way to login and a navigation after the CV was deleted.
- **Below 980 px the editor stays mounted** and CSS hides it on another tab, so unsaved values
  survive a tab switch; the layout itself is read in JS (`useMediaQuery`), because each side of
  980 px offers different tabs.
- **Usage is a hint, not a gate:** read with plain `useQuery`, the form works without it; a create
  or its `429` invalidates it, a Retry resets it.
- **Deleting the CV on screen** navigates away before it drops the CV from the cache, so the
  screen never refetches a CV that is gone.
- **Mock mode is a build-time branch** (`import.meta.env.MODE === 'mock'`): the dev server and
  the production build don't load or contain the mocks. Its fake worker has no timers; every
  handler first moves each CV to where the clock says. A word in the target role picks the
  course (`ready`, `retry`, `fail`); a word in a PDF's name picks what it holds (`scan`, `long`,
  `short`).
- **Tests run the phone layout** (jsdom has no `matchMedia`); `wideScreen()` switches a test to
  the wide one. `vitest.setup.ts` puts Node's `FormData` / `File` back over jsdom's, or uploads
  arrive empty.

## Fixed after the whole-stack run

- Polling stops for a CV deleted in another tab or device: an id missing from the statuses answer
  leaves the list and resets its detail (Not found).
- `host.docker.internal` resolves on plain Linux Docker (`extra_hosts: host-gateway`).
- 4 CVs in progress per user, as the server enforces; the mocks stopped counting answers (the
  server has no answer limit).
- A Retry over a limit says when it can run (from `Retry-After`), and drops the cached limits.
- A draft over the API's body limit (`413 INPUT_TOO_LARGE`) asks to shorten the longest texts.
- Mock mode now answers with the shared `applyAnswer`, words its auto question with
  `autoQuestionText` in the CV language, runs revisions and retries, and checks the hourly limit
  first, as the server does.

## Rules that are easy to break

- Read `CLAUDE.md` here first: no manual memoization, server data only in Query, RHF + Zod with
  `useWatch` where a value is read, no `&&` with a `0` / `""` left side, no inline components.
- Tokens only (no default palette, no `text-[#…]`); features and entities use only layout
  utilities; a new look is a new primitive variant with a name from `docs/design.md`.
- A new feature folder needs its own override in `.oxlintrc.json`.
- The contract (`docs/api.md`, `docs/cv-statuses.md`, `shared/`) belongs to the root: change it
  with a root ticket, not from here. A new schema never goes into this package.
- UI tickets end with screenshots at 390 and 1280 px in mock mode.

## Open

- Manual whole-stack checks the run did not cover: the usage line and limit notice, the "Also
  fits" chip, logout and reload, delete, a `confirm` question and the verification counts.
- The model chooses `sectionOrder` on the server, while the root `docs/architecture.md` §6.2
  says a new draft gets the fixed default; the preview and PDF simply follow what is saved. A root
  decision, nothing to change here.
- The README (a deliverable) is not written; the frontend part should cover `pnpm dev:mock`, the
  mock keywords and the screenshots command.
