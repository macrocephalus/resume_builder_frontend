# Frontend architecture

Where every file of the SPA goes, what may import what, and how data moves from the API to the
screen. This file is the source of truth for the structure of `frontend/src`.

Related documents, none of which this file repeats:

| Question | Document |
|---|---|
| How the UI looks: tokens, glass, primitives, states | [design.md](design.md) |
| Why four layers, why own glass, why mocks sit outside the layers | [adr/](adr/) |
| The REST contract and the CV statuses | `docs/api.md`, `docs/cv-statuses.md` at the repo root |
| Product terms / frontend terms | `shared/GLOSSARY.md` / [../GLOSSARY.md](../GLOSSARY.md) |
| Short rules an agent must not break | [../CLAUDE.md](../CLAUDE.md) |

Two things are called "shared". The **`src/shared` layer** is this app's lowest layer. The
**contract package** is the `@cv/shared` workspace package (folder `shared/` at the repo root)
with the Zod schemas, the status machine and `computeMatch`, imported `from '@cv/shared'`. This file always says
which one it means.

## 1. The tree

Folders and the files that carry the structure. Other files are named after what they show or do
and follow the placement rules in §3 and §10.

```
src/
  main.tsx                     entry: mock-mode gate, createApp(), renders App
  index.css                    Tailwind import, @theme tokens, the glass utility

  app/                         LAYER 1: wiring; knows every layer below
    App.tsx                    QueryClientProvider + RouterProvider; takes the client and the router
    createApp.ts               a fresh QueryClient + router, wired for 401; used by main and tests
    router.tsx                 createAppRouter(queryClient): the route table
    providers/
      queryClient.ts           createQueryClient({ onUnauthorized }): defaults, 401 handling
    layout/
      RootLayout.tsx           Backdrop + outlet
      ProtectedLayout.tsx      TopBar + outlet, for signed-in routes
      TopBar.tsx               glass bar: product name, email, Log out, navigation progress line
      Backdrop.tsx             pastel shapes; drift while a data-backdrop="drift" element is shown
      RouteError.tsx           a route's ErrorBoundary: ErrorState with Retry, or Not found
      PageError.tsx            RouteError framed as a page, for errors above every layout
      PageSkeleton.tsx         the router's HydrateFallback: the cold-open skeleton
      NotFound.tsx             the Not found view, for the * route and for a 404
    routes/                    one thin module per route: loader, Component, ErrorBoundary
      login.tsx
      signup.tsx
      protected.tsx            loader ensures the current user, else redirects to login
      cv-list.tsx
      cv-new.tsx
      cv.tsx
      not-found.tsx

  features/                    LAYER 2: one folder per user task
    auth/
      components/              LoginScreen, SignupScreen and their parts
      api/                     authQueries (me), useLogin, useSignup, useLogout
      model/                   error-code texts for the auth forms
    cv-list/
      components/              CvListScreen, the row, the empty state
    cv-create/
      components/              CvCreateScreen, the form (plain or from another CV), the PDF upload
      api/                     useCreateCv, useIngestPdf, parentCvQuery, usageQuery
      model/                   form schema, the ?fromCvId=&role= prefill, error-code texts,
                               the note on an extracted PDF text, session-storage autosave
    cv-editor/                 the CV screen (see the glossary)
      components/
        CvScreen.tsx           picks the panel by status group
        progress/              in-progress panel, failed panel
        editor/                has-draft layout, header, the form, blocks, save bar
        questions/             questions panel and the cards by kind
        preview/               the A4 sheet (laid out by model/sheet.ts, like the PDF)
        match/                 match panel, the header's live match bar, useLiveMatch
        pdf/                   download button
      api/                     useSaveCv, useAnswerQuestion, useSkipQuestion, useDownloadPdf
      model/                   draft form schema, draft <-> form mapping, tab ids, error texts

  entities/                    LAYER 3: what two or more features need about a domain object
    cv/
      api/
        cvQueries.ts           query keys and options: list, detail, statuses
        useCvStatusPolling.ts  polls statuses while a CV is in progress
        useDeleteCv.ts         used by the list and the CV screen
        useRetryCv.ts          used by the list and the CV screen
      model/
        statusView.ts          status -> label, tone, allowed actions
        matchText.ts           "Covers 7 of 10 requirements", "Match 7/10"
      components/
        StatusPill.tsx
        MatchBar.tsx

  shared/                      LAYER 4: no domain knowledge
    api/
      client.ts                the one fetch wrapper: JSON, 204 and file answers
      ApiError.ts              status, code, message, details, retryAfter
      errorText.ts             fallback text for an error; "cannot reach the server"
      fileName.ts              the file name from a Content-Disposition header
    ui/                        primitives from the catalogue in design.md
    lib/
      cx.ts
      format.ts                dates and numbers through Intl
      saveFile.ts              hands a blob to the browser's downloads
    config/
      paths.ts                 the only file that spells URLs

  mocks/                       OUTSIDE the layers: mock mode (ADR 0003)
    browser.ts                 starts the MSW worker in the browser
    server.ts                  MSW server for Vitest
    handlers.ts                the full handler list
    handlers/                  one file per API area: auth, cvs, questions, ingest, usage
    store.ts                   users, session, CVs, questions in browser storage
    worker.ts                  fake worker: elapsed time -> status and stage
    fixtures/                  the draft, its questions, the extracted text, the PDF

  tests/                       OUTSIDE the layers: tests that drive the whole app
    renderApp.tsx              real router + providers + client against the mock handlers
    auth.test.tsx              one file per user flow
    ...
```

