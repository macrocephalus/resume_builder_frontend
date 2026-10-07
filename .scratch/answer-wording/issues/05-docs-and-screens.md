# 05: Docs, glossary and screenshots

**What to build:** The frontend documents describe the batch flow, and the look of the panel
with replied cards and the bar is checked at both widths.

**Blocked by:** 04

**Status:** done

**Implements:** `.scratch/answer-wording/issues/01-replies-in-one-batch.md` (the UI part)

**Spec:** [../spec.md](../spec.md)

- [x] `docs/architecture.md`: the tree (`api/`: `useApplyReplies` instead of the two hooks;
      `entities/cv/model/storedReplies.ts`; `components/questions/ApplyBar.tsx`), §5 (the replies
      mutation stores the CV, may take seconds, no client timeout), §6 "Save before action" (Apply
      saves first; the replies, their pending state and errors live in `DraftView`; what each card
      holds and its reply outlive the remount), §7 (the `localStorage` row: unsent replies per user and
      CV, pruned to open questions, dropped on apply and delete), §8 (mock mode applies a batch
      with `applyAnswer`, no wording), §9 (the gated handler and the storage spy patterns if worth
      naming), §13 if a decision is recorded
- [x] `docs/design.md`: the `FloatingBar` row names `place: edge · above-bar` (save bar, apply bar);
      the screen layout notes say the apply bar sticks above the save bar's place
- [x] `GLOSSARY.md`: **Apply bar** (the bar at the bottom of the Questions panel that sends every
      replied card in one request; avoid: submit bar, reply footer) and **Replied card** (a question
      card folded to its target, its reply in short and Change, not yet applied; avoid: answered card
      — an answered question is a closed one on the server)
- [x] `.scratch/handoff.md` here: the Questions line and the "Decisions that are easy to miss"
      list mention the batch flow and the stored replies
- [x] `scripts/screenshots.ts`: a `cv-questions-replied` screen (open the CV, `?tab=questions`,
      answer one card, skip one, `viewportOnly`); run `pnpm screenshots`, check 390 px and 1280 px
      against `docs/design.md`, mention them in the report
- [x] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build` pass

## Comments
- 2026-10-07, frontend session: done on `feat/apply-replies`, uncommitted: `docs/architecture.md` (tree, §5, §6, §7 localStorage row, §8, §9), `docs/design.md` (FloatingBar `place`, layout notes, states), `GLOSSARY.md` (Replied card, Apply bar), `.scratch/handoff.md`, `scripts/screenshots.ts` (`cv-questions-replied`) updated; screenshots at 390 and 1280 px checked. `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build` pass (319 tests; the full suite needs `--maxWorkers=4` on a loaded machine, see the report).
