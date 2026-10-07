# 02: Mock mode answers `POST /api/cvs/:id/replies`

**What to build:** The MSW handler that applies a batch of replies the way the server does, minus
the answer wording, so the panel can be built and tested without the backend.

**Blocked by:** the shared part of root `.scratch/answer-wording/issues/01-replies-in-one-batch.md` (done, uncommitted)

**Status:** done

**Implements:** `.scratch/answer-wording/issues/01-replies-in-one-batch.md` (the UI part)

**Spec:** [../spec.md](../spec.md) (decision 10) · contract: `docs/api.md` "Questions"

- [x] `src/mocks/handlers/questions.ts`: one `http.post('/api/cvs/:id/replies')`; the old
      `…/answer` and `…/skip` handlers go
- [x] Order of checks, as the API: session (`401`) → body with `repliesBodySchema` (`400` via
      `validationError`) → the session user's CV (`404`) → CV `needs_input` with a draft (`409`) →
      per reply: question of this CV (`404`), `open` (`409`), target still exists (`409`), a skip
      only for `SKIPPABLE_KINDS` (else a `400` field `replies.<index>.answer`), an answer parsed with
      `answerSchemaFor(question)` (wrong `kind` → `409`; anything else → `400` fields
      `replies.<index>.answer.<path>`, first message per field)
- [x] All or nothing: every reply is checked before anything is written; then one pass applies
      each answer with `applyAnswer` from `@cv/shared` (no wording), sets `answered` / `skipped`
      and `question.answer` (`storedAnswer`), one `version + 1` for the batch, `readyWhenAnswered`,
      `updatedAt`; `runWorker` first, as every handler does
- [x] No behaviour in the mock that the UI could mistake for wording (the mock *is* the "as written"
      fallback); `src/mocks` keeps importing only `@cv/shared` and itself
- [x] The handler is exercised by the flow tests of 03 (mock handlers are not unit-tested); mock
      mode in the browser (`pnpm dev:mock`) answers the panel end to end
- [x] `pnpm typecheck && pnpm lint && pnpm format:check` pass

**Architecture:** `frontend/docs/architecture.md` §8 and ADR 0003: handlers mirror the API,
the store keeps the data in browser storage.

## Comments

- 2026-10-07, root session: written on branch `feat/apply-replies` (uncommitted), typecheck and
  lint pass; not yet exercised by tests.
- 2026-10-07, frontend session: done on `feat/apply-replies`, uncommitted: exercised by the rewritten `src/tests/questions.test.tsx` (batch order, 409 for a closed question / gone target, 400 per-reply fields, `version + 1`, `ready`); mock mode checked in the browser via `pnpm screenshots`. `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build` pass (319 tests; the full suite needs `--maxWorkers=4` on a loaded machine, see the report).