## 2. Layers and imports

Imports go only downwards: `app → features → entities → shared`. Why these four and not
Feature-Sliced Design: [ADR 0002](adr/0002-layers-app-features-entities-shared.md).

| Code in | May import | Never imports |
|---|---|---|
| `app` | `features`, `entities`, `src/shared`, contract package | `mocks`, `tests` |
| `features/<name>` | its own folder, `entities`, `src/shared`, contract package | `app`, another feature |
| `entities` | `src/shared`, contract package | `app`, `features` |
| `src/shared` | contract package | `app`, `features`, `entities` |
| `mocks` | contract package | every layer of the app |
| `tests` | `app`, `mocks`, `src/shared/config/paths` | — |
| `main.tsx` | `app`; `mocks/browser` through a dynamic import in mock mode | — |

Rules on top of the table:

- **`@/` or `./`, nothing else.** A path that climbs with `../` fails the lint, because it could
  cross a boundary unseen.
- **No barrels.** There is no `index.ts` that re-exports; import the file that defines the thing.
- **What `app` takes from a feature:** its screen component (`components/<Name>Screen.tsx`) and
  its `api/` (query options for a loader, a mutation for the top bar). Everything else in a
  feature is internal.
- **A feature never imports another feature.** If two features need the same thing, it moves down:
  to `entities` when it knows about a CV, to the `src/shared` layer when it knows nothing about the
  domain. It moves when the second user appears, not before.
- **Enforcement.** oxlint checks the four layers, the `../` ban, cycles, the feature-to-feature
  ban, and that no layer imports `src/mocks` or `src/tests` while `src/mocks` imports nothing from
  the layers (`.oxlintrc.json`). A new feature folder needs its own override there; without one it
  cannot import from `@/features` at all. "What `app` takes from a feature" is a convention, not a
  lint rule.

## 3. Inside a feature and an entity

Every feature and every entity uses the same three segments, created when first needed:

| Segment | Holds |
|---|---|
| `components/` | React components. One per `PascalCase.tsx` file. The feature's entry is `<Name>Screen.tsx`. |
| `api/` | Query options, mutations and the hooks around them. Everything that talks to the server. |
| `model/` | Everything that is not React and not the network: form schemas, value mapping, lookup maps, error-code texts, pure functions. |

- A hook lives next to what it serves, in `useX.ts`: a data hook in `api/`, a UI hook in
  `components/`. There is no `hooks/` folder.
- There is no `types/` folder. Types come from the contract schemas (`z.infer`); a local type sits
  in the file that uses it.
- Named exports only. Route modules export `loader`, `Component` and `ErrorBoundary`, as React
  Router expects.
- A unit test sits next to its file: `X.test.ts(x)`.
- `cv-editor` is the one large feature, so its `components/` is split by area of the CV screen
  (`progress`, `editor`, `questions`, `preview`, `match`, `pdf`). The areas share one form, which
  is why they are one feature and not six.

## 4. Routes

