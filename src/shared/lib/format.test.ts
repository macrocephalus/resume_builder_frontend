import { expect, test } from 'vitest'
import { formatWait } from '@/shared/lib/format'

test.each([
  [1, '1 minute'],
  [60, '1 minute'],
  [61, '2 minutes'],
  [900, '15 minutes'],
  [null, '1 minute'],
])('waits %s s as %s', (seconds, text) => {
  expect(formatWait(seconds)).toBe(text)
})
