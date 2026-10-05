# 13: Usage limits and autosave of the New CV form

**What to build:** Second layer. The New CV form shows how many generations are left this hour, and an unsent form
survives a reload.

**Blocked by:** 05

**Status:** ready-for-agent

**Implements:** `.scratch/frontend-first/issues/13-usage-and-form-autosave.md`

**Spec:** [../spec.md](../spec.md)

- [ ] The form shows generations used / limit and when the window resets; submit is disabled with an explanation when the limit is reached or two CVs are in progress
- [ ] Mock mode serves the usage endpoint from its own counters
- [ ] The unsent form is kept in session storage and restored after a reload; it is cleared after a successful submit; a blocked or failing storage never breaks the form
- [ ] Tests: limit reached disables submit; form restored after reload
- [ ] The look follows `frontend/docs/design.md`; screenshots at 390 px and 1280 px in mock mode are checked against the prototype and mentioned in the report
- [ ] `pnpm typecheck && pnpm lint && pnpm build`, the format check and the tests pass