| Path | Route module | Screen | Loader |
|---|---|---|---|
| `/login` | `login.tsx` | `auth` → `LoginScreen` | signed in → redirect to My CVs |
| `/signup` | `signup.tsx` | `auth` → `SignupScreen` | signed in → redirect to My CVs |
| — | `protected.tsx` | `ProtectedLayout` | ensures the current user; `401` → login with `next` |
| `/` | `cv-list.tsx` | `cv-list` → `CvListScreen` | ensures the CV list |
| `/cvs/new` | `cv-new.tsx` | `cv-create` → `CvCreateScreen` | with `?fromCvId=`, ensures that CV (not own → Not found) |
| `/cvs/:cvId` | `cv.tsx` | `cv-editor` → `CvScreen` | ensures the CV detail |
| `*` | `not-found.tsx` | `NotFound` (`app/layout`) | — (a child of `protected`) |

- **The router is built by a factory.** `createAppRouter(queryClient)` returns the router, and each
  route module exports its loader as a function of the client. `createApp()` makes a fresh client
  and router and wires the `401` handler; `main.tsx` and `renderApp()` in the tests each call it,
  so no cache leaks between tests.
- **Unknown paths sit behind login.** The `*` route is a child of `protected`, so an anonymous
  deep link to a screen that has no route yet still goes through login and comes back.
- **Route modules are thin.** A module connects a path to a screen: it calls
  `queryClient.ensureQueryData(...)` in the loader, renders the feature's screen and sets the
  `ErrorBoundary`. It holds no UI of its own and no logic beyond redirects.
- **Every screen is lazy.** The route table uses `lazy: () => import('./routes/…')`, so a route
  module and its feature load on first visit.
- **URLs are spelled in one file.** `src/shared/config/paths.ts` exports the path patterns for the
  route table and builder functions for links and redirects (`paths.cv(id)`,
  `paths.newCv({ fromCvId, role })`, `paths.login(next)`) and the API endpoints (`apiPaths`). No
  other file of the app contains a URL string; `src/mocks` spells the endpoints itself, because it
  may not import the layers. It also holds `safeNext`, the check that a `next` return address is a
  same-origin relative path.
- **Errors.** A screen's route module exports `ErrorBoundary = RouteError`, so a loader error
  shows inside the layout, under the top bar: `ErrorState` with Retry (revalidate, which refetches
  the failed query) or Not found for a `404`. Errors above every layout (the session check) reach
  `PageError`.
- **A protected screen's loader waits for the session.** It awaits `authQueries.me()` (the same
  request as the protected loader's) and loads nothing for an anonymous visitor, so a deep link
  does not fire a `401` before the redirect to login.
- **Navigation feedback.** The old screen stays until the loader resolves; the top bar shows a
  progress line while `navigation.state === 'loading'`. On the first load of the app the router
  shows `PageSkeleton` (its `HydrateFallback`).

## 5. Server state

TanStack Query is the only cache of server data. Nothing copies query data into `useState`,
Context or a store.

- **Keys:** `['me']` for the current user; `['cvs', 'list']`, `['cvs', 'detail', id]`,
  `['cvs', 'statuses', ids]` for CVs; `['usage']` for the limits.
- **Query options live in factories:** `cvQueries.list()`, `cvQueries.detail(id)`,
  `cvQueries.statuses(ids)` in `entities/cv/api`, `authQueries.me()` in `features/auth/api`. A
  loader and a screen use the same factory, so the loader's data is the screen's data.
- **Reading:** a screen reads with `useSuspenseQuery`, so data is present on render and there is no
  `isPending` branch. A component that needs one slice subscribes with `select`.
- **The API client** (`src/shared/api/client.ts`) is the one `fetch` wrapper. It sends same-origin
  credentials, parses every response with the contract schema passed by the caller, and throws
  `ApiError` on a non-2xx status, malformed JSON or a failed parse. It knows nothing about auth or
  CVs. `apiFile` fetches a file: a body of another media type than the caller expects is a
  `BAD_RESPONSE`, and the name comes from `Content-Disposition` (`filename*` first) or a fallback.
  `saveFile` (`src/shared/lib`) hands the blob to a temporary `<a download>` and revokes its
  object URL a minute later, since Safari on iOS reads it after the click returns.
