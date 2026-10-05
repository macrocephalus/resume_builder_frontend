# Own CSS frosted glass, on the glass layer only

The UI gets a "Liquid Glass" look over a light background of pastel shapes, built with our own
CSS (a `glass` utility and `--glass-*` tokens: translucent tint, `backdrop-filter` blur, light
border, shadow) and applied only to the glass layer; content, inputs and the A4 preview stay
solid. Glass needs a solid fallback when `backdrop-filter` is unsupported or reduced
transparency is requested.

## Considered Options

- **Ein UI (ui.eindev.ir)** — a shadcn registry that pulls in Radix, framer-motion and cva, would
  replace our own primitives, hard-codes white text for dark backgrounds and has weak focus
  states. It is plain frosted blur anyway, with no refraction.
- **SVG-refraction libraries** (`liquid-glass-react`, `@samasante/liquid-glass`) — the
  refraction (`backdrop-filter: url(#svg)`) renders only in Chromium; iOS Safari, our main phone
  target, and Firefox show plain blur. The packages are heavy or unmaintained.

## Consequences

- No refraction anywhere: it is frosted glass, the same in every browser.
- Apple's HIG keeps glass out of the content layer; so do we, for form readability and so
  scrolling stays smooth on phones (at most 3–4 glass surfaces on screen).
- Text on glass is `ink` or `accent` only, and the tint is opaque enough to pass WCAG AA without
  the blur.
