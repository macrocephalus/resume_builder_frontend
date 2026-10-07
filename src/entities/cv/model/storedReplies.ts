import { answerSchema, type Question } from '@cv/shared'
import { z } from 'zod'

// Replies the user has not applied yet, kept per user and CV so a reload loses nothing. Stored
// text is untrusted: it is parsed back. The browser may block storage (private mode, a policy) or
// have it full: every call is guarded, and replies that cannot be kept are simply not kept.

const PREFIX = 'cv-replies:'

export const storedRepliesKey = (userId: string, cvId: string) => `${PREFIX}${userId}:${cvId}`

const draftSchema = z.object({
  text: z.string().optional(),
  picked: z.array(z.string()).optional(),
  other: z.string().optional(),
})

const storedRepliesSchema = z.object({
  /** What each card holds, by question id. */
  drafts: z.record(z.string(), draftSchema),
  /** The replied cards, by question id: an answer, or `null` for a skip. */
  replied: z.record(z.string(), answerSchema.nullable()),
})

export type StoredReplies = z.infer<typeof storedRepliesSchema>

export const noStoredReplies = (): StoredReplies => ({ drafts: {}, replied: {} })

const localStore = (): Storage | null => {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/** The entries whose question is still open. */
export function onlyOpen<T>(
  entries: Record<string, T>,
  questions: readonly Pick<Question, 'id' | 'status'>[],
): Record<string, T> {
  const open = new Set(questions.filter((q) => q.status === 'open').map((q) => q.id))
  return Object.fromEntries(Object.entries(entries).filter(([id]) => open.has(id)))
}

/** The replies kept for this user and CV, without those of questions no longer open. */
export function loadStoredReplies(
  key: string,
  questions: readonly Pick<Question, 'id' | 'status'>[],
  storage = localStore(),
): StoredReplies {
  try {
    const raw = storage?.getItem(key)
    if (!raw) return noStoredReplies()
    const parsed = storedRepliesSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) return noStoredReplies()
    return {
      drafts: onlyOpen(parsed.data.drafts, questions),
      replied: onlyOpen(parsed.data.replied, questions),
    }
  } catch {
    return noStoredReplies()
  }
}

/** Keeps the replies; with nothing left to keep, the entry goes. */
export function saveStoredReplies(
  key: string,
  replies: StoredReplies,
  storage = localStore(),
): void {
  try {
    const empty =
      Object.keys(replies.drafts).length === 0 && Object.keys(replies.replied).length === 0
    if (empty) storage?.removeItem(key)
    else storage?.setItem(key, JSON.stringify(replies))
  } catch {
    // Not kept: the panel still works.
  }
}

/** Removes every kept entry whose key passes `pick`. */
function forgetWhere(pick: (key: string) => boolean, storage: Storage | null): void {
  try {
    if (!storage) return
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index)
      if (key?.startsWith(PREFIX) && pick(key)) storage.removeItem(key)
    }
  } catch {
    // Nothing to forget that could be read back.
  }
}

/** The CV is gone: its replies go too, whoever kept them. */
export function forgetStoredReplies(cvId: string, storage = localStore()): void {
  forgetWhere((key) => key.endsWith(`:${cvId}`), storage)
}

/**
 * Log out: the replies of every user and CV go, so what was typed (a phone number) does not stay
 * on a shared device.
 */
export function forgetAllStoredReplies(storage = localStore()): void {
  forgetWhere(() => true, storage)
}
