import { expect, test } from 'vitest'
import { matchShortText } from '@/entities/cv/model/matchText'

test('the list shows the match as a figure', () => {
  expect(matchShortText({ covered: 7, total: 10 })).toBe('Match 7/10')
})
