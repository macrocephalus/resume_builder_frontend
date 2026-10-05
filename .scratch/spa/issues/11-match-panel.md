# 11: Match panel

**What to build:** Second layer. The user sees how many of the role's requirements the CV covers, which ones and
where, and the result updates as they type or answer.

**Blocked by:** 08

**Status:** ready-for-agent

**Implements:** `.scratch/frontend-first/issues/11-match-panel.md`

**Spec:** [../spec.md](../spec.md)

- [ ] CV header shows the match bar "Covers N of M requirements" (in `entities/cv`, shared with the list figure)
- [ ] Match tab lists covered requirements with where they were found and missing ones; missing `experience` requirements say "Add it in the editor if it's true" — nothing is inserted automatically
- [ ] Match is computed in the browser with `computeMatch` from deferred form values: no request, no LLM
- [ ] The mock fixture includes requirements
- [ ] Tests: typing a missing keyword into a bullet turns its requirement covered
- [ ] The look follows `frontend/docs/design.md`; screenshots at 390 px and 1280 px in mock mode are checked against the prototype and mentioned in the report
- [ ] `pnpm typecheck && pnpm lint && pnpm build`, the format check and the tests pass
