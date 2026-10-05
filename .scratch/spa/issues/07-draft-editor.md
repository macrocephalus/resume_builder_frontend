# 07: Draft editor with Save and version conflict

**What to build:** On a CV that has a draft, the user edits every field of all eight blocks, adds, removes and
reorders items, renames the CV and saves. Saving from a stale tab produces a conflict notice
instead of overwriting newer work.

**Blocked by:** 05

**Status:** done

**Implements:** `.scratch/frontend-first/issues/07-draft-editor.md`

**Spec:** [../spec.md](../spec.md)

- [x] Has-draft CV page: header (editable title, target role, status pill) and the editor; ~~two columns from 980 px (`1.08fr` / `.92fr`); below it a glass `SegmentedControl`, sticky under the top bar, switches panels (later tickets add Questions and Preview to it)~~ — moved to 08: with the editor as the only panel there is nothing to switch to and no second column
- [x] Editor covers contacts, summary, experience, projects, education, certifications, skills, languages; items can be added, removed, moved up / down; bullets are edited one per line; skills as `Chip`s; new items get client-generated UUIDs
- [x] Required blocks and fields that are missing are marked "missing" using the rule from the `shared` package
- [x] One form over the whole draft, remounted when the server version changes (no syncing effects); uncontrolled inputs; only the save bar reads dirty state, so typing does not re-render the page
- [x] Glass save bar (`FloatingBar`) appears only when the form is dirty, with Cancel and Save; sticky at the bottom above the system gesture area; shows "Saved ✓" after a save and the error with retry after a failed one
- [x] The CV title can be changed and saved without sending the draft; items with every field empty are dropped on save
- [x] Mock mode PATCH: validates the body, checks the version, returns the CV with the next version; a stale version → `409 VERSION_CONFLICT`; PATCH in a no-draft status → `409 INVALID_STATE`
- [x] On a version conflict the user sees a notice with "Reload latest"
- [x] Leaving the page or navigating inside the app with unsaved changes asks for confirmation
- [x] At most three glass surfaces on the phone layout: top bar, ~~segmented control~~ (08), save bar; inputs are 16 px and solid
- [x] Primitives built here: `Chip`, `FloatingBar`, `Fieldset` (`SegmentedControl` moved to 08 with the tabs)
- [x] Tests: edit and save, cancel, add / remove / reorder an item, rename only, version conflict notice and reload, empty item dropped, unsaved-changes guard
- [x] The look follows `frontend/docs/design.md`; screenshots at 390 px and 1280 px in mock mode are checked against the prototype and mentioned in the report
- [x] `pnpm typecheck && pnpm lint && pnpm build`, the format check and the tests pass

**Architecture:** Structure follows `frontend/docs/architecture.md` §6–§7: the editor lives in `cv-editor/components/editor/`, the form schema and the draft ↔ form mapping in `cv-editor/model/`; ~~the active panel is the `?tab=` search param, written with `replace`~~ (moved to 08 with the tabs).

**Follow-up:** Log out with unsaved edits does not ask yet. The blocker lets the way to login
through, because `useLogout` ends the session before it navigates, so "Stay" would leave a
signed-out editor. Asking first means changing `useLogout` (ticket 03 code).
