# 04: Keep replies across a remount, a reload and a delete

**What to build:** Replies not applied yet survive a page reload, per user and CV, and go away
once applied, once their question is no longer open, and when the CV is deleted — also from the
list.

**Blocked by:** 03

**Status:** done

**Implements:** `.scratch/answer-wording/issues/02-replies-survive-a-reload.md`

**Spec:** [../spec.md](../spec.md) (decisions 8, 9, 11)

- [x] `src/entities/cv/model/storedReplies.ts`: `storedRepliesKey(userId, cvId)` =
      `cv-replies:<userId>:<cvId>`; a Zod schema for `{ drafts, replied }` (`replied` values
      `answerSchema.nullable()`); `onlyOpen(entries, questions)`; `loadStoredReplies(key, questions)`
      (parsed back, pruned to open questions, `noStoredReplies()` on anything wrong);
      `saveStoredReplies(key, replies)` (removes the key when both maps are empty);
      `forgetStoredReplies(cvId)` (scans keys for the `:<cvId>` suffix, any user); every storage
      call in `try/catch`, `localStorage` reached through a guarded getter
- [x] `useDeleteCv`: `forgetStoredReplies(id)` after `onDeleted`, before the cache drops the CV —
      so Delete from My CVs and from the CV screen both forget
- [x] `app/routes/cv.tsx` reads `authQueries.me()` with `select` to the id and passes `userId` to
      `CvScreen` → `DraftView`; renders nothing without a user (redirect to login in flight)
- [x] `DraftView`: `kept` is initialised from `loadStoredReplies(key, cv.questions)` (lazy
      `useState`), written back in a `useEffect` on `[key, kept]`; after a successful apply the pruned
      maps are empty for the applied questions, so the key goes when nothing is left
- [x] `vitest.setup.ts` clears `localStorage` after each test, next to `sessionStorage`
- [x] Unit tests next to `storedReplies.ts`: round trip, pruning on load, a broken JSON, a storage
      that throws on read and on write, `forgetStoredReplies` leaves other CVs' keys alone
- [x] Flow tests (`src/tests/questions.test.tsx`): a reload (`renderApp` again) restores the
      replied cards, the count and the draft behind Change; a blocked storage (a `Storage.prototype`
      spy that throws for `cv-replies:` keys only) still lets the user reply and apply; the key is
      gone after an apply and after Delete → "Delete for good"
- [x] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build` pass

**Architecture:** `frontend/docs/architecture.md` §7 (where state lives) gets a `localStorage`
row next to the `sessionStorage` one; the module sits in `entities/cv` because two features
delete a CV (ADR 0002 layers: entities never import features).

## Comments

- 2026-10-07, root session: `storedReplies.ts`, the `useDeleteCv` cleanup, the route and the
  `DraftView` load / save effect are written on branch `feat/apply-replies` (uncommitted);
  no tests for them yet.
- 2026-10-07, frontend session: done on `feat/apply-replies`, uncommitted: `storedReplies.test.ts` (round trip, pruning, broken JSON, blocked storage, forget per CV) and the flow tests (reload restores cards / count / draft, closed question not restored, key gone after apply and after Delete, blocked storage still applies) added, all green. `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build` pass (319 tests; the full suite needs `--maxWorkers=4` on a loaded machine, see the report).