- **Mutations** that return the full CV write it into the detail cache with `setQueryData` and do
  not refetch. A mutation's error is shown next to the control that started it; there are no
  toasts.
- **Where a mutation lives:** in the feature that uses it. `useDeleteCv` and `useRetryCv` live in
  `entities/cv/api`, because both the list and the CV screen use them.
- **Polling:** `useCvStatusPolling(ids)` runs the statuses request on plain `useQuery` with a 3 s
  `refetchInterval`; the caller passes only the ids in progress (the CV screen its own, the list
  its rows), and with none it stops. While a CV stays in progress, each answer is patched into its
  cached detail and list row (status, stage, attempt, queue position), so the panel and the pill
  move without a refetch. When a CV leaves that group, its detail and the list are invalidated and
  refetched. The full CV is never polled. The statuses request leaves out ids it no longer knows,
  so an id asked for and missing from the answer is a CV deleted in another tab or device: it
  leaves the cached list, and its detail is reset, so a screen showing it refetches and gets Not
  found. Either way its polling stops.
- **Limits on New CV:** `usageQuery()` is read with a plain `useQuery`, not one a loader waits for:
  the limits are a hint before a `429`, and the form works without them (a failure shows Retry
  next to Create CV). The form selects only whether a new CV can start; `UsageNote` shows the
  rest. While a new CV cannot start, Create CV is disabled with the reason and the query
  refetches every 15 s; a create, or a `429` for one, invalidates it. After a `429` the form's
  own error says it, so the note does not say it again.
- **Deleting the CV on screen:** `useDeleteCv({ onDeleted })` calls `onDeleted` (navigate to My
  CVs) before it drops the CV from the cache, so the screen never refetches a CV that is gone.
- **Statuses are mapped, never derived.** `statusView.ts` turns the status string into a label, a
  tone and the allowed actions. Nothing infers a status from other fields.

### Auth and `401`

- `features/auth` owns the forms, the login / signup / logout mutations and the current-user
  query. It is not a layer.
- Whether a user is signed in is known only from `GET /api/auth/me`. The frontend never reads,
  stores or decodes the token; it lives in an `httpOnly` cookie.
- `authQueries.me()` resolves to the user or to `null`: its own `401` is the normal answer for an
  anonymous visitor, not an error. The login, sign-up and protected loaders redirect on it.
- A `401` is handled in one place. `createQueryClient({ onUnauthorized })` sets the query and
  mutation cache error handlers; on an `ApiError` with code `UNAUTHORIZED` they call
  `onUnauthorized`, which `createApp()` wires to "empty the cache, set `['me']` to `null` and
  revalidate the router". The protected loader then redirects to login with `next`. A failed
  login (`INVALID_CREDENTIALS`) is not a lost session and is left to the form.
- Log in and sign up empty the cache before storing the new user, so nothing a previous user of
  the tab loaded is shown.
- Log out calls the API, sets `['me']` to `null`, opens login, and only then empties the cache, so
  no signed-in screen refetches on its way out.

### Error texts

- `src/shared/api/errorText.ts` gives the fallback: the server's `message`, or a generic text, or
  "cannot reach the server" for a network failure. It knows no error codes.
- A text for a specific code lives in the `model/` of the feature that shows it: `EMAIL_TAKEN` in
  `auth`, `PDF_UNREADABLE` in `cv-create`, `VERSION_CONFLICT` in `cv-editor`. There is no global
  code → text table.

## 6. Forms and the editor

- Every form is React Hook Form with a Zod resolver. The schema comes from the contract package;
  a form that needs a different shape (bullets as one text area) defines its own schema and the
  mapping to and from the contract shape in `model/`.
- **The editor is one form** over the whole draft plus the title.
  - It is keyed by CV id and version. A new server version remounts it with fresh default values,
    so there are no syncing effects.
  - **Cancel remounts it too**, by a counter in the key. RHF's `reset()` empties its field
    registry and waits for inputs to register again on the next render; React Compiler skips that
    render, so the inputs would keep the typed values.
  - Because a new version remounts the form, the detail query does not refetch on window focus or
    reconnect (`cvQueries.detail`): a version fetched behind the user's back would drop unsaved
    edits. And while a save runs the fields are disabled, since its answer remounts the form.
  - Inputs are uncontrolled (`register`); item lists use `useFieldArray`; new items get
    `crypto.randomUUID()`.
  - Only the save bar and the download button read dirty state (`useFormState`), so typing does
    not re-render the screen. The note on what the PDF will lack watches values on its own, like
    the missing marks.
  - The preview and the match panel read values with `useWatch` and render from
    `useDeferredValue`.
