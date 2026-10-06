# Spec: the frontend SPA, complete

Status: ready-for-agent
Package: frontend
Sources: root spec `.scratch/frontend-first/spec.md` (contract, mock mode, user flow), the
frontend design grilling of 2026-10-05 (look, styles, architecture), `frontend/docs/design.md`,
`frontend/docs/adr/0001`, `frontend/docs/adr/0002`.

## Problem Statement

The product is designed, but the frontend is an empty page. The contract package exists only in
part, and the backend does not exist yet. The user's job is to turn their background into a CV
written for one target role: upload or paste it, wait for the AI, answer what is missing, edit, and
download a PDF. They need to do this on a phone as easily as on a desktop. Reloading the page or
switching device must lose nothing, and the AI must never quietly put words in their mouth.

The developer needs to build and demo this whole flow in the browser before the server exists.
Later the same code must run against the real API without a change. The look also matters,
because reviewers judge it. The UI should feel modern (a light pastel backdrop with frosted glass
on floating controls) and stay readable, accessible and fast on mid-range phones.

## Solution

A React single-page app that covers the whole user flow: sign up and log in, My CVs, New CV,
generation progress, the editor with questions and preview, and PDF download.

- It talks to the API only through a typed client. The client checks every response against the
  contract schemas from the `shared` workspace package.
- In **mock mode**, which the developer switches on explicitly, the browser itself answers every
  API request, through handlers that behave like the backend. Outside mock mode the same app
  talks to the real API.
- The UI uses its own small set of primitives on native elements and semantic design tokens. It
  is light-only, with a pastel backdrop and frosted glass only on the **glass layer**: top bar,
  tab switcher, save bar and auth card.
- It is built mobile-first. Linting enforces the layer boundaries, and every UI ticket is checked
  with screenshots at phone and desktop width.

## User Stories

### Account

1. As a visitor, I want to sign up with an email and a password, so that my CVs are private to me.
2. As a visitor, I want sign-up errors (invalid email, password shorter than 8 characters, email
   already taken) shown next to the field, so that I can fix them.
3. As a returning user, I want to log in, so that I find my CVs from any device.
4. As a user who mistyped credentials, I want one neutral error message, so that the app does not
   reveal which emails are registered.
5. As a signed-in user, I want to stay signed in after a reload, so that I do not log in on every
   visit.
6. As a signed-in user, I want to log out from the top bar, so that the next person on this device
   cannot see my CVs.
7. As a visitor opening a deep link to a CV, I want to be sent to login and returned to that link
   afterwards, so that bookmarks keep working.
8. As a signed-in user opening the login or sign-up page, I want to be sent to My CVs, so that I
   do not see a pointless form.
9. As a user whose session expired, I want to be taken to login instead of seeing a broken page,
   so that I understand what happened.
10. As a desktop visitor on the login page, I want a short "how it works" next to the form, so
    that I know what the app does before signing up.
11. As a visitor, I want the submit button to show progress and stay disabled while the request
    runs, so that I do not submit twice.

### My CVs

12. As a user, I want a list of my CVs with title, target role, status, open-question count, match
    ("7/10") and last update, so that I see where each one stands.
13. As a new user, I want an empty state that explains what I need and offers "New CV", so that I
    know the first step.
14. As a user, I want the list to update by itself while CVs are generating, so that I do not
    reload.
15. As a user, I want each row to offer the actions its status allows (Open, Watch progress,
    Retry, Delete), so that I never see a button that cannot work.
16. As a user, I want to delete a CV in any status with an inline two-step confirmation, so that I
    do not delete one by accident.
17. As a user, I want to retry a failed CV from the list, so that I do not re-enter my background.
18. As a user, I want dates in my device's locale, so that they read naturally.
19. As a phone user, I want list rows to stack vertically, so that nothing is cut off.

### Creating a CV

20. As a user, I want to enter the target role (required), so that the CV is written for that
    position.
21. As a user, I want to add optional role context ("About the role": a short note or a pasted
    vacancy, up to 5,000 characters) with a hint about what to put there, so that the summary and
    ordering fit the role better.
22. As a user, I want to pick the CV language from a native picker showing native names, with
    English as the default, so that the CV, its questions and its headings come in that language.
23. As a user, I want to paste or type my background, so that I can start without a file.
24. As a user, I want to upload a PDF and see the extracted text in the same text area, with
    "Extracted N chars from M pages, check below", so that I can check exactly what the AI will
    read.
25. As a user, I want a clear message when my file is not a PDF, is over 5 MB or 10 pages, or is a
    scan without text, so that I know to paste the text instead.
