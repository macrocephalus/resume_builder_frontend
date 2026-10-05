import type { Question } from '@cv/shared'
import { describe, expect, test } from 'vitest'
import { cvTabs, parseTab, sideTabFor, tabLabel } from '@/features/cv-editor/model/tabs'

const question = (status: Question['status']) => ({ status }) as Question
const withQuestions = { questions: [question('open'), question('answered'), question('open')] }
const without = { questions: [] }

describe('tabs', () => {
  test('Questions is there while the CV has any', () => {
    expect(cvTabs(withQuestions)).toEqual(['edit', 'questions', 'preview'])
    expect(cvTabs(without)).toEqual(['edit', 'preview'])
  })

  test('parseTab reads a tab the CV has and falls back to the editor', () => {
    expect(parseTab('questions', cvTabs(withQuestions))).toBe('questions')
    expect(parseTab('questions', cvTabs(without))).toBe('edit')
    expect(parseTab(null, cvTabs(without))).toBe('edit')
    expect(parseTab('nonsense', cvTabs(without))).toBe('edit')
  })

  test('next to the editor the side panel shows the first side tab', () => {
    expect(sideTabFor('edit', cvTabs(withQuestions))).toBe('questions')
    expect(sideTabFor('edit', cvTabs(without))).toBe('preview')
    expect(sideTabFor('preview', cvTabs(withQuestions))).toBe('preview')
  })

  test('the Questions tab counts the open ones', () => {
    expect(tabLabel('questions', withQuestions)).toBe('Questions · 2')
    expect(tabLabel('questions', { questions: [question('skipped')] })).toBe('Questions')
  })
})
