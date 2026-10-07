# 03: Replied cards and the apply bar

**What to build:** Answer and Skip mark a card instead of sending; a replied card folds to one
line with Change; the bar at the bottom of the panel applies every reply in one request after
saving unsaved edits, shows progress, and handles every error without losing a reply.

**Blocked by:** 01, 02

**Status:** done

**Implements:** `.scratch/answer-wording/issues/01-replies-in-one-batch.md` (the UI part)

**Spec:** [../spec.md](../spec.md) (behaviour; decisions 1, 3–7)

**A card** (`components/questions/QuestionCard.tsx`)
- [x] Props: `reply: Answer | null | undefined`, `onReply(answer | null)`, `onChange()`, `locked`,
      `draft` / `onDraftChange`, `error`; no `sending`, no request, no `useTransition`
- [x] Open: as today, but Answer calls `onReply(answerBody)` (disabled while invalid or locked),
      Skip `onReply(null)` (not on `confirm`), "Yes, add it" / "No" `onReply({ kind: 'confirm', value })`
- [x] Replied: one line — `questionTarget`, `replySummary(reply)`, ghost **Change** (disabled while
      locked); the question text stays as an `sr-only` `<h3>` so the `region` keeps its name
- [x] A refused reply (`error`) shows a `Notice tone="bad" role="alert"` on the open card

**The apply bar** (`components/questions/ApplyBar.tsx`, new)
- [x] `FloatingBar place="above-bar" aria-label="Apply replies"`: a `<p aria-live="polite">` that
      holds "Updating your CV…" with a `LoaderCircle` spinner (`motion-safe:animate-spin`,
      `aria-hidden`) while applying; secondary **Clear** (disabled while applying); primary
      **Apply N replies** (`applyLabel`, `pending` while applying, disabled at 0); the error as a
      `role="alert"` line wrapping below (`basis-full`)
- [x] Touch targets ≥ 40 px (the `sm` button is `min-h-10`); text on glass stays `ink`

**The panel** (`components/questions/QuestionsPanel.tsx`)
- [x] Props `cv`, `replies: ReplyState`, `onApply(): Promise<ReplyOutcome>`, `saving`; the count is
      `repliesFor(open, replied).length`; `locked` = saving ∨ saving-first ∨ applying
- [x] Apply runs `onApply` in a `useTransition`; a non-`'sent'` outcome shows `notSentText[outcome]`
      in the bar; Clear also drops that text
- [x] The bar renders after the "Answered (N)" disclosure (last in the section, so it sticks at
      the panel's bottom) when `count > 0` or something runs or an error is shown
- [x] "N replies applied" as `Notice tone="ok"` with an `<output>` at the top while `replies.applied`
      is set; the tab label and the header count keep counting open questions on the server

**Wiring** (`DraftView`, `DraftEditor`, `CvScreen`)
- [x] `DraftEditor`: `onSend` → `onApply()`; `apply()` = `saveFirst()` → `onApply()` → `'sent'`;
      `busy` = `save.isPending || replies.applying`
- [x] `DraftView`: `useApplyReplies`; `kept: { drafts, replied }` in one `useState` above the
      form's key; `sendReplies()` builds the batch with `repliesFor` from the CV **as cached**
      (after the save-first), calls `apply.mutate(batch, { onSuccess, onError })`: on success prune
      drafts and replied to the open questions of the returned CV, set `applied = batch.length`
      and a 4 s timer to clear it; on error prune `replied` to the questions open in the (possibly
      refetched) cache and reopen the refused ones with their messages; `onReply` / `onChange` /
      `onClear` call `apply.reset()` first so an old error goes; `error` = `applyErrorText(apply.error,
      apply.variables)`
- [x] Save (`saveEdits`) and Cancel (`discard`) reset the apply mutation as they reset the old ones

**Tests** (`src/tests/questions.test.tsx`, through the UI with MSW; the old answer-flow tests go)
- [x] Reply to two questions and skip one, apply → exactly one `POST /api/cvs/:id/replies` whose
      body lists the replies in list order; the fields show the answers; the cards are gone;
      "N replies applied"; with every question closed the CV is `ready` and the panel says so;
      `version + 1` in the mock store
- [x] Answer sends nothing (no POST before Apply); the card shows the target and the reply in
      short; Change reopens it with its draft; Clear reopens every card with the drafts kept
- [x] Choice / multi / confirm / skip each fold to the right one line ("C1", "Kafka, NATS, Go",
      "Yes" / "No", "Skipped")
- [x] Unsaved editor edits are saved before the batch (`PATCH` then `POST`); a failed save sends
      nothing and the bar says "Not applied: your edits could not be saved…"; the card stays replied
- [x] A question closed elsewhere (`409`) drops its reply, keeps the others, says "Some questions
      changed…"; Apply again works
- [x] A `400` with `replies.1.answer.value` reopens that card with the message, the rest stay
      replied, the bar says `refusedText`
- [x] A `503` keeps every reply and shows `replyErrorText`
- [x] Keyboard only: focus the input, type, Enter on Answer; Enter on Change; Enter on Apply; with a
      gated handler "Updating your CV…" is on screen inside an `aria-live="polite"` element while the
      request runs, and the cards' Change and the editor's Save are disabled
- [x] Filling a field by hand does not close its question; removing the job a question is about
      removes the question after saving (kept from today)
- [x] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build` pass; 390 px and
      1280 px screenshots of the panel with replied cards and the bar (the `cv-editor` screen of
      `pnpm screenshots` plus a new `cv-questions-replied` entry) are checked and mentioned in the report

**Architecture:** `frontend/docs/architecture.md` §6 "Save before action" and §7: mutations and
what the cards hold live in `DraftView`, above the form's key; the panel is a `?tab=` value.
Look: `frontend/docs/design.md` (FloatingBar is a glass-layer primitive; Notice for the notices).

## Comments

- 2026-10-07, root session: the components and the wiring are written on branch `feat/apply-replies`
  (uncommitted), typecheck and lint pass. `src/tests/questions.test.tsx` is still the old one
  and fails against the new flow: rewrite it per the list above. Not yet looked at in a browser.
- 2026-10-07, frontend session: done on `feat/apply-replies`, uncommitted: `src/tests/questions.test.tsx` rewritten (24 tests: fold per kind, Change / Clear, one POST in list order, save-first and its failure, 409 / 400 / 503, gated handler with "Updating your CV…", keyboard only); `match.test.tsx` now clicks Apply. One mock-shape fix in the test, not the code: after an item is removed the mock skips its question, as the server does. Screenshots `cv-questions-replied-{390,1280}.png` checked. `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build` pass (319 tests; the full suite needs `--maxWorkers=4` on a loaded machine, see the report).
