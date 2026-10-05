import { expect, test } from 'vitest'
import { cx } from '@/shared/lib/cx'

test('joins class names with a space', () => {
  expect(cx('flex', 'gap-2')).toBe('flex gap-2')
})

test('drops values that are switched off', () => {
  expect(cx('flex', false, null, undefined, '', 'gap-2')).toBe('flex gap-2')
})

test('returns an empty string when nothing is on', () => {
  expect(cx(false, undefined)).toBe('')
})
