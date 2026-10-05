# 05: Create a CV from text and watch generation

**What to build:** A user names a target role, optionally adds role context, picks the CV language, pastes their
background and submits. They land on the CV page and watch it move through the statuses without
reloading; a reload or a second tab loses nothing. A failed CV can be retried. After this ticket
the flow runs from sign-up to a generated draft (shown as a placeholder until the editor exists).

**Blocked by:** 04

**Status:** done

**Implements:** `.scratch/frontend-first/issues/05-create-and-generation.md`

**Spec:** [../spec.md](../spec.md)

- [x] New CV form: target role (required), "About the role (optional)" up to 5 000 chars with a hint, CV language as a native select with native names (default English), background text area with a counter and the limits; validation from the contract schema, errors next to fields
- [x] Submit is pending and disabled while the request runs; on success the user lands on the CV page
- [x] Mock mode fake worker advances a CV by elapsed time: `queued` (with queue position) → `generating` with the four stages → result; it keeps progressing across reloads
- [x] Scenario by keyword in the target role: `fail` → `failed`; `retry` → `retrying` then success; `ready` → success without questions; otherwise `needs_input`. The draft and questions come from one fixture with all eight blocks and questions of all four kinds
- [x] Mock mode enforces two CVs in progress (`429 TOO_MANY_ACTIVE`) and the hourly limit (`429 RATE_LIMITED` with retry-after); the form says when to try again
- [x] CV page, in progress: a solid panel with the status pill, stage text / "N ahead of you" / "Attempt 2 of 3 failed, retrying…", an indeterminate `ProgressBar`, "You can close this page", announced politely to screen readers; the backdrop drifts on this screen only; Delete is available
- [x] CV page, failed: the user-facing error text, Retry, Delete
- [x] Polling (in `entities/cv`): the statuses endpoint every 3 s only while a CV is in progress, on the CV page and on the list; when a CV leaves that group its detail and the list are refreshed. The full CV is never polled
- [x] Retry from `failed` re-queues the CV; delete works during generation
- [x] Primitives built here: `Textarea`, `Select`, `ProgressBar`
- [x] Tests: create → progress → draft appears without reload; each of the six statuses shows the right panel and actions; limit error on submit; retry
- [x] The look follows `frontend/docs/design.md`; screenshots at 390 px and 1280 px in mock mode are checked against the prototype and mentioned in the report
- [x] `pnpm typecheck && pnpm lint && pnpm build`, the format check and the tests pass

**Architecture:** Structure follows `frontend/docs/architecture.md`: the in-progress and failed panels are `cv-editor/components/progress/`, picked by `CvScreen`; `useRetryCv` and the polling hook live in `entities/cv/api`; the fake worker is `src/mocks/worker.ts`; limit texts are in `cv-create/model/`.
