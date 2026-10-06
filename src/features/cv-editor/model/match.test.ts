import { describe, expect, test } from 'vitest'
import { foundInText, missingHint } from '@/features/cv-editor/model/match'

describe('match texts', () => {
  test('say where a covered requirement was found, in block names', () => {
    expect(foundInText(['summary'])).toBe('Found in summary')
    expect(foundInText(['experience', 'projects', 'skills'])).toBe(
      'Found in experience, projects and skills',
    )
  })

  test('ask to add a missing requirement only if it is true', () => {
    expect(missingHint('experience')).toBe('Add it in the editor if it’s true.')
    expect(missingHint('skill')).toBe('Add it to your skills if you have it.')
  })
})
