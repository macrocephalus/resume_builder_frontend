import type { Usage } from '@cv/shared'
import { describe, expect, test } from 'vitest'
import { blockedText, generationsText } from '@/features/cv-create/model/usage'

const at = '2026-10-06T14:05:00.000Z'
const usage = (generations: number, active: number): Usage => ({
  generations: { used: generations, limit: 10, resetsAt: at },
  active: { used: active, limit: 4 },
})
const time = (iso: string) => `T${iso.slice(11, 16)}`

describe('usage', () => {
  test('says how many generations are used and when the hour resets', () => {
    expect(generationsText(usage(3, 0).generations, time)).toBe(
      '3 of 10 generations used this hour · the next one frees up at T14:05',
    )
    expect(generationsText(usage(0, 0).generations, time)).toBe(
      '0 of 10 generations used this hour',
    )
  })

  test('explains why a new CV cannot start now', () => {
    expect(blockedText(usage(3, 1), time)).toBeNull()
    expect(blockedText(usage(10, 0), time)).toBe(
      'You have used all 10 generations for this hour. The next one frees up at T14:05.',
    )
    expect(blockedText(usage(3, 4), time)).toBe(
      'You already have 4 CVs being generated. Try again when one of them is done.',
    )
  })
})
