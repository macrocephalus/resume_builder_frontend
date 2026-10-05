# 07: Draft editor with Save and version conflict

**What to build:** On a CV that has a draft, the user edits every field of all eight blocks, adds, removes and
reorders items, renames the CV and saves. Saving from a stale tab produces a conflict notice
instead of overwriting newer work.

**Blocked by:** 05

**Status:** ready-for-agent

**Spec:** [../spec.md](../spec.md)

- [ ] Has-draft CV page: header (editable title, target role, status pill) and the editor; two columns from 980 px (`1.08fr` / `.92fr`); below it a glass `SegmentedControl`, sticky under the top bar, switches panels (later tickets add Questions and Preview to it)
- [ ] Editor covers contacts, summary, experience, projects, education, certifications, skills, languages; items can be added, removed, moved up / down; bullets are edited one per line; skills as `Chip`s; new items get client-generated UUIDs
- [ ] Required blocks and fields that are missing are marked "missing" using the rule from the `shared` package
- [ ] One form over the whole draft, remounted when the server version changes (no syncing effects); uncontrolled inputs; only the save bar reads dirty state, so typing does not re-render the page
- [ ] Glass save bar (`FloatingBar`) appears only when the form is dirty, with Cancel and Save; sticky at the bottom above the system gesture area; shows "Saved ✓" after a save and the error with retry after a failed one
- [ ] The CV title can be changed and saved without sending the draft; items with every field empty are dropped on save
- [ ] Mock mode PATCH: validates the body, checks the version, returns the CV with the next version; a stale version → `409 VERSION_CONFLICT`; PATCH in a no-draft status → `409 INVALID_STATE`
- [ ] On a version conflict the user sees a notice with "Reload latest"
- [ ] Leaving the page or navigating inside the app with unsaved changes asks for confirmation
- [ ] At most three glass surfaces on the phone layout: top bar, segmented control, save bar; inputs are 16 px and solid
- [ ] Primitives built here: `Chip`, `SegmentedControl`, `FloatingBar`
- [ ] Tests: edit and save, cancel, add / remove / reorder an item, rename only, version conflict notice and reload, empty item dropped, unsaved-changes guard
- [ ] The look follows `frontend/docs/design.md`; screenshots at 390 px and 1280 px in mock mode are checked against the prototype and mentioned in the report
- [ ] `pnpm typecheck && pnpm lint && pnpm build`, the format check and the tests pass

**Notes:** Covers the same flow as root ticket `.scratch/frontend-first/issues/07`; this ticket is the one to implement.
