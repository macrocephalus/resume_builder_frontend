# 13: Usage limits and autosave of the New CV form

**What to build:** Second layer. The New CV form shows how many generations are left this hour, and an unsent form
survives a reload.

**Blocked by:** 05

**Status:** done

**Implements:** `.scratch/frontend-first/issues/13-usage-and-form-autosave.md`

**Spec:** [../spec.md](../spec.md)

- [x] The form shows generations used / limit and when the window resets; submit is disabled with an explanation when the limit is reached or two CVs are in progress
- [x] Mock mode serves the usage endpoint from its own counters
- [x] The unsent form is kept in session storage and restored after a reload; it is cleared after a successful submit; a blocked or failing storage never breaks the form
- [x] Tests: limit reached disables submit; form restored after reload
- [x] The look follows `frontend/docs/design.md`; screenshots at 390 px and 1280 px in mock mode are checked against the prototype and mentioned in the report
- [x] `pnpm typecheck && pnpm lint && pnpm build`, the format check and the tests pass

**Architecture:** Structure follows `frontend/docs/architecture.md` §7: the usage query lives in `cv-create/api/`, the autosave in `cv-create/model/`.
