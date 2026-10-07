# Spec: reply in place, apply together

Status: done
Package: frontend
Sources: root spec `.scratch/answer-wording/spec.md` (decisions 3, 11, 12, 13), root tickets
`.scratch/answer-wording/issues/01-replies-in-one-batch.md` (its UI and mock lines: the *what*)
and `02-replies-survive-a-reload.md` (moved here), the contract `docs/api.md` "Questions" → `POST /api/cvs/:id/replies`, `docs/cv-statuses.md` §3,
root `docs/architecture.md` §6.5 and §11 (questions panel), root `docs/adr/0002`,
`@cv/shared` (`replySchema`, `repliesBodySchema`, `REPLY_LIMITS`, `applyAnswer`).

## Problem Statement

Today every Answer and Skip on a question card is its own request: the card sends it at once,
the form remounts with the new version, and the user waits after each one. The contract has
changed: the per-question `…/answer` and `…/skip` endpoints are gone, replaced by one
`POST /api/cvs/:id/replies` that applies a batch of 1–12 answers and skips in one transaction
and words free-text answers into CV text on the server (root ADR 0002). The request may take up
to ~15 s. The frontend must reply to several questions without waiting, apply them with one
click, show that the CV is being updated, and never lose a reply: not on the remount that a save
causes, not on a reload, not on a failed request.

## Solution

Answer and Skip only **mark** a card as replied; the card folds to one line with **Change**. A
bar sticky at the bottom of the Questions panel, **Apply N replies** / **Clear**, saves unsaved
editor edits first (save-before-answer, as today), then sends every replied card in one
`POST …/replies`, in the order of the list, and shows "Updating your CV…" (`aria-live="polite"`)
until the CV comes back. The replies live above the form (like the drafts do today) and in
`localStorage` per user and CV, so a remount or a reload keeps them; they are dropped once
applied, when their question is no longer open, and when the CV is deleted. The UI never words
an answer and is never told whether the server did: the response is the CV, as today.

## User Stories

- As a user, I answer or skip several questions one after another without waiting, see each
  reply in short on its card, and can change or undo any of them until I apply.
- As a user, I apply all my replies with one click, see that the CV is being updated, then see
  the answers in the CV; if nothing is left open, the CV is ready.
- As a user, I never lose what I typed or replied: a save, a reload, a failed request or a
  question that closed elsewhere keeps the rest of my replies in place and tells me what
  happened.
- As a user on a phone, the apply bar is reachable above the save bar and every control is
  easy to tap; as a keyboard user, I can reply, change and apply without a mouse.

## Behaviour (the *what*, from the root tickets 01 and 02)

**A card**
- **Answer** sends nothing: when the card's answer is valid (`answerBody` returns a body), it
  marks the card as **replied** with that body. **Skip** (`text` / `choice` / `multi` only)
  marks it as **skipped**. `confirm` keeps "Yes, add it" / "No", which mark it replied with
  `true` / `false`.
- A replied card collapses to one line: the question's target (`questionTarget`), a short
  form of the reply ("Skipped", "Yes", "No", the text cut to ~80 chars, the picked options)
  and **Change**, which opens the card again with its draft as it was.
- Replied cards stay in their place in the list; the count in the tab (**Questions · N**) and
  in the segmented control still counts open questions on the server.

**The apply bar**
- At the bottom of the Questions panel, sticky inside it, shown when at least one card is
  replied: "**Apply N replies**" (N = replied + skipped) and a secondary "Clear", which turns
  every card back to open with its draft kept.
- On a phone (< 980 px) the bar sits above the save bar's place, with
  `env(safe-area-inset-bottom)`; touch targets ≥ 40 px.
- Apply first saves unsaved editor edits (save-before-answer, root architecture §13 row 8). If
  that save fails or conflicts, nothing is sent and the bar says why (`notSentText`).
- Then one `POST /api/cvs/:id/replies` with `{ replies: [{ questionId, answer | null }] }` in
  the order of the list (`null` for a skip), validated with `repliesBodySchema` from
  `@cv/shared` before it is sent.
- While it runs: the bar shows "Updating your CV…" with a spinner, `aria-live="polite"`; the
  cards, the bar and the editor's Save are disabled (one thing at a time, as now). The request
  may take up to ~15 s; no client timeout shorter than 30 s.
