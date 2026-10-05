# 08: A4 preview and block order

**What to build:** The user sees a live A4 preview of the CV while typing and can change the order of blocks; the
preview follows that order and never shows an empty block or field.

**Blocked by:** 07

**Status:** ready-for-agent

**Implements:** `.scratch/frontend-first/issues/08-preview-and-block-order.md`

**Spec:** [../spec.md](../spec.md)

- [ ] Preview panel renders an A4-proportioned sheet from the unsaved form values, in Liberation Sans with sizes in container-query units and the paper tokens; it updates slightly after typing so input stays responsive
- [ ] Headings come from the CV language's list in the `shared` package; blocks follow `sectionOrder`; contacts is always first
- [ ] Empty blocks, empty items and empty fields are not rendered — no stray headings, separators or `undefined`
- [ ] Blocks can be moved up / down in the editor; the order is saved with the draft and survives a reload
- [ ] From 980 px the preview is a tab of the side panel; below it, one of the panels behind the segmented control
- [ ] Tests: reorder blocks → preview order changes and persists after save; a draft with only a name shows no block headings
- [ ] The look follows `frontend/docs/design.md`; screenshots at 390 px and 1280 px in mock mode are checked against the prototype and mentioned in the report
- [ ] `pnpm typecheck && pnpm lint && pnpm build`, the format check and the tests pass
