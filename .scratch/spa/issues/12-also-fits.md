# 12: "Also fits": a new CV from an existing one

**What to build:** Second layer. From a CV with a draft the user picks a suggested role and gets a new CV for it,
generated from the same source and facts, without re-entering anything.

**Blocked by:** 05

**Status:** done

**Implements:** `.scratch/frontend-first/issues/12-suggested-roles.md`

**Spec:** [../spec.md](../spec.md)

- [x] CV header shows up to three suggested-role chips
- [x] A chip opens the New CV form prefilled with the role and the parent's language, with the background hidden and a note that the source of the parent CV is reused
- [x] Submitting creates the CV with `fromCvId`; it counts toward the limits
- [x] Mock mode supports `fromCvId`: copies source and facts, `404` for a foreign CV, `409 INVALID_STATE` when the parent has no draft
- [x] Tests: chip → prefilled form → new CV in progress
- [x] The look follows `frontend/docs/design.md`; screenshots at 390 px and 1280 px in mock mode are checked against the prototype and mentioned in the report
- [x] `pnpm typecheck && pnpm lint && pnpm build`, the format check and the tests pass

**Notes:** The chips sit in the has-draft header, which ticket 07 builds; if 07 is not done yet, build the header minimal here.

**Architecture:** Structure follows `frontend/docs/architecture.md`: the chip link is built with `paths.newCv({ fromCvId, role })`; `cv-editor` does not import `cv-create`.
