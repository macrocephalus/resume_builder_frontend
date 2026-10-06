import type { Question, Requirement } from '@cv/shared'
import { describe, expect, test } from 'vitest'
import { cvTabs, parseTab, sideTabFor, tabLabel } from '@/features/cv-editor/model/tabs'

const question = (status: Question['status']) => ({ status }) as Question
const requirements = [{ label: 'Node.js' } as Requirement]
const questions = [question('open'), question('answered'), question('open')]
const full = { questions, requirements }
const plain = { questions: [], requirements: [] }

describe('tabs', () => {
  test('Questions is there while the CV has any, Match while it has requirements', () => {
    expect(cvTabs(full)).toEqual(['edit', 'questions', 'match', 'preview'])
    expect(cvTabs({ questions, requirements: [] })).toEqual(['edit', 'questions', 'preview'])
    expect(cvTabs({ questions: [], requirements })).toEqual(['edit', 'match', 'preview'])
    expect(cvTabs(plain)).toEqual(['edit', 'preview'])
  })

  test('parseTab reads a tab the CV has and falls back to the editor', () => {
    expect(parseTab('questions', cvTabs(full))).toBe('questions')
    expect(parseTab('match', cvTabs(full))).toBe('match')
    expect(parseTab('questions', cvTabs(plain))).toBe('edit')
    expect(parseTab('match', cvTabs(plain))).toBe('edit')
    expect(parseTab(null, cvTabs(plain))).toBe('edit')
    expect(parseTab('nonsense', cvTabs(plain))).toBe('edit')
  })

  test('next to the editor the side panel shows the questions, else the preview', () => {
    expect(sideTabFor('edit', cvTabs(full))).toBe('questions')
    expect(sideTabFor('edit', cvTabs({ questions: [], requirements }))).toBe('preview')
    expect(sideTabFor('edit', cvTabs(plain))).toBe('preview')
    expect(sideTabFor('match', cvTabs(full))).toBe('match')
  })

  test('the Questions tab counts the open ones', () => {
    expect(tabLabel('questions', full)).toBe('Questions · 2')
    expect(tabLabel('questions', { questions: [question('skipped')] })).toBe('Questions')
    expect(tabLabel('match', full)).toBe('Match')
  })
})
