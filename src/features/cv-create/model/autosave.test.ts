import { describe, expect, test } from 'vitest'
import { clearSavedForm, loadSavedForm, saveForm } from '@/features/cv-create/model/autosave'

/** A session storage held in memory. */
function memoryStorage(): Storage {
  const items = new Map<string, string>()
  return {
    get length() {
      return items.size
    },
    key: (index) => [...items.keys()][index] ?? null,
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
    removeItem: (key) => void items.delete(key),
    clear: () => items.clear(),
  }
}

/** A storage the browser blocks: every call throws. */
const blockedStorage = new Proxy({} as Storage, {
  get: () => () => {
    throw new DOMException('Blocked', 'SecurityError')
  },
})

const form = {
  targetRole: 'Senior Backend Engineer',
  roleContext: 'Fintech',
  language: 'uk' as const,
  sourceText: 'Six years of Node.js',
  sourceType: 'pdf' as const,
  sourceFilename: 'olena.pdf',
}

describe('New CV autosave', () => {
  test('keeps the form and gives it back', () => {
    const storage = memoryStorage()
    saveForm(form, storage)
    expect(loadSavedForm(storage)).toEqual(form)
  })

  test('has nothing before a save and after a clear', () => {
    const storage = memoryStorage()
    expect(loadSavedForm(storage)).toBeNull()
    saveForm(form, storage)
    clearSavedForm(storage)
    expect(loadSavedForm(storage)).toBeNull()
  })

  test('drops what it cannot trust', () => {
    const storage = memoryStorage()
    storage.setItem('ai-cv-builder:new-cv-form', '{not json')
    expect(loadSavedForm(storage)).toBeNull()
    storage.setItem('ai-cv-builder:new-cv-form', JSON.stringify({ ...form, language: 'xx' }))
    expect(loadSavedForm(storage)).toBeNull()
  })

  test('a blocked storage never throws', () => {
    expect(() => saveForm(form, blockedStorage)).not.toThrow()
    expect(loadSavedForm(blockedStorage)).toBeNull()
    expect(() => clearSavedForm(blockedStorage)).not.toThrow()
  })
})