- **Save** sends the version, the title if it changed, and the draft with empty items dropped. On
  success the cache gets the returned CV and the form remounts. A `409 VERSION_CONFLICT` shows the
  conflict notice with "Reload latest"; the save bar then offers no Save, which could only
  conflict again.
- **Save before action.** Answer, skip and download save a dirty form first; a failed save stops
  the action. Answer, skip and download mutations live in `DraftView`, above the form's key, like
  the save: a save before them, or their own answer, brings a new version that remounts the form,
  and their pending state, their errors and what each question card holds must outlive it. While
  a save, an answer or a skip runs, the editor's fields and every card wait, since the remount
  would drop what was typed meanwhile and a second reply would race the first. A download brings
  no new version, so nothing waits for it.
- **Leaving with unsaved changes:** a `beforeunload` prompt and a router blocker, both in the save
  bar. The blocker lets through a change of search params only (`?tab=`), the way to login (the
  session ended) and a navigation with the `discardEdits` state (the CV was deleted).

## 7. Where state lives

| State | Lives in | Example |
|---|---|---|
| Server data | TanStack Query | the CV, the list, the current user |
| Which screen, which CV | the URL path | `/cvs/:cvId` |
| A view choice a reload must keep | a URL search param, written with `replace` | `?tab=questions` on the CV screen; `?next=` on login; `?fromCvId=&role=` on New CV |
| Form values and dirty state | React Hook Form | the editor, the New CV form |
| An unsent form that must survive a reload | `sessionStorage`, read once on mount | New CV autosave (`model/autosave.ts`): saved through a `watch` callback, parsed back with a schema, cleared by `useCreateCv` after a create, even if the form is gone by then; every storage call is guarded, so blocked storage only means nothing is kept. The form from another CV is not kept |
| Anything else in the UI | `useState` in the component that uses it | the two-step delete confirm, show / hide password |

There is no global store. Context is not used for app state; the current user is read from the
`['me']` query.

The tab of the CV screen is in the URL, so a reload and a shared link open the same panel. It is
written with `replace`, so Back leaves the CV screen instead of walking through tabs.

- Questions is a tab while the CV has any question, open or closed, so after the last answer the
  panel still says "no open questions" and lists the answers; a `ready` CV that never had
  questions has no such tab.
- Match is a tab while the role has requirements. It and the header's match bar run
  `computeMatch` (`@cv/shared`) on the deferred form values (`useLiveMatch` over
  `useDeferredCvData`, which the preview reads too), so they follow the edits with no request;
  `MatchBar` and the "Covers N of M" texts sit in `entities/cv`, shared with the figure in My
  CVs. The bar is a `meter`, a measurement, not progress.
- Below 980 px the editor stays mounted and CSS hides it on another tab, so its unsaved values
  stay; the side panel is rendered only while its tab is chosen. From 980 px the editor is always
  shown and the side panel shows the chosen side tab; when the tab is Edit, the questions if the
  CV has any, else the preview.
- Which layout applies is read in JS (`useMediaQuery` in `src/shared/lib`): the switch offers
  different tabs and a different pressed one on each side of 980 px, which CSS alone cannot
  say to a screen reader. jsdom has no `matchMedia`, so tests run the phone layout;
  `wideScreen()` in `src/tests` switches a test to the wide one.

## 8. Mock mode

Mock mode runs the whole app with no backend: MSW answers every `/api` request in the browser.
Why it is built this way: [ADR 0003](adr/0003-mock-mode-outside-the-layers.md).

- **Switching it on.** `pnpm dev:mock` runs `vite --mode mock`. `main.tsx` contains
  `if (import.meta.env.MODE === 'mock') await import('@/mocks/browser')`. The condition is a
  build-time constant, so the plain dev server and the production build never load the mocks, and
  the production bundle does not contain them. No environment variable switches it on.
- **The service worker script** is served by the `msw/vite` plugin in `worker-only` mode, which
  `vite.config.ts` adds only in mock mode; nothing generated is committed to `public/`.
