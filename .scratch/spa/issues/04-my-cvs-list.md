# 04: My CVs list

**What to build:** A signed-in user sees the list of their own CVs with status, open-question count and last update,
an empty state when there are none, and can delete a CV. Mock mode gets its CV store, and
`entities/cv` gets what every later screen needs about a CV.

**Blocked by:** 03

**Status:** done

**Implements:** `.scratch/frontend-first/issues/04-cv-list.md`

**Spec:** [../spec.md](../spec.md)

- [x] Mock mode stores CVs per user in browser storage and seeds nothing for a new account; another user's CV is invisible (`404`)
- [x] `entities/cv`: query options for list, detail and statuses; the status view map (status → label, tone, allowed actions); the status `Pill`. Nothing derives a status from other fields
- [x] List rows show title, target role, status pill, open-question count, match `covered/total` when present, last update in the device locale
- [x] Empty state explains what is needed to start and links to New CV
- [x] Delete works in any status with the inline two-step `ConfirmButton`; a failed delete shows its error next to the button
- [x] Row actions depend on the status group: open, watch progress, retry, delete
- [x] The list loads through the route loader; skeleton on a cold open, error with Retry, empty state
- [x] Rows stack below 760 px; touch targets are at least 40 px
- [x] Primitives built here: `Pill`, `Panel`, `EmptyState`, `ConfirmButton`
- [x] Tests: empty state, rows for CVs in different statuses with the right labels and actions, delete with confirmation
- [x] The look follows `frontend/docs/design.md`; screenshots at 390 px and 1280 px in mock mode are checked against the prototype and mentioned in the report
- [x] `pnpm typecheck && pnpm lint && pnpm build`, the format check and the tests pass

**Architecture:** Structure follows `frontend/docs/architecture.md`: `useDeleteCv` lives in `entities/cv/api` (the CV screen uses it too); segments are `api/`, `model/`, `components/`; links come from `paths.ts`; the flow test goes to `src/tests`.
