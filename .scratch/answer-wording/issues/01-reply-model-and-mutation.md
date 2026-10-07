# 01: Reply model, error texts and the apply mutation

**What to build:** The pure model of a batch of replies, the texts for what can go wrong, and the
one mutation that sends it: everything the panel and the cards will use, with no UI change yet.

**Blocked by:** the shared part of root `.scratch/answer-wording/issues/01-replies-in-one-batch.md`
(done, uncommitted; `shared` is built — run `pnpm build` in `shared/` after a `pnpm pull`)

**Status:** done

**Implements:** `.scratch/answer-wording/issues/01-replies-in-one-batch.md` (the UI part)

**Spec:** [../spec.md](../spec.md) (decisions 1, 2, 4, 5)

- [x] `apiPaths.cvReplies(cvId)` → `/api/cvs/:id/replies`; `questionAnswer` / `questionSkip` go
- [x] `model/replies.ts`: `Replied` (`Record<questionId, Answer | null>`), `repliesFor(questions, replied)`
      (open questions only, list order), `without(entries, ids)`, `replySummary(answer)`
      ("Skipped", "Yes" / "No", text cut to ~80 chars with "…", picked options joined), `applyLabel(n)`,
      `appliedText(n)`, `notSentText` reworded for a batch ("Not applied: …"), `ReplyOutcome`, and
      `ReplyState` (drafts, replied, `onReply` / `onChange` / `onClear`, `applying`, `error`,
      `refused`, `applied`); `sendingId` and the per-card request go
- [x] `model/questionErrors.ts`: `isQuestionGone` covers `409 INVALID_STATE` and `404`;
      `questionGoneText` = "Some questions changed — check your replies and apply again.";
      `refusedText`; `replyErrorText` says "Not applied. …"; `refusedReplies(error, sent)` maps
      `details.fields` keys `replies.<index>…` to question ids through the sent batch (first message
      per question); `applyErrorText(error, sent)` picks one of the three
- [x] `api/useApplyReplies(cvId)`: parses `{ replies }` with `repliesBodySchema` before sending,
      `POST apiPaths.cvReplies`, `storeCv` on success, `refreshWhenClosed` on error; `useAnswerQuestion`
      and `useSkipQuestion` are deleted
- [x] `FloatingBar` gets `place: 'edge' | 'above-bar'` (84 px above the bottom), a `Record` + `cx()`
      variant like every primitive
- [x] Unit tests next to the files (`model/replies.test.ts`): list order and closed questions left out,
      every `replySummary` case and the cut, counts, `refusedReplies` with a stray index and a non-reply
      field, `applyErrorText` for a 409, a 404, a network error
- [x] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build` pass (the flow
      tests of the old answer flow may fail until 03 — if so, do 01–03 on one branch and run the
      full suite at 03)

**Architecture:** `frontend/docs/architecture.md` §3: pure functions and texts in `model/`,
the mutation in `api/`, the primitive variant in `src/shared/ui`.

## Comments

- 2026-10-07, root session: drafted on branch `feat/apply-replies` (uncommitted): all files above
  exist, `replies.test.ts` is green, typecheck and lint pass. Review against this ticket rather
  than rewrite.
- 2026-10-07, frontend session: done on `feat/apply-replies`, uncommitted: reviewed against this ticket; `replies.test.ts` green. Nothing changed in the model. `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build` pass (319 tests; the full suite needs `--maxWorkers=4` on a loaded machine, see the report).
