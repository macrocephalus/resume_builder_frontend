# 02: Design foundation: tokens, backdrop, glass, app shell

**What to build:** A visitor opening the app sees its look for the first time: a light pastel backdrop, the app's
fonts and a frosted-glass top bar that stays visible while scrolling. The developer gets a command
that captures screens at phone and desktop width.

**Blocked by:** 01

**Status:** done

**Implements:** `.scratch/frontend-first/issues/03-frontend-foundation-auth.md` (the tooling and design-token part)

**Spec:** [../spec.md](../spec.md)

- [x] Semantic tokens from `frontend/docs/design.md` are defined in `@theme` (surfaces, text, lines, tones with soft variants, paper, backdrop, glass); the default Tailwind palette is off, so a palette class such as `bg-blue-500` produces no style; breakpoints are `md` 760 px and `lg` 980 px
- [x] Fonts are self-hosted: Unbounded, Golos Text, JetBrains Mono (latin + cyrillic) and Liberation Sans for the preview sheet; no request leaves the origin
- [x] Backdrop: 3–5 blurred pastel shapes in one fixed layer, plain CSS; it is still by default and drifts only when the current route asks for it, and never under reduced motion
- [x] `glass` utility: tint, blur, light border, shadow; it falls back to a solid surface when `backdrop-filter` is unsupported and under reduced transparency (ADR 0001)
- [x] Sticky glass top bar with the product name; text on it is `ink` or `accent` and passes WCAG AA over the lightest and the darkest backdrop shape, with and without blur
- [x] `cx()` helper exists; focus ring is 2 px accent on `focus-visible`
- [x] `pnpm screenshots` (Playwright, Chromium) starts the app and saves each listed screen at 390 px and 1280 px into a gitignored folder
- [x] Backdrop colour values are chosen with those screenshots and written into `design.md`
- [x] `pnpm typecheck && pnpm lint && pnpm build`, the format check and the tests pass