- On `200`: the CV from the response goes into the cache (`storeCv`), the form remounts with
  the new version as today, the applied replies are cleared, the bar disappears; a polite
  notice "N replies applied" for a few seconds. If the CV became `ready`, the panel shows its
  "All done" state as today.

**Errors** (the whole batch is applied or nothing is; the replies stay in the cards)
- `409 INVALID_STATE` / `404` (a question already closed, its item removed, the CV moved on):
  refetch the CV (`refreshWhenClosed`), drop the replies of questions that are no longer open,
  keep the rest, and say "Some questions changed — check your replies and apply again".
- `400 VALIDATION_ERROR`: the replies named in `details.fields` (`replies.N.…`) show the
  message on their card and open it; the others stay replied.
- `429`, network error, `500`: the bar shows `replyErrorText(error)` and keeps the replies to
  try again.

**Keeping replies**
- The cards' drafts and their replied / skipped state live above the form (as `drafts` in
  `DraftView` today), so a remount after a save keeps them.
- They are also stored per user and CV in `localStorage` (`cv-replies:<userId>:<cvId>`),
  every read and write in `try/catch`, so a reload restores them; entries whose question is no
  longer open are dropped on load; the key is removed after a successful apply and when the CV
  is deleted.

## Decisions (the *how*)

