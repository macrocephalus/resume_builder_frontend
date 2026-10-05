# 03: Sign up and log in (mock mode, API client)

**What to build:** A visitor can sign up, log in, stay signed in across reloads and log out — in mock mode, with no
backend. This is the first slice through every layer, so it also brings mock mode, the API client
and the route protection every later screen stands on.

**Blocked by:** 02; root tickets `.scratch/frontend-first/issues/02` and `15`

**Status:** done

**Implements:** `.scratch/frontend-first/issues/03-frontend-foundation-auth.md`

**Spec:** [../spec.md](../spec.md)

- [x] A dedicated dev command starts the app in mock mode; the plain dev command and the production build cannot switch it on, and mock code is not in the production bundle
- [x] Mock mode answers `/api` with MSW handlers; users and the session persist in browser storage across reloads
- [x] API client (`src/shared` layer): same-origin credentials, every response parsed with the contract schema, a typed error with status, code, message, details and retry-after; a malformed response is an error, never rendered
- [x] **Token handling:** the frontend never reads, stores or decodes the JWT — it lives in an `httpOnly` cookie set by the server; no `localStorage`, no `Authorization` header, no refresh logic. Whether a user is signed in is known only from `GET /api/auth/me`
- [x] Auth lives in `features/auth`: sign-up and login forms, login / signup / logout mutations, the current-user query. `app` wires it to routes; the API client knows nothing about auth
- [x] Sign-up and login screens on a glass card: email and password only, field-level validation from the contract schemas (valid email, password 8–128 chars), `EMAIL_TAKEN` next to the email field, one neutral message for `INVALID_CREDENTIALS`, a readable message for a throttled login (`429`)
- [x] Form practice: labelled fields, `autocomplete` `email` / `new-password` / `current-password` so password managers work, `type=email`, a show / hide password button, submit pending and disabled while the request runs, Enter submits, links between login and sign-up
- [x] From the `lg` breakpoint the auth screen shows the "how it works" steps next to the card
- [x] Protected layout loads the current user in its loader; an anonymous visitor goes to login with a `next` return address and lands on the original link after logging in; `next` is accepted only as a same-origin relative path; a signed-in user opening login / sign-up goes to My CVs
- [x] A `401` from any request clears the current user and leads to login; log out (in the top bar, with the user's email) clears the cookie through the API and empties the query cache
- [x] Not-found screen; route error boundary with Retry; navigation progress line in the top bar; without mock mode and without a backend the app shows "cannot reach the server" with Retry, never fake data
- [x] Primitives built here, by the catalogue: `Button`, `Field`, `Input`, `Notice`, `GlassCard`, `ErrorState`
- [x] The screenshot script runs in mock mode from now on
- [x] oxlint: `src/mocks` imports nothing from the layers; no layer imports `src/mocks` or `src/tests` (ADR 0003)
- [x] Tests through the real router, providers and API client against the mock handlers: sign up, taken email, login failure, redirect with return address and back, `401` handling, signed-in user on login, log out
- [x] The look follows `frontend/docs/design.md`; screenshots at 390 px and 1280 px in mock mode are checked against the prototype and mentioned in the report
- [x] `pnpm typecheck && pnpm lint && pnpm build`, the format check and the tests pass

**Architecture:** Structure follows `frontend/docs/architecture.md`: mock mode in `src/mocks`, switched by `vite --mode mock` (ADR 0003); flow tests in `src/tests` with `renderApp()`; the router is `createAppRouter(queryClient)`; URLs only in `src/shared/config/paths.ts` (including the `next` check); `401` handled in `app/providers/queryClient.ts`; error-code texts in the feature's `model/`.
