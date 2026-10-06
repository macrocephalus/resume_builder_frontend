// The mock backend's data, kept in localStorage so a reload loses nothing.

import type { Cv } from '@cv/shared'

export type MockUser = {
  id: string
  email: string
  /** Kept as typed: this is a fake backend in the developer's own browser. */
  password: string
}

export type MockDb = {
  users: MockUser[]
  /** The user the session cookie belongs to. */
  sessionUserId: string | null
  /** Times of recent failed logins, by email; the mock throttles after five in 15 minutes. */
  failedLogins: Record<string, number[]>
  /** Every user's CVs; a handler only ever shows the session user's own. */
  cvs: MockCv[]
  /** Times generations started in, by user id; the hourly limit counts them. */
  generations: Record<string, number[]>
  /** Times questions were answered in, by user id; the hourly limit counts them. */
  answers: Record<string, number[]>
}

/** How a fake generation ends (`mocks/worker.ts`). */
export type Scenario = 'questions' | 'ready' | 'retry' | 'fail'

/** A generation the fake worker is running. */
export type MockJob = {
  queuedAt: number
  scenario: Scenario
  /** When the worker took the job; unset while it waits in the queue. */
  startedAt?: number
}

export type MockCv = {
  ownerId: string
  cv: Cv
  /** Present while the CV is in progress. */
  job?: MockJob
}

const KEY = 'ai-cv-builder:mock-db'

const emptyDb = (): MockDb => ({
  users: [],
  sessionUserId: null,
  failedLogins: {},
  cvs: [],
  generations: {},
  answers: {},
})

export function readDb(): MockDb {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...emptyDb(), ...(JSON.parse(raw) as Partial<MockDb>) } : emptyDb()
  } catch {
    return emptyDb()
  }
}

export function writeDb(db: MockDb): void {
  localStorage.setItem(KEY, JSON.stringify(db))
}

/** Changes the stored data in one read-modify-write. */
export function updateDb<T>(change: (db: MockDb) => T): T {
  const db = readDb()
  const result = change(db)
  writeDb(db)
  return result
}

export function resetDb(): void {
  localStorage.removeItem(KEY)
}

/** A user that already exists, for tests and demos. `signedIn` also starts their session. */
export function seedUser(email: string, password: string, { signedIn = false } = {}): MockUser {
  const user = { id: crypto.randomUUID(), email, password }
  updateDb((db) => {
    db.users.push(user)
    if (signedIn) db.sessionUserId = user.id
  })
  return user
}

/** Ends the session on the "server" side, as if the cookie expired. */
export function expireSession(): void {
  updateDb((db) => {
    db.sessionUserId = null
  })
}