| # | Decision |
|---|---|
| 1 | **State shape.** `DraftView` keeps one `{ drafts, replied }` object above the form's key: `replied: Record<questionId, Answer \| null>` (`null` = skip; a missing key = open). The batch is derived from it with `repliesFor(questions, replied)`: open questions only, in list order. Nothing is copied into the cards; they get `reply` (an answer, `null`, or `undefined`) and callbacks. |
| 2 | **One mutation.** `useApplyReplies(cvId)` (`cv-editor/api/`) replaces `useAnswerQuestion` and `useSkipQuestion`; `apiPaths.cvReplies(cvId)` replaces `questionAnswer` / `questionSkip`. It parses the body with `repliesBodySchema` before sending, stores the CV with `storeCv` on success, and calls `refreshWhenClosed` on error. No client timeout: the API client sets none. |
| 3 | **Save first, then send, from the editor.** `DraftEditor` keeps `saveFirst()` and exposes `apply()` (save → `onApply()` → `'sent'`, or the `SaveFirstOutcome`). `QuestionsPanel` runs it in a `useTransition` and shows `notSentText[outcome]` in the bar. The batch itself is built in `DraftView` from the CV **as cached after that save** (a save that removed an item closes its questions), not from the `cv` prop of the render before. |
| 4 | **Errors by kind.** `isQuestionGone` covers `409 INVALID_STATE` and any `404`. After such an error the hook-level `onError` has already refetched the CV, so the per-call `onError` prunes `replied` to the questions still open (`onlyOpen`). `refusedReplies(error, sent)` maps `details.fields` keys `replies.<index>…` back to question ids through the sent batch; those cards are reopened and carry the message (`refused` state) until re-replied or cleared; the bar says `refusedText`. Everything else: `replyErrorText(error)` ("Not applied. …"). |
| 5 | **The bar.** `ApplyBar` on the `FloatingBar` primitive with a new `place: 'edge' \| 'above-bar'` (84 px above the bottom, the save bar's height plus its gap, at every width: the save bar spans the whole form, so the two would overlap on wide screens too). Clear is enabled whenever nothing runs, so it also dismisses an error that left no replies. One always-present `<p aria-live="polite">` carries "Updating your CV…" with a `LoaderCircle` spinner (`motion-safe:animate-spin`); the error is a separate `role="alert"` line. |
| 6 | **A replied card** keeps its `region` name: the question text stays as an `sr-only` `<h3>`, so tests and screen readers still find the card by the question. |
| 7 | **"N replies applied"** is a `Notice` with an `<output>` at the top of the panel, cleared by a 4 s timer set in the success handler (no effect, no cleanup: a state update after unmount is a no-op). |
| 8 | **Storage** lives in `entities/cv/model/storedReplies.ts`, not in the feature: `useDeleteCv` (used by the list and the CV screen) must forget the replies of a deleted CV, and entities cannot import features. `forgetStoredReplies(cvId)` needs no user: it scans the keys for the `:<cvId>` suffix. Stored JSON is parsed back with a Zod schema (`answerSchema.nullable()` for replies); every call is guarded. `saveStoredReplies` removes the key when both maps are empty. The write is a `useEffect` on `[key, kept]`: syncing with an external store, not derived state. |
| 9 | **Who is the user.** The feature cannot import `features/auth`, so the route module `app/routes/cv.tsx` reads `authQueries.me()` (narrow `select` to the id) and passes `userId` to `CvScreen` → `DraftView`; with no user (a redirect to login in flight) it renders nothing, so no key is ever written under an empty user. |
| 10 | **Mock mode** applies each reply with `applyAnswer` from `@cv/shared` in one step (no wording: the mock is the server's "as written" fallback) and mirrors the server's checks: body with `repliesBodySchema` (`400`), CV not `needs_input` / question closed / target gone / wrong kind (`409`), unknown CV or question (`404`), invalid answer or a skip of a `confirm` (`400` with `replies.<index>.answer…` fields); checks first, then one pass of writes, one `version + 1`, `ready` when nothing is open. The old two handlers go. |
| 11 | **Tests** stay at the network boundary (`src/tests/questions.test.tsx` through the UI with MSW): the request body is read from the `request:start` event; a slow handler (`server.use` with a gate promise that falls through) catches "Updating your CV…"; a blocked storage is a `Storage.prototype` spy that throws only for `cv-replies:` keys, so the mock DB keeps working. `vitest.setup.ts` clears `localStorage` after each test. |

## Where the work stands (2026-10-07, evening)

Every ticket is implemented on `feat/apply-replies`, uncommitted; the tests, docs and screenshots
listed as missing below are done (see each ticket's last comment). Left: commit, merge, bump the
submodule pointer at the root.

### Earlier the same day

The root session drafted most of the code on the frontend branch **`feat/apply-replies`**
(from `main` at `704cdd6`), **uncommitted**. `pnpm typecheck` and `pnpm lint` pass; the flow
tests, the docs and the screenshots are not done. Open the frontend session on that branch
(`git switch feat/apply-replies`), not from a fresh `main`. Per ticket, what exists:

| Ticket | Written | Missing |
|---|---|---|
| 01 | `apiPaths.cvReplies`, `FloatingBar` `place`, `model/replies.ts`, `model/questionErrors.ts`, `model/replies.test.ts`, `api/useApplyReplies.ts`; old hooks deleted | review; `replies.test.ts` is green |
| 02 | `mocks/handlers/questions.ts` rewritten | review |
| 03 | `QuestionCard`, `ApplyBar`, `QuestionsPanel`, `DraftView`, `DraftEditor`, `CvScreen` | `src/tests/questions.test.tsx` still tests the old flow and fails: rewrite it |
| 04 | `entities/cv/model/storedReplies.ts`, `useDeleteCv` cleanup, `app/routes/cv.tsx` `userId`, `vitest.setup.ts` | unit tests for `storedReplies`, the flow tests (reload, blocked storage, delete) |
| 05 | — | `docs/architecture.md`, `docs/design.md` (FloatingBar row), `GLOSSARY.md`, screenshots |

The shared part of root ticket 01 (`replySchema`, `repliesBodySchema`, `REPLY_LIMITS` in
`shared/src/question.ts`) is done, built into `shared/dist`, uncommitted in the root working
tree. Its backend part is being done in another session on `backend` branch
`feat/reply-batches`; the mocks are enough to build and test everything here. Frontend tickets
01, 02, 03 and 05 implement the UI part of root 01; frontend 04 implements root 02.

## Out of Scope

- Any wording of answers in the browser, or a flag telling whether the server worded one.
- A client-side timeout for the replies request (the API client has none; the bar says it may
  take a while).
- Focus management after the form remounts (today's behaviour).
- Replies of another user or another CV in the same browser: they are keyed apart and never
  shown; nothing migrates them.

## Issues

- [01 — reply model, error texts and the apply mutation](issues/01-reply-model-and-mutation.md)
- [02 — mock mode: `POST /api/cvs/:id/replies`](issues/02-mock-replies-endpoint.md)
- [03 — replied cards and the apply bar](issues/03-cards-and-apply-bar.md)
- [04 — keep replies across a remount, a reload and a delete](issues/04-keep-replies-in-browser.md)
- [05 — docs, glossary and screenshots](issues/05-docs-and-screens.md)
