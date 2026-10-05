# 01: Tooling and layer boundaries

**What to build:** Prefactoring. The project gets the guard rails every later ticket relies on: imports through an
alias, lint rules that hold the four layers apart, a formatter, and a test runner. Nothing changes
for the user.

**Blocked by:** None (can start immediately)

**Status:** done

**Implements:** `.scratch/frontend-first/issues/03-frontend-foundation-auth.md` (the tooling and design-token part)

**Spec:** [../spec.md](../spec.md)

- [x] `@/` resolves to the source root in TypeScript, Vite and the test runner
- [x] oxlint fails when the `src/shared` layer imports from a layer above it, when `entities` imports `features` or `app`, and when a feature imports another feature; `import/no-cycle` and the `jsx-a11y` rules are on (ADR 0002)
- [x] Prettier with `prettier-plugin-tailwindcss` formats the project; a format check script exists and passes
- [x] Vitest with Testing Library (jsdom) runs through a `test` script; one smoke test renders the app
- [x] The four layer folders exist with the placeholder app moved into `app`
- [x] `frontend/CLAUDE.md` lists the new commands, and the pre-commit check line includes the format check and the tests
- [x] `pnpm typecheck && pnpm lint && pnpm build`, the format check and the tests pass
