# 11: Match panel

**What to build:** Second layer. The user sees how many of the role's requirements the CV covers, which ones and
where, and the result updates as they type or answer.

**Blocked by:** 08

**Status:** done

**Implements:** `.scratch/frontend-first/issues/11-match-panel.md`

**Spec:** [../spec.md](../spec.md)

- [x] CV header shows the match bar "Covers N of M requirements" (in `entities/cv`, shared with the list figure)
- [x] Match tab lists covered requirements with where they were found and missing ones; missing `experience` requirements say "Add it in the editor if it's true" — nothing is inserted automatically
- [x] Match is computed in the browser with `computeMatch` from deferred form values: no request, no LLM
- [x] The mock fixture includes requirements
- [x] Tests: typing a missing keyword into a bullet turns its requirement covered
- [x] The look follows `frontend/docs/design.md`; screenshots at 390 px and 1280 px in mock mode are checked against the prototype and mentioned in the report
- [x] `pnpm typecheck && pnpm lint && pnpm build`, the format check and the tests pass

**Architecture:** Structure follows `frontend/docs/architecture.md`: the panel lives in `cv-editor/components/match/`, `MatchBar` in `entities/cv/components/`; the Match panel is a value of the `?tab=` search param.
