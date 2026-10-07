import { describe, expect, test } from 'vitest'
import {
  forgetStoredReplies,
  loadStoredReplies,
  onlyOpen,
  saveStoredReplies,
  storedRepliesKey,
  type StoredReplies,
} from '@/entities/cv/model/storedReplies'

const questions = [
  { id: 'phone', status: 'open' as const },
  { id: 'english', status: 'open' as const },
  { id: 'skills', status: 'answered' as const },
]

const replies: StoredReplies = {
  drafts: {
    phone: { text: '+380 67' },
    english: { picked: ['C1'] },
    skills: { picked: ['Kafka'] },
  },
  replied: { phone: { kind: 'text', value: '+380 67' }, english: null, skills: null },
}

/** An in-memory `Storage`, so a test owns what it holds. */
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

/** A storage that throws on every call, as a blocked one does. */
const blockedStorage = (): Storage =>
  new Proxy({} as Storage, {
    get: () => () => {
      throw new DOMException('Blocked', 'SecurityError')
    },
  })

describe('storedRepliesKey', () => {
  test('is per user and CV', () => {
    expect(storedRepliesKey('u1', 'cv1')).toBe('cv-replies:u1:cv1')
  })
})

describe('onlyOpen', () => {
  test('keeps the entries of open questions', () => {
    expect(onlyOpen(replies.replied, questions)).toEqual({
      phone: { kind: 'text', value: '+380 67' },
      english: null,
    })
  })
})

describe('load and save', () => {
  test('round-trips, pruned to the open questions', () => {
    const storage = memoryStorage()
    const key = storedRepliesKey('u1', 'cv1')

    saveStoredReplies(key, replies, storage)

    expect(loadStoredReplies(key, questions, storage)).toEqual({
      drafts: { phone: { text: '+380 67' }, english: { picked: ['C1'] } },
      replied: { phone: { kind: 'text', value: '+380 67' }, english: null },
    })
  })

  test('nothing kept, broken JSON and a wrong shape all load as no replies', () => {
    const storage = memoryStorage()
    const key = storedRepliesKey('u1', 'cv1')
    const none = { drafts: {}, replied: {} }

    expect(loadStoredReplies(key, questions, storage)).toEqual(none)
    storage.setItem(key, '{not json')
    expect(loadStoredReplies(key, questions, storage)).toEqual(none)
    storage.setItem(key, JSON.stringify({ drafts: {}, replied: { phone: { kind: 'text' } } }))
    expect(loadStoredReplies(key, questions, storage)).toEqual(none)
  })

  test('saving empty maps removes the entry', () => {
    const storage = memoryStorage()
    const key = storedRepliesKey('u1', 'cv1')
    saveStoredReplies(key, replies, storage)

    saveStoredReplies(key, { drafts: {}, replied: {} }, storage)

    expect(storage.getItem(key)).toBeNull()
  })

  test('a storage that throws on read or write is tolerated', () => {
    const key = storedRepliesKey('u1', 'cv1')

    expect(() => saveStoredReplies(key, replies, blockedStorage())).not.toThrow()
    expect(loadStoredReplies(key, questions, blockedStorage())).toEqual({ drafts: {}, replied: {} })
    expect(() => forgetStoredReplies('cv1', blockedStorage())).not.toThrow()
    expect(loadStoredReplies(key, questions, null)).toEqual({ drafts: {}, replied: {} })
  })
})

describe('forgetStoredReplies', () => {
  test('drops the replies of that CV for every user and leaves other CVs alone', () => {
    const storage = memoryStorage()
    saveStoredReplies(storedRepliesKey('u1', 'cv1'), replies, storage)
    saveStoredReplies(storedRepliesKey('u2', 'cv1'), replies, storage)
    saveStoredReplies(storedRepliesKey('u1', 'cv2'), replies, storage)
    storage.setItem('other:cv1', 'kept')

    forgetStoredReplies('cv1', storage)

    expect(storage.getItem(storedRepliesKey('u1', 'cv1'))).toBeNull()
    expect(storage.getItem(storedRepliesKey('u2', 'cv1'))).toBeNull()
    expect(storage.getItem(storedRepliesKey('u1', 'cv2'))).not.toBeNull()
    expect(storage.getItem('other:cv1')).toBe('kept')
  })
})
