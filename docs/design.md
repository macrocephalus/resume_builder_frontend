# Design

How the SPA looks and how its styles and components are built. Short rules live in
`frontend/CLAUDE.md`; this file is the reference for UI tickets. Terms: `frontend/GLOSSARY.md`
(**Tone**, **Glass layer**). Decisions: `docs/adr/0001` (glass), `docs/adr/0002` (layers).

The prototype (`docs/discovery_requirements _elicitation/antropick/artifacts/Прототип AI CV
Builder/index.html` at the repo root) is the reference for tokens, fonts, radii, the 980 px layout
and the set of states. Spacing and small details may differ. It is a picture to look at, not a
spec.

## Look

- **Light theme only.** No dark mode.
- **Backdrop:** a light background with 3–5 large, blurred pastel shapes in one `position: fixed`
  layer under the whole app. Plain CSS (`radial-gradient` / round blurred divs), no images or
  canvas.
  - The shapes are still everywhere except the generation screen, where they drift slowly
    (28 s and 36 s per cycle), only under `motion-safe:`.
  - The screen asks for the drift through its route `handle` (`{ backdrop: 'drift' }`), read by
    the backdrop with `useMatches()`. No global state.
  - In the editor, solid panels cover most of the backdrop. That is expected.
- **Glass:** frosted glass (no refraction) **only on the glass layer**. That is the top bar, the
  tab switcher, the save bar and the auth card.
  - Content, panels, inputs and the A4 preview sheet stay solid.
  - At most 3–4 glass surfaces on screen at once.
  - Glass is never animated (no animated blur).
- **Text on glass** is `ink` or `accent` only, never `muted`.
  - It must pass WCAG AA (4.5:1) over the lightest and the darkest shape.
  - If it fails, raise the glass opacity. Don't change the text colour.

## Tokens

Defined once in `src/index.css` with Tailwind v4 `@theme`.

- The default Tailwind palette is switched off (`--color-*: initial`), so `bg-blue-500` doesn't
  compile.
- Arbitrary colour values (`text-[#123]`, `bg-[rgb(...)]`) are not allowed.

| Group | Tokens (prototype values) |
|---|---|
| Surfaces | `bg` #F4F6FA · `surface` #FFFFFF |
| Text | `ink` #131926 · `muted` #586174 · `on-accent` #FFFFFF |
| Lines | `line` #D6DCE8 · `line-strong` #AEB8CB |
| Tones | `accent` #1F4FD1 / `accent-soft` #E6ECFB · `wait` #955800 / `wait-soft` #FBF0DC · `ok` #1B7A4B / `ok-soft` #E2F3EA · `bad` #B4372B / `bad-soft` #FBE7E4 |
| Paper (preview sheet) | `paper` #FFFFFF · `paper-ink` #16181D · `paper-muted` #5A6070 · `paper-line` #D5D8DF |
| Backdrop | `blob-1` #DCD6FF (lavender) · `blob-2` #C9F2DE (mint) · `blob-3` #FFD9C2 (peach) · `blob-4` #C4E2FF (sky) · `blob-5` #FFD3E6 (pink); drawn at 70 % opacity under a 64 px blur |
| Glass | `glass-tint` (white, 76 % opaque, so text passes AA even without blur) · `glass-border` (white, 70 %, a light 1 px highlight) · `--glass-shadow` · `--glass-blur` (14 px) |

- Colours are `--color-<token>` variables, so every token is a utility (`bg-surface`, `text-ink`,
  `border-line`, `bg-blob-1`). `--glass-blur` and `--glass-shadow` are plain variables read by the
  `glass` utility.
- The backdrop values were picked with `pnpm screenshots`. `src/index.test.ts` reads the tokens
  from `src/index.css` and fails when `ink` or `accent` on glass drops below AA over the
  background or any shape, with and without the blur filter, or when `accent` drops below AA
  straight over a shape. Change a backdrop or glass value and that test tells whether it holds.

- **Fonts:**
  - Unbounded 500/600 for headings, Golos Text 400/500/600 for body, JetBrains Mono 400/500
    for pills and counters.
  - All via `@fontsource`, imported per weight. Each face has a `unicode-range`, so the browser
    fetches only the subsets a page uses (latin and cyrillic for our texts).
  - The preview sheet uses **Liberation Sans** (woff2 in `public/fonts`), the PDF's font, so
    line breaks match the download.
  - Utilities: `font-display`, `font-sans` (the default), `font-mono`, `font-paper`. `h1` and
    `h2` get the display font and their sizes from the base layer, so a screen writes a plain
    heading.
- **Radii:** 6 / 8 / 999 px (`rounded-sm` / `rounded-md` / `rounded-full`). **Borders:** flat
  1 px. **Focus:** 2 px `accent` outline on `:focus-visible`, set once in the base layer.
- **Page width:** `max-w-page` (1120 px).
- **Breakpoints:** `md` = 760 px (list rows stop stacking), `lg` = 980 px (editor splits into
  two columns). These replace the Tailwind defaults.

## `glass` utility

`@utility glass` in `src/index.css`:

- `glass-tint` background, `backdrop-filter: blur(var(--glass-blur)) saturate(1.5)` (with the
  `-webkit-` prefix), the `glass-border` colour and `--glass-shadow`.
- It sets the border colour, not the sides: the element adds `border` or `border-b`.
- Fallback to a solid `surface` background under
  `@supports not (backdrop-filter: blur(1px))` and under
  `@media (prefers-reduced-transparency: reduce)`. The media query only works in Chromium;
  Safari/iOS ignore it, which is why the tint is opaque enough on its own.

