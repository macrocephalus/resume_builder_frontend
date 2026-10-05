/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'

// Vitest replaces CSS imports with an empty module, so the tokens are read from the file.
const css = readFileSync('src/index.css', 'utf8')

type Rgb = [number, number, number]

const AA = 4.5

function token(name: string): string {
  const match = new RegExp(`--color-${name}:\\s*([^;]+);`).exec(css)
  if (!match) throw new Error(`Token --color-${name} is not defined in index.css`)
  return match[1].trim()
}

function hex(value: string): Rgb {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value)
  if (!match) throw new Error(`Expected a #rrggbb colour, got "${value}"`)
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)]
}

function rgba(value: string): { colour: Rgb; alpha: number } {
  const match = /^rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)$/.exec(value)
  if (!match) throw new Error(`Expected "rgb(r g b / a)", got "${value}"`)
  return {
    colour: [Number(match[1]), Number(match[2]), Number(match[3])],
    alpha: Number(match[4]),
  }
}

function over(top: { colour: Rgb; alpha: number }, bottom: Rgb): Rgb {
  return [0, 1, 2].map((i) => top.colour[i] * top.alpha + bottom[i] * (1 - top.alpha)) as Rgb
}

// The `saturate()` filter matrix from the CSS Filter Effects spec.
function saturate([r, g, b]: Rgb, s: number): Rgb {
  const clamp = (channel: number) => Math.min(255, Math.max(0, channel))
  return [
    clamp((0.213 + 0.787 * s) * r + (0.715 - 0.715 * s) * g + (0.072 - 0.072 * s) * b),
    clamp((0.213 - 0.213 * s) * r + (0.715 + 0.285 * s) * g + (0.072 - 0.072 * s) * b),
    clamp((0.213 - 0.213 * s) * r + (0.715 - 0.715 * s) * g + (0.072 + 0.928 * s) * b),
  ]
}

function luminance(colour: Rgb): number {
  const [r, g, b] = colour.map((channel) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: Rgb, b: Rgb): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

// Blur only mixes neighbouring colours, so the extremes are the page background and each shape
// at full strength. With `backdrop-filter` the shape is also saturated before the tint goes on.
const underGlass = ['bg', 'blob-1', 'blob-2', 'blob-3', 'blob-4', 'blob-5']

describe('text on glass passes WCAG AA', () => {
  const tint = rgba(token('glass-tint'))

  // `bad` is the field error text inside the glass auth card.
  describe.each(['ink', 'accent', 'bad'])('%s', (text) => {
    test.each(underGlass)('over %s without the blur', (shape) => {
      const glass = over(tint, hex(token(shape)))

      expect(contrast(hex(token(text)), glass)).toBeGreaterThanOrEqual(AA)
    })

    test.each(underGlass)('over %s with the blur filter', (shape) => {
      const glass = over(tint, saturate(hex(token(shape)), 1.5))

      expect(contrast(hex(token(text)), glass)).toBeGreaterThanOrEqual(AA)
    })
  })
})

test.each(['blob-1', 'blob-2', 'blob-3', 'blob-4', 'blob-5'])(
  'accent stays readable straight over %s',
  (shape) => {
    expect(contrast(hex(token('accent')), hex(token(shape)))).toBeGreaterThanOrEqual(AA)
  },
)
