import { expect, test } from 'vitest'
import { matchBarText, matchShortText } from '@/entities/cv/model/matchText'

test('the bar says how many requirements are covered', () => {
  expect(matchBarText({ covered: 7, total: 10 })).toBe('Covers 7 of 10 requirements')
  expect(matchBarText({ covered: 0, total: 1 })).toBe('Covers 0 of 1 requirement')
})

test('the list shows the same numbers as a figure', () => {
  expect(matchShortText({ covered: 7, total: 10 })).toBe('Match 7/10')
})