- **Isolation.** `src/mocks` imports only the contract package. No layer of the app imports
  `src/mocks`. The app code is the same in both modes.
- **Behaviour.** The handlers act like the API: ownership (`404`), allowed actions per status
  (`409`), version conflict, validation, limits. The store keeps users, the session, CVs and
  questions in browser storage, and the fake worker advances a CV by elapsed time, so a reload
  loses nothing. The worker has no timers: every handler first moves each CV to where the clock
  says it is (`runWorker`). One CV runs at a time, one stage per polling interval; a keyword in
  the target role picks the course, as the API's worker can take it: `ready` is accepted at once
  (no `revising`), the default is revised once (`verifying` → `revising` → `verifying`) and ends
  with questions, `retry` fails its first attempt and succeeds after `retrying`, `fail` fails all
  three attempts with a doubling wait between them; a retried `fail` CV succeeds. A generation
  takes 9 to 20 s.
  A word in an uploaded PDF's name picks what it holds: `scan` no text (`422`), `long` more text
  than a CV can start from, `short` less; any other PDF gives the sample CV text.
- **Honesty.** Every mock response goes through the same contract schemas in the API client, so a
  mock that drifts from the contract fails loudly.

## 9. Tests

- **The main seam is the whole app at the network boundary.** `renderApp(path)` in `src/tests`
  builds the app with `createApp()` (a fresh `QueryClient`, the real router and API client), with
  the handlers from `src/mocks` answering through `mocks/server.ts`. Retries are off, so a failure
  shows at once. Calling it again in the same test is a page reload: the previous app is unmounted
  and the mock data stays. Each test starts from an empty mock store.
- **One file per user flow** in `src/tests`: auth, list, generation, intake, editor, questions,
  PDF, resilience.
- A test does what a user does: it clicks and types through the DOM and asserts on visible text,
  roles and the URL. It never asserts on hook state, query keys, props or class names.
- Time-based mock generation is driven with fake timers.
- **Unit tests** are for pure functions with real logic and sit next to the file. The mock
  handlers are not tested on their own; the flow tests exercise them.
- `vitest.setup.ts` at the package root registers the DOM matchers, cleans up after each test and
  starts the mock server. It also puts Node's own `FormData` and `File` back over jsdom's: Node's
  `fetch` cannot send jsdom's, so an upload would arrive empty.

## 10. Where does it go

| I am adding… | Put it in |
|---|---|
| a new screen | a route module in `app/routes`, a path in `shared/config/paths.ts`, the screen in a feature |
| a component used by one feature | that feature's `components/` |
| a component that shows a CV fact and is used by two features | `entities/cv/components/` |
| a component with no domain knowledge (button, field, card) | `src/shared/ui/`, with a name from the catalogue in `design.md` |
| a request used by one feature | that feature's `api/` |
| a request about a CV used by two features | `entities/cv/api/` |
| a new endpoint's schema | nowhere here: the contract package, through a root ticket |
| a form schema or a mapping between form and contract shape | the feature's `model/` |
| a text for an API error code | the `model/` of the feature that shows it |
| a label, tone or action for a CV status | `entities/cv/model/statusView.ts` |
| a date or number formatter, a class-name helper | `src/shared/lib/` |
| a link or a redirect target | a builder in `src/shared/config/paths.ts` |
| the top bar, the backdrop, a layout | `app/layout/` |
| something every query needs (retry policy, `401`) | `app/providers/queryClient.ts` |
| a fake API response or scenario | `src/mocks/` |
| a test of a user flow | `src/tests/<flow>.test.tsx` |
| a test of a pure function | next to the file |
| a colour, a radius, a font | a token in `src/index.css`, described in `design.md` |

If nothing fits, the structure is missing a decision: change this file first, then add the code.

## 11. What we do not do

- No `pages`, `widgets` or `processes` layers (ADR 0002).
- No global store, no app state in Context, no copy of server data outside TanStack Query.
- No barrels, no `hooks/`, `types/`, `utils/` or `helpers/` folders.
- No feature importing another feature, and no shared code "just in case" before a second user
  exists.
- No URL strings outside `paths.ts`.
- No mock code reachable from the plain dev server or the production build.
- No manual memoization; React Compiler does it.
- No toasts, no streaming, no polling of the full CV.
