import type { Usage } from '@cv/shared'
import { http, HttpResponse } from 'msw'
import { sessionUser, unauthorized } from '@/mocks/handlers/auth'
import { activeCount, GENERATION_LIMITS, HOUR, recentGenerations } from '@/mocks/handlers/cvs'
import { updateDb } from '@/mocks/store'
import { runWorker } from '@/mocks/worker'

/** When the oldest of `times` leaves the hour; an hour from now when there is none. */
const resetsAt = (times: number[], now: number) =>
  new Date((times.length > 0 ? Math.min(...times) : now) + HOUR).toISOString()

/** The limits of docs/api.md, counted from the mock's own records of the session user. */
export const usageHandlers = [
  http.get('/api/usage', () => {
    const user = sessionUser()
    if (!user) return unauthorized()
    const now = Date.now()
    const usage = updateDb((db): Usage => {
      runWorker(db.cvs, now)
      const generations = recentGenerations(db, user.id, now)
      return {
        generations: {
          used: generations.length,
          limit: GENERATION_LIMITS.perHour,
          resetsAt: resetsAt(generations, now),
        },
        active: {
          used: activeCount(db, user.id),
          limit: GENERATION_LIMITS.active,
        },
      }
    })
    return HttpResponse.json(usage)
  }),
]