26. As a user, I want a character counter and the limits (80 to 20,000 characters) on the form, so
    that I do not hit them on submit.
27. As a user, I want validation errors next to each field before anything is sent, so that I fix
    them in place.
28. As a user, I want Submit disabled while the request runs, so that I do not create the CV twice.
29. As a user who has hit the hourly limit or already has two CVs in progress, I want a message
    that says when I can try again, so that I am not left guessing.
30. As a user, I want to land on the new CV's page right after submitting, so that I can watch its
    progress.

### Generation in progress

31. As a user, I want to see that my CV is queued and how many are ahead of me, so that I know it
    was accepted.
32. As a user, I want the current stage in plain words ("Writing your CV", "Checking facts against
    your source", "Fixing unconfirmed facts", "Saving"), so that the screen never looks frozen.
33. As a user, I want to see "Attempt 2 of 3 failed, retrying…", so that I know the app is
    handling a failure.
34. As a user, I want the reassurance "You can close this page", so that I do not feel I have to
    wait.
35. As a user, I want to reload or close the page and find the CV still progressing, so that I
    lose nothing.
36. As a user, I want to start a second CV while the first is generating, so that I am not
    blocked.
37. As a user, I want a readable error with Retry and Delete when generation fails for good, so
    that I can act on it.
38. As a user, I want to delete a CV while it is generating, so that I can cancel a mistake.
39. As a user, I want the draft to appear by itself when generation finishes, so that I do not
    have to reload.
40. As a user relying on a screen reader, I want progress changes announced politely, so that I
    know what is happening without watching the screen.
41. As a user watching the progress, I want a gently moving backdrop, so that waiting feels alive.
    If I have asked my device for reduced motion, it stays still.

### The draft and its blocks

42. As a user, I want my draft split into Contacts, Summary, Experience, Projects, Education,
    Certifications, Skills and Languages, so that each kind of information has its place.
43. As a user without education, projects, certificates or languages, I want those blocks absent
    from the preview and PDF, so that the CV has no empty headings.
44. As a user, I want missing required blocks (contacts with full name and email or phone,
    summary, skills, experience) marked "missing" in the editor, so that I do not send an
    incomplete CV by accident.
45. As a user with no work experience, I want to be able to skip the experience question, so that
    I am not forced to invent one.
46. As a user, I want to move blocks up and down, with Contacts always first, so that my strongest
    part comes first.
47. As a user, I want to add, remove and reorder items in Experience, Projects, Education,
    Certifications and Languages, so that the CV reflects my priorities.
48. As a user, I want to see how many facts my source confirmed and how many were sent to me to
    confirm, so that I can trust the draft.

### Questions

49. As a user, I want a Questions tab with the open-question count, so that I know how much is
    left.
50. As a user, I want each question to name the part of the CV it is about, so that I understand
    its context.
51. As a user, I want to answer a `choice` question with one tap, or pick "Other" and type, so
    that common answers are quick.
52. As a user, I want to tick the skills I really have from a suggested list and add others, so
    that only true skills enter the CV.
53. As a user, I want to confirm or reject a quoted claim the AI could not verify, so that nothing
    unconfirmed stays in my CV.
54. As a user, I want to answer in free text where needed, so that I can give dates, names and
    numbers.
55. As a user, I want to skip any question except a confirmation, so that I am not forced to share
    something.
56. As a user, I want the card to stop me from sending an empty or invalid answer, so that I do not
    waste a request.
57. As a user, I want my answer to appear in the matching field at once, so that I see its effect.
58. As a user with unsaved edits, I want them saved before my answer is sent, and the answer
    stopped if that save fails, so that neither overwrites the other.
59. As a user, I want answered and skipped questions collapsed under "Answered (N)" with my answer,
    so that I can recall what I said.
60. As a user who filled a field by hand, I want its question to stay open until I answer or skip
    it, so that nothing closes behind my back.
61. As a user who deleted an item, I want the questions about it to disappear after saving, so
    that I am not asked about something that is gone.
62. As a user, I want the CV to show "Ready" when the last open question closes, so that I know I
    am done.

### Editing

63. As a user, I want to edit every field of every block, so that the CV says exactly what I want.
64. As a user, I want to edit bullets as one text area with one bullet per line, so that editing
    is fast on any device.
65. As a user, I want skills as chips I can add and remove, so that the list stays tidy.
66. As a user, I want a save bar that appears only when I have unsaved changes, with Cancel and
    Save, so that I control when changes are stored.
67. As a user, I want the save bar to show "Saved ✓" after a successful save and an error with
    retry after a failed one, so that I always know the state of my work.
68. As a user, I want to rename the CV, so that I can tell my CVs apart.
69. As a user who edited the same CV elsewhere, I want a conflict notice with "Reload latest", so
    that I never silently overwrite newer work.
70. As a user leaving the page or the CV with unsaved changes, I want a warning, so that I do not
    lose them.
71. As a user, I want typing to stay smooth while the preview updates a moment later, so that the
    editor never lags.
72. As a user, I want items whose fields are all empty dropped on save, so that blank entries do
    not clutter the CV.

### Preview

73. As a user, I want a live A4 preview of my unsaved edits, so that I see the result before
    downloading.
74. As a user, I want the preview to use the same font, sizes, block order and headings in the CV
    language as the PDF, so that what I see is what I download.
75. As a user, I want empty blocks and empty fields left out of the preview, so that it matches
    the PDF.

### PDF

76. As a user, I want to download the CV as an A4 PDF, so that I can send it to an employer.
77. As a user with unsaved edits, I want the button to read "Save & download" and save first, so
    that the file matches what I see.
78. As a user with open questions or missing required blocks, I want to download anyway with a
    note listing what is missing, so that I am never stuck.
79. As a user, I want the file named after the CV title, so that I can find it in my downloads.
80. As a user, I want a readable error next to the button when the download fails, so that I can
    retry.

### Layout and phone

81. As a desktop user, I want the editor and a side panel (Questions, Match, Preview) side by
    side, so that I can edit and see the result together.
82. As a phone user, I want one panel at a time (Edit, Questions N, Match, Preview) behind a
    switch that stays at the top, so that the screen is not cramped.
83. As a phone user, I want the save bar pinned to the bottom above the system gesture area, so
    that Save is always within reach.
84. As a phone user, I want touch targets of at least 40 px and inputs that do not zoom on focus,
    so that editing is comfortable.
85. As a user, I want the top bar to stay visible as I scroll, so that navigation and logout are
    always at hand.

### Look and feel

86. As a user, I want a calm light backdrop of soft pastel shapes, so that the app feels modern
    and friendly.
87. As a user, I want the top bar, the tab switcher, the save bar and the auth card to look like
    frosted glass over that backdrop, so that floating controls stand apart from the content.
88. As a user, I want forms, panels and the preview to stay solid and high-contrast, so that text
    is always easy to read.
89. As a user whose browser cannot blur, or who asked for reduced transparency, I want solid bars
    instead of glass, so that nothing becomes unreadable.
90. As a user, I want each status shown with a consistent colour meaning (neutral, accent, wait,
    ok, bad) everywhere, so that I learn it once.
91. As a user, I want clear headings and readable body text in the prototype's fonts, so that the
    app looks deliberate, not generic.

### Accessibility

92. As a keyboard user, I want a clearly visible focus ring on every interactive element, so that
    I always know where I am.
93. As a screen-reader user, I want every field labelled and its error and hint announced, so that
    I can fill forms without seeing them.
94. As a screen-reader user, I want icon-only buttons to have names, so that I know what they do.
95. As a user sensitive to motion, I want animations off when my device asks for reduced motion,
    so that the app is comfortable to use.
96. As a user, I want all text to meet WCAG AA contrast, including text on glass, so that I can
    read it in any light.

### Errors and resilience

97. As a user, I want every screen that loads data to show a skeleton on first open, an error with
    Retry on failure, and an empty state when there is nothing, so that I am never left on a blank
    page.
98. As a user moving between screens, I want a thin progress line in the top bar while the next
    screen loads, so that I know my tap registered.
99. As a user, I want a failed action to show its error next to the control I used, so that I know
    what failed.
100. As a user, I want a "cannot reach the server" state with Retry when the API is down, so that
     I never see fake data.
101. As a user, I want a not-found page for a wrong link or a CV that is not mine, so that I can
     find my way back.
102. As a user, I want the app to ignore malformed data from the server instead of rendering
     garbage, so that I never see a broken screen.

### Second layer (cut first if time runs out)

103. As a user, I want a match bar ("Covers 7 of 10 requirements") in the CV header and a Match tab
     listing covered requirements (with where they were found) and missing ones, so that I know
     what to add if it is true.
104. As a user, I want the match to update as I type or answer, without a request, so that I see
     the effect at once.
105. As a user, I want missing experience requirements to say "Add it in the editor if it's true",
     never to insert text for me, so that the CV stays truthful.
106. As a user, I want "Also fits" role chips that open New CV prefilled to create a CV from the
     same source and facts, so that I can target another role without retyping.
107. As a user, I want to see how many generations I have left this hour on New CV, so that the
     limit is not a surprise.
108. As a user, I want my unsent New CV form to survive a reload, so that I do not retype it.

### Developer

109. As a developer, I want a dedicated command that runs the app in mock mode, so that I can
     build and demo every screen without a backend.
110. As a developer, I want the plain dev command and the production build to have no way of
     turning mock mode on by themselves, so that fake data never reaches a real user.
111. As a developer, I want mock data to persist across reloads, so that reload safety can be
     exercised.
112. As a developer, I want to trigger every generation outcome by a keyword in the target role
     (`fail`, `retry`, `ready`, anything else meaning questions), so that I can see every status
     on demand.
113. As a developer, I want mock responses checked by the same contract schemas as real ones, so
     that the mocks cannot drift from the contract.
114. As a developer, I want the mock to enforce ownership, allowed actions per status, version
     conflicts, validation and limits like the API, so that error paths are real.
115. As a developer, I want the lint step to fail when a layer imports upwards or a feature
     imports another feature, so that the architecture holds without review.
116. As a developer, I want imports through a `@/` alias, so that moving files does not break
     long relative paths.
117. As a developer, I want class order and formatting enforced by a formatter check, so that diffs
     stay clean.
118. As a developer, I want the default Tailwind palette switched off, so that an off-system
     colour fails the build instead of slipping in.
119. As a developer, I want a screenshot command that captures every screen at 390 px and 1280 px
     in mock mode, so that I can check the look of each UI ticket without clicking through.
120. As a developer, I want tests that drive the real app through the DOM against the mock
     handlers, so that a passing test means the flow works.
121. As a developer, I want route screens lazy-loaded, so that the first page stays small on a
     phone.

## Implementation Decisions

### Dependencies on the contract

- The frontend reads the contract and never changes it.
  - Request and response schemas, the draft schema (eight blocks, block order, limits), the
    status machine and its groups, generation stages, question kinds, the CV language list, the
    "what is missing" rule, the empty-block rule and `computeMatch` all come from the **`shared`
    workspace package**.
  - It is imported under the name `@cv/shared` once root ticket 15 lands.
- Needed from the root tracker before the matching frontend work:
  - root ticket 02 (REST schemas, questions, languages, match);
  - root ticket 15 (package rename).
- If a frontend ticket finds the contract lacking, it stops and gets a root ticket. It never
  patches the contract locally.
- Contract points the UI relies on (from the root spec):
  - `roleContext`, up to 5,000 characters.
  - `PATCH` takes the version plus an optional title and/or draft. Ids of new items are generated
    on the client as UUIDs.
  - A save that removes an item skips the questions about it, and so can turn the CV `ready`.
  - Answering a question whose target is gone returns `409 INVALID_STATE`.
  - `confirm` cannot be skipped.
  - The PDF is rendered from saved data only.

### Architecture

- **Layers:** `app → features → entities → shared`, imports only go downwards, and a feature
  never imports another feature (ADR 0002).
  - **app:** the router, providers, the layout (top bar, backdrop) and thin route modules. Each
    route module declares `lazy`, `loader` and `ErrorBoundary`, and these modules are the only
    code that knows URLs.
  - **features:** auth, cv-list, cv-create, cv-editor. Each one holds its components, API
    (query options, mutations) and model (form schemas, maps).
  - **entities/cv:** CV query options (list, detail, statuses), the status view map
    (status → label, tone, allowed actions), the status pill, the match bar and status polling.
  - **`src/shared` layer:** the API client, UI primitives and small utilities (`cx`, formatting
    with `Intl`). It holds no domain logic.
- **Enforcement:** oxlint `no-restricted-imports` per folder through overrides,
  `import/no-cycle`, `jsx-a11y`. A `@/` alias is set up in both TypeScript and Vite.
- **Files:** one component per `PascalCase` file, hooks named `useX`, named exports only.
  Route modules export what React Router expects. No barrel files. Tests sit next to the code.
- **React rules:**
  - React Compiler does the memoisation, so no manual `memo`, `useMemo` or `useCallback`.
  - Server state lives only in TanStack Query: no copies in `useState` or Context, and no global
    store.
  - Context only for the current user.
  - Derived values are computed during render, not in effects.
  - Logic triggered by a user action goes in its event handler.
  - No component is declared inside another component.

### Auth and the token

- Auth is not a layer of its own.
  - `features/auth` owns the sign-up and login forms, the login / signup / logout mutations and
    the current-user query.
  - `app` wires it to routes: the protected layout loader, the redirect away from login for a
    signed-in user, the global 401 handler, and the top bar with the email and Log out.
  - The API client in the `src/shared` layer knows nothing about auth. It only sends same-origin
    credentials and throws a typed error.
  - An `entities/session` is added only if a second feature ever needs the current user.
- **The frontend never reads, stores or decodes the JWT.**
  - The server sets it in an `httpOnly`, `SameSite=Lax` cookie on sign-up and login, and the
    browser attaches it to every `/api` request.
  - There is no `localStorage` token, no `Authorization` header and no refresh logic.
- Whether a user is signed in is known only from `GET /api/auth/me`: 200 means signed in, 401
  means not. That call reports state and grants nothing. The server checks access on every
  request, and the protected routes are a convenience, not a defence.
- An expired cookie makes the next request return 401, which leads to login with a return
  address. Log out clears the cookie through the API and empties the query cache.
- The `next` return address is accepted only as a same-origin relative path.
- **Forms:**
  - Email and password only.
  - `autocomplete` values that password managers understand.
  - A show / hide password button.
  - One neutral message for wrong credentials.
- In mock mode the handlers keep the session in browser storage and answer 401 / 404 like the
  API. The app code is the same.

### Routing and data loading

| Route | Screen | Loader |
|---|---|---|
| login, sign-up | auth form | redirect to My CVs if already signed in |
| `/` | My CVs | protected layout ensures the current user; a 401 redirects to login with `next` |
| `/cvs/new` | New CV (prefill from `fromCvId` + `role` in the second layer) | with `fromCvId`, ensures that CV (not own → Not found) |
| `/cvs/:cvId` | CV, with content chosen by status group | ensures the CV detail |
| anything else | Not found | — |

- Loaders call the query client's ensure-data methods, and screens read with suspense queries.
  So data is always present on render, and there is no `isPending` branching in screens.
- **Errors:** the route `ErrorBoundary` shows an error state with Retry, which resets the query
  and revalidates. A 404 shows Not found.
- **Navigation feedback:** a thin progress line in the top bar while the router is loading.
  Skeletons only as the Suspense fallback on a cold open. No full-screen spinners.
- Every route screen is lazy-loaded.
- The URL holds all navigation state, so deep links, the back button and reload all work.

### API client

- One `fetch` wrapper for the whole app.
  - It uses same-origin credentials and parses every response with the contract schema for that
    endpoint.
  - On failure it throws a typed error with status, code, message, details and `Retry-After`.
- Malformed JSON or a failed parse becomes an error, never rendered data.
- **401:** clears the current user from the cache, and the router sends the user to login with a
  return address.
- **Network failure:** when there is no mock mode and no backend, this shows "cannot reach the
  server" with Retry.
- PDF ingest posts multipart. PDF download fetches a blob and takes the filename from
  `Content-Disposition`.

### Server state and polling

- Query keys: `['me']`, plus `['cvs', …]` for the list, the detail and the statuses.
- Mutations that return the full CV write it into the detail cache with `setQueryData`; they don't
  refetch.
- **Polling:**
  - The list and the CV page poll the statuses endpoint for in-progress ids only, every 3 s, and
    only while that set is non-empty. Polling pauses in background tabs.
  - When a CV leaves the in-progress group, its detail and the list are invalidated.
  - The full CV is never polled.
- Components subscribe narrowly with `select`. For example, the questions panel reads only the
  questions, and the progress card reads only the status info.

### Screens

- **Auth:**
  - One glass card with the form, field-level validation from the contract schemas, and readable
    messages for `EMAIL_TAKEN` and `INVALID_CREDENTIALS`.
  - From the desktop breakpoint, a "how it works" column sits next to it.
- **My CVs:**
  - Each row shows title, target role, status pill, open questions, match `covered/total` (when a
    draft exists) and updated time.
  - Row actions follow the status group: Open / Watch progress / Retry / Delete. Delete uses the
    two-step inline confirm.
  - An empty state explains the first step. Rows stack below 760 px.
- **New CV:**
  - Target role (required, 2–100 characters).
  - "About the role (optional)", up to 5,000 characters, with a hint.
  - CV language as a native select with native names, default English.
  - Background text area with a character counter (80–20,000) and an "Upload PDF" button.
    - The upload goes to ingest, the text lands in the text area, and a notice reports the
      characters and pages.
    - Ingest errors (`415`, `413`, `422`, `429`) show as readable messages next to the upload.
  - Submit is pending-aware and disabled while the request runs. `429` messages use
    `Retry-After`.
  - On success the app navigates to the CV page.
- **CV, in progress (queued, generating, retrying):**
  - A solid panel with the status pill and the stage text, "N ahead of you", "Attempt 2 of 3
    failed, retrying…", an indeterminate progress bar and "You can close this page".
  - The panel is `aria-live="polite"`.
  - The backdrop drifts only while the generation panel is on screen.
  - Delete is available.
- **CV, failed:** the user-facing error text for the error code, with Retry and Delete.
- **CV, has draft (needs_input, ready):**
  - **Header:** editable title, target role, status pill, the match bar (second layer), "Also
    fits" chips (second layer) and Download PDF with a missing-blocks warning.
  - **Notices:** the verification report notice and, when needed, the version-conflict notice
    with "Reload latest".
  - **Editor:**
    - All eight blocks, with Contacts first.
    - Every other block has up/down controls that change the block order.
    - Item blocks have add, remove, up and down controls.
    - Bullets are edited as one text area, one per line.
    - Skills are chips.
    - Missing required blocks are marked.
  - **Side panel** tabs: Questions · N (while the CV has any question, open or closed), Match
    (second layer) and Preview.
  - **Save bar** when the form is dirty.

### Editor mechanics

- One React Hook Form over the whole draft, with title alongside.
  - The form is keyed by CV id and version, so it remounts with fresh defaults when the server
    version changes. There are no syncing effects.
  - Inputs are uncontrolled through `register`, and item arrays use `useFieldArray`.
  - New item ids come from `crypto.randomUUID()`.
- Only the save bar reads dirty state (`useFormState`), so typing does not re-render the page.
- Preview and Match read values with `useWatch` and render from `useDeferredValue`, so they update
  a moment after typing.
- **Save:**
  - Sends the version, the title if changed, and the draft with fully empty items dropped.
  - On success: the cache is updated, the form remounts at the new version, and the save bar shows
    "Saved ✓".
  - On `409 VERSION_CONFLICT`: the conflict notice with "Reload latest", which discards local edits
    after an explicit click.
  - **Cancel** resets to the server values.
- **Leaving with unsaved changes:** a `beforeunload` prompt, plus a router blocker on in-app
  navigation.
- **Save-before-action:** answer, skip and download first save a dirty form. A failed save stops
  the action and shows its error.

### Questions panel

- Open questions are shown as cards by kind:
  - `text`: an input;
  - `choice`: options plus "Other" with an input;
  - `multi`: checkboxes plus "Other";
  - `confirm`: the quoted claim with Yes / No.
- Each card shows the target label, and validates itself before sending:
  - not empty;
  - at most 1,000 characters;
  - `multi` needs at least one value or "Other".
- Skip is shown for every kind except `confirm`.
- Closed questions sit collapsed under "Answered (N)" with the given answer. They cannot be
  answered again.
- A successful answer or skip returns the full CV. The cache updates, the field shows the value,
  and the status may become Ready.
- `409 INVALID_STATE` (target gone, or already closed) refreshes the CV and explains why.

### Preview

- An HTML A4 sheet rendered from unsaved form values.
- It uses the A4 aspect ratio and the PDF's font (Liberation Sans) and sizes, expressed in
  container-query units.
- Block headings come in the CV language, and blocks follow the draft's block order. Empty blocks
  and empty fields are skipped, using the same empty-block rule as the PDF.
- The sheet uses the paper tokens and stays white.

### PDF download

- When the form is dirty, the button reads "Save & download" and saves first. A failed save stops
  the download.
- The file is fetched as a blob, handed to a temporary `<a download>`, and named from the response
  header.
- Errors appear next to the button.
- The download is allowed in `needs_input`, with a hint about open questions. A warning lists the
  missing required blocks, but never blocks the download.

### Mock mode

- **Switching it on:**
  - Only an explicit dev command or flag switches it on.
  - The plain dev command and the production image cannot enable it, and the mock code is not in
    the production bundle.
- **How it works:**
  - MSW network-level handlers answer the requests, so the real client, parsing, errors and
    polling run unchanged.
  - The same handlers back the tests.
- **State:**
  - Users, the session, CVs and questions live in browser storage, so a reload loses nothing.
  - A fake worker advances CVs based on elapsed time: `queued` → `generating` (the four stages) →
    result. Because it is time-based, progress continues across reloads.
- **Scenario by keyword in the target role:**
  - `fail`: `failed`;
  - `retry`: `retrying`, then success;
  - `ready`: success with no questions;
  - anything else: `needs_input`.
- **Draft fixture:** an English backend-engineer CV with all eight blocks and questions of all four
  kinds. It does not depend on the typed text.
- **Enforced like the API:**
  - ownership (`404`);
  - allowed actions per status (`409 INVALID_STATE`);
  - version conflict;
  - validation (`400` with `details.fields`);
  - two in progress (`429 TOO_MANY_ACTIVE`);
  - hourly limits (`429 RATE_LIMITED` with `Retry-After`);
  - removal of an item skips the questions about it.
- **PDF ingest:** returns fixture text, but checks for real:
  - not a PDF → `415`;
  - over 5 MB → `413`;
  - a filename containing `scan` → `422`.
- **PDF download:** returns a static A4 fixture.
- **Answers** follow a simple rule:
  - scalar target → write the value;
  - skills → append;
  - `confirm` yes → append the claim.

### Design system

The full reference is `frontend/docs/design.md`; decisions are in ADR 0001 and ADR 0002.

- **Look:**
  - Light theme only.
  - A backdrop of 3–5 blurred pastel shapes in one fixed CSS layer. It is static everywhere except
    the generation panel, which carries a `data-backdrop="drift"` marker that the backdrop picks
    up with CSS `:has()`, and only behind `motion-safe`.
- **Glass:**
  - Own CSS frosted glass: a `glass` utility and `glass-*` tokens.
  - Used only on the glass layer (top bar, segmented control, save bar, auth card), with at most
    3–4 glass surfaces on screen.
  - Falls back to solid where `backdrop-filter` is unsupported or reduced transparency is
    requested.
  - No refraction, and blur is never animated.
  - Text on glass is `ink` or `accent` only and passes AA without the blur.
- **Tokens:**
  - Semantic tokens from the prototype (surfaces, text, lines, tones with soft variants, paper),
    plus the backdrop and glass tokens, all in Tailwind `@theme`.
  - The default palette is off and arbitrary colours are banned.
  - Breakpoints: `md` = 760 px and `lg` = 980 px.
- **Fonts:**
  - Unbounded, Golos Text and JetBrains Mono via `@fontsource`, latin and cyrillic subsets.
  - Liberation Sans for the preview sheet.
  - Radii 6 / 8 / 999, flat 1 px borders, and a 2 px accent focus ring on `focus-visible`.
- **Primitives:**
  - Our own, on native elements, built when first needed, using the names from the catalogue:
    `Button`, `Field`, `Input`, `Textarea`, `Select`, `Pill`, `Chip`, `Panel`, `Notice`,
    `ProgressBar`, `EmptyState`, `ErrorState`, `ConfirmButton`, `SegmentedControl`,
    `FloatingBar`, `GlassCard`.
  - They take native props and `ref` as a prop. `className` is for layout only.
  - Variants are a `Record` of class strings joined by `cx()`. No cva, tailwind-merge, CSS-in-JS
    or inline styles (except CSS variables).
- **Tone:**
  - `neutral | accent | wait | ok | bad` is the only colour prop.
  - Status maps to tone in `entities/cv`: queued neutral, generating accent, retrying and
    needs_input wait, failed bad, ready ok.
- **Where looks are set:** feature and entity code use only layout utilities. Colour, border,
  radius, shadow and type come from primitives.
- **Motion and icons:**
  - CSS-only motion behind `motion-safe`. No toasts.
  - `lucide-react` icons by named import, decorative icons get `aria-hidden`, and icon-only
    buttons get an `aria-label`.
- **Layout:**
  - From 980 px: two columns, the editor at `1.08fr` and the side panel at `.92fr`.
  - Below 980 px: one column, the segmented control sticky at the top under the top bar, and the
    save bar sticky at the bottom with the safe-area inset.
- **UI text:**
  - All UI text is English.
  - Dates and numbers are formatted with `Intl` in the device locale.

### Tooling

- Prettier with `prettier-plugin-tailwindcss`, plus a format check script.
- oxlint with the layer boundaries, `import/no-cycle` and `jsx-a11y`.
- The `@/` alias.
- Vitest with Testing Library (jsdom) and MSW.
- Playwright (Chromium) for a screenshot script and one or two smoke runs in mock mode.
- The check before committing grows to typecheck, lint, format check, tests and build.

### Delivery layers

- **First pass:**
  - stories 1–102, without the match bar, Match tab and "Also fits" chips;
  - stories 109–121.
- **Second layer**, as separate tickets, cut first:
  - Match panel and match bar (103–105);
  - "Also fits" (106);
  - usage (107);
  - New CV autosave (108).
- Cut order if time runs short: "Also fits", then usage and autosave, then the Match UI.

## Testing Decisions

A good test does what a user does and checks what a user sees. It renders the real app, clicks and
types through the DOM, and asserts on visible text, roles and navigation. It never asserts on hook
state, query keys, component props or class names. Tests stay valid through any refactor that
keeps the behaviour.

**Seam 1, the main and only automated seam: the app at the network boundary.**

The real router, providers and API client are rendered in Vitest with Testing Library, and the MSW
mock-mode handlers answer the network. Each test starts from a fresh mock store. Time-based mock
generation is driven with fake timers.

Covered:
- **Auth:** sign up; login failure message; redirect to login with the return address and back;
  `401` mid-session leads to login; a signed-in user on login is sent to My CVs.
- **Status → screen:** each of the six statuses shows the right panel, pill label and actions.
- **Generation:** create → progress with stages → the draft appears without a reload; the `retry`
  and `fail` scenarios; Retry from failed.
- **List:** empty state; rows update as polling moves statuses; two-step delete.
- **Intake:** wrong type, too large and scan messages; extracted text lands in the text area.
- **Editor:**
  - Save → "Saved ✓".
  - A version conflict shows the notice, and "Reload latest" restores server values.
  - Deleting an item with an open question removes the question after save.
  - Block reorder is reflected in the preview.
  - The unsaved-changes guard works.
- **Questions:**
  - Validation per kind; an answer updates the field; skip.
  - `confirm` has no Skip.
  - The last question turns the CV Ready.
  - Save-before-answer, and a failed save stops the answer.
- **PDF:** a dirty form saves before download; the missing-blocks warning; a download error is
  shown.
- **Resilience:** a server-down state with Retry when the client cannot reach the API; a malformed
  response shows an error, never garbage.

**Visual check, not a test seam.** A Playwright script starts the app in mock mode and captures
every screen at 390 px and 1280 px into a gitignored folder. Each UI ticket ends by looking at both
widths against the prototype. One or two Playwright smoke runs, sign up through to the draft
appearing, confirm that the real browser build works.

The mock handlers are not unit-tested on their own. They are exercised through seam 1, and every
response passes the contract schemas inside the API client, which keeps them aligned with the
contract. Pure helpers in the `src/shared` layer (formatting, `cx`) get unit tests only when they
hold real logic.

**Prior art:** the `shared` package already has Vitest unit tests next to its modules (status
machine, draft schema, missing rule). Frontend tests follow the same runner and the same
co-location. The frontend has no tests yet, so this spec sets its pattern.

## Out of Scope

- The backend: API, worker, database, agents, fact verification, PDF rendering and real PDF text
  extraction.
- Any change to the contract: it goes through the root tracker.
- Dark mode (dropped). Real refraction ("liquid" SVG filters). Glass on content, inputs or the
  preview.
- Toast notifications, a global state store, runtime CSS-in-JS, a third-party UI kit, an
  animation library.
- UI translations: the UI is English; only the CV content and its headings follow the CV language.
- Drag-and-drop reordering (up/down buttons only), multiple PDF templates, a PDF generated in the
  browser.
- Regenerating an existing CV.
- Everything the task spec excludes: OAuth, password reset, email verification, payments, admin.

## Further Notes

- **Link to the root tracker.** Root tickets 03–13 (`.scratch/frontend-first/issues/`) describe
  the same user flow from the product side. The tickets cut from this spec take them over: each
  carries an `Implements:` line, and the root tickets are `moved` with a `Moved to:` line. Only
  the tickets here are implemented.
- **Contract readiness.** `api.md` in the root still shows the old five-block draft and
  `roleNote`. The frontend builds against the updated contract from the root spec, which root
  ticket 02 brings into `shared` and the docs. Frontend tickets that need schemas from root
  ticket 02 are blocked by it.
- **Backdrop colours** are named, not fixed (lavender, mint, peach, sky, pink). Final values are
  tuned with screenshots, under the rule that `accent` stays AA-readable over each.
- **`prefers-reduced-transparency`** works only in Chromium. On iOS the glass tint is opaque
  enough on its own, which is why the tint is ~72–80 % white.
- **Vocabulary:**
  - Domain terms (CV, Target role, Source, Draft, Question, Fact, Role context) come from the
    `shared` glossary.
  - Frontend terms (Mock mode, Tone, Glass layer) come from `frontend/GLOSSARY.md`.
