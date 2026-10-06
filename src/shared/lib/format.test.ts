import { expect, test } from 'vitest'
import { formatList, formatWait } from '@/shared/lib/format'

test.each([
  [1, '1 minute'],
  [60, '1 minute'],
  [61, '2 minutes'],
  [900, '15 minutes'],
  [null, '1 minute'],
])('waits %s s as %s', (seconds, text) => {
  expect(formatWait(seconds)).toBe(text)
})

test.each([
  [[], ''],
  [['company'], 'company'],
  [['company', 'period'], 'company and period'],
  [['title', 'company', 'period'], 'title, company and period'],
])('lists %j as %s', (items, text) => {
  expect(formatList(items)).toBe(text)
})