The utility is used only in `src/shared/ui/` (glass primitives) and `src/app/layout/` (top bar,
backdrop). Feature code never applies it directly.

## Writing styles

- Tailwind utilities, co-located in JSX. No CSS-in-JS, no CSS modules, no `@apply` component
  classes.
- **Variants** are a `Record<Variant, string>` of class strings. Conditional classes go through
  the small `cx()` helper in `src/shared/lib/cx.ts`. No `cva`, no `tailwind-merge`, no string
  concatenation.
- **No inline `style={{…}}`**, except to pass a dynamic value as a CSS variable
  (`style={{ '--progress': '40%' }}`).
- **Look belongs to primitives.** In `features/*` and `entities/*`, use only layout utilities:
  flex/grid, gap, margin/padding, width/height, position, breakpoints. Colour, border, radius,
  shadow and typography come from primitives. If a feature needs a new look, add a variant to a
  primitive.
- **Motion:** CSS only (`transition`, `@keyframes`), always behind `motion-safe:`. No
  framer-motion / motion.
- **a11y:**
  - Use `focus-visible:`, not `focus:`.
  - Touch targets ≥ 40 px; inputs at 16 px font (no iOS zoom).
  - Every icon-only button has an `aria-label`.
  - `jsx-a11y` lint rules are on.
- Class order is set by Prettier with `prettier-plugin-tailwindcss`. Don't sort by hand.

## Primitives (`src/shared/ui`)

No UI kit. Our own components on native elements:

- One component per file, `PascalCase.tsx`, named export, no barrels.
- They take the native element's props (`ComponentProps<'button'>`, …) and `ref` as a plain prop
  (React 19, no `forwardRef`).
- `className` is accepted for layout only.
- `Input`, `Textarea` and `Select` work with RHF `register()`.

Each primitive is built **when a ticket first needs it**. Use these names and variants; don't add
a `Badge` or `Tag` next to `Pill`.

| Primitive | Variants / props | Glass |
|---|---|---|
| `Button` | `primary` · `ghost` · `danger`; `size: md · sm`; `block`; pending state | — |
| `Field` | label + hint + error around one control; wires `id` / `aria-describedby` / `aria-invalid` | — |
| `Input`, `Textarea`, `Select` | `Select` is native `<select>` | — |
| `Pill` | `tone` | — |
| `Chip` | removable (skills) | — |
| `Panel` | solid content card | — |
| `Notice` | `tone`; optional action | — |
| `ProgressBar` | indeterminate or `value`; `tone` | — |
| `EmptyState`, `ErrorState` | `ErrorState` has Retry | — |
| `ConfirmButton` | two-step inline confirm (delete) | — |
| `SegmentedControl` | tabs: Edit · Questions N · Match · Preview | **yes** |
| `FloatingBar` | sticky bottom bar with `env(safe-area-inset-bottom)` (save bar shell) | **yes** |
| `GlassCard` | auth card | **yes** |

`src/app/layout/` holds the **TopBar** (glass, sticky, with the navigation progress line) and the
**Backdrop**.

**Tone** (`neutral · accent · wait · ok · bad`) is the only colour prop a primitive takes.

- Status → tone lives in `entities/cv` with the label and the allowed actions: queued → neutral,
  generating → accent, retrying and needs_input → wait, failed → bad, ready → ok.
- Never pick a tone from anything but the status string.

**Icons:** named imports from `lucide-react` (tree-shaken), never re-exported through a barrel of
our own; sizes 16 / 20; decorative icons get `aria-hidden`.

## Screen layout

- **≥ 980 px:** two columns. Editor on the left (`1.08fr`); side panel on the right (`.92fr`)
  with the Questions / Match / Preview tabs.
- **< 980 px:** one column.
  - The `SegmentedControl` (Edit · Questions N · Match · Preview) sticks to the top under the top
    bar, and one panel shows at a time.
  - The save bar sticks to the bottom.
  - Three glass surfaces in total: top bar, tabs, save bar.
- List rows stack below 760 px.

## States

- **Navigating:** route loaders keep the old screen until data is ready, and a thin progress line
  runs in the top bar (`navigation.state === 'loading'`).
- **Cold start:** a skeleton is the Suspense fallback on the first open of a screen. No
  full-screen spinners.
- **Errors:** the route's `ErrorBoundary` shows `ErrorState` with Retry. A failed mutation shows
  its error next to the control that triggered it.
- **Empty:** `EmptyState` says what to do next.
- **No toasts:**
  - "Saved ✓" appears in the save bar.
  - A version conflict is a `Notice` in the CV header with "Reload latest".
- **Generation in progress:**
  - A solid `Panel` with the stage text and an indeterminate bar, over the drifting backdrop.
  - Uses `aria-live="polite"`.

## Checking the look

Tests don't tell whether a screen looks right. `pnpm screenshots` (`scripts/screenshots.ts`,
Playwright with Chromium) starts the dev server and captures every screen listed in the script at
**390 px and 1280 px** into `.scratch/screens/` (gitignored). It fails when the page requests
anything from another origin. From ticket 03 it runs in mock mode. Chromium is downloaded once
with `pnpm exec playwright install chromium`.

At the end of each UI ticket, add the new screens to the list, look at both widths, compare with
the prototype, and mention the result in the report.
