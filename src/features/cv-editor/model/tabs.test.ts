import { expect, test } from 'vitest'
import { parseTab, sideTabFor } from '@/features/cv-editor/model/tabs'

test('parseTab reads a known tab and falls back to the editor', () => {
  expect(parseTab('preview')).toBe('preview')
  expect(parseTab(null)).toBe('edit')
  expect(parseTab('nonsense')).toBe('edit')
})

test('next to the editor the side panel shows the preview', () => {
  expect(sideTabFor('edit')).toBe('preview')
  expect(sideTabFor('preview')).toBe('preview')
})
