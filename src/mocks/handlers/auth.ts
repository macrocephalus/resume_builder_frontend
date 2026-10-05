import { credentialsSchema, type User } from '@cv/shared'
import { http, HttpResponse } from 'msw'
import { errorResponse, readJson, validationError } from '@/mocks/respond'
import { readDb, updateDb, type MockUser } from '@/mocks/store'

const MAX_FAILED_LOGINS = 5
const THROTTLE_SECONDS = 15 * 60

const toUser = ({ id, email }: MockUser): User => ({ id, email })

/** The signed-in user, or `undefined` when the session cookie is missing or stale. */
export function sessionUser(): MockUser | undefined {
  const db = readDb()
  return db.users.find((user) => user.id === db.sessionUserId)
}

export const unauthorized = () => errorResponse(401, 'UNAUTHORIZED', 'Please log in.')

export const authHandlers = [
  http.post('/api/auth/signup', async ({ request }) => {
    const body = credentialsSchema.safeParse(await readJson(request))
    if (!body.success) return validationError(body.error)
    const { email, password } = body.data

    const user = updateDb((db) => {
      if (db.users.some((existing) => existing.email === email)) return null
      const created = { id: crypto.randomUUID(), email, password }
      db.users.push(created)
      db.sessionUserId = created.id
      return created
    })
    if (!user)
      return errorResponse(409, 'EMAIL_TAKEN', 'An account with this email already exists.')
    return HttpResponse.json({ user: toUser(user) }, { status: 201 })
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const body = credentialsSchema.safeParse(await readJson(request))
    if (!body.success) return validationError(body.error)
    const { email, password } = body.data

    const now = Date.now()
    const result = updateDb((db) => {
      // Failures older than the window no longer count, so a throttle ends by itself.
      const recent = (db.failedLogins[email] ?? []).filter(
        (at) => now - at < THROTTLE_SECONDS * 1000,
      )
      db.failedLogins[email] = recent
      if (recent.length >= MAX_FAILED_LOGINS) {
        const oldest = recent[0] ?? now
        return { throttledFor: Math.ceil((oldest + THROTTLE_SECONDS * 1000 - now) / 1000) }
      }
      const user = db.users.find(
        (existing) => existing.email === email && existing.password === password,
      )
      if (!user) {
        recent.push(now)
        return 'failed' as const
      }
      delete db.failedLogins[email]
      db.sessionUserId = user.id
      return user
    })
    if (result === 'failed') {
      return errorResponse(401, 'INVALID_CREDENTIALS', 'Wrong email or password.')
    }
    if ('throttledFor' in result) {
      return errorResponse(429, 'RATE_LIMITED', 'Too many login attempts.', {
        details: { limit: MAX_FAILED_LOGINS },
        headers: { 'Retry-After': String(result.throttledFor) },
      })
    }
    return HttpResponse.json({ user: toUser(result) })
  }),

  http.post('/api/auth/logout', () => {
    updateDb((db) => {
      db.sessionUserId = null
    })
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/auth/me', () => {
    const user = sessionUser()
    return user ? HttpResponse.json({ user: toUser(user) }) : unauthorized()
  }),
]
