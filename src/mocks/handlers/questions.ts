import { answerSchemaFor, SKIPPABLE_KINDS, type Cv, type Question } from '@cv/shared'
import { http, HttpResponse } from 'msw'
import { applyAnswer, readyWhenAnswered, storedAnswer, targetExists } from '@/mocks/answers'
import { sessionUser, unauthorized } from '@/mocks/handlers/auth'
import { HOUR } from '@/mocks/handlers/cvs'
import { errorResponse, readJson, validationError } from '@/mocks/respond'
import { updateDb, type MockDb } from '@/mocks/store'
import { runWorker } from '@/mocks/worker'

type Params = { id: string; questionId: string }

/** The answer limit of docs/api.md. */
export const ANSWERS_PER_HOUR = 60

/** The session user's answers within the last hour. */
export const recentAnswers = (db: MockDb, userId: string, now: number) =>
  (db.answers[userId] ?? []).filter((at) => now - at < HOUR)

/** Finds the session user's CV and its open question, or the error the API would answer. */
function openQuestion(
  params: Params,
  close: (cv: Cv, question: Question) => Response | void,
  { isAnswer = false } = {},
) {
  const user = sessionUser()
  if (!user) return unauthorized()
  const now = Date.now()
  return updateDb((db) => {
    runWorker(db.cvs, now)
    const entry = db.cvs.find((own) => own.ownerId === user.id && own.cv.id === params.id)
    if (!entry) return errorResponse(404, 'NOT_FOUND', 'This CV does not exist.')
    const question = entry.cv.questions.find((own) => own.id === params.questionId)
    if (!question) return errorResponse(404, 'NOT_FOUND', 'This question does not exist.')
    if (entry.cv.status !== 'needs_input' || question.status !== 'open' || !entry.cv.data) {
      return errorResponse(409, 'INVALID_STATE', 'This question is already closed.')
    }
    if (!targetExists(entry.cv.data, question)) {
      return errorResponse(
        409,
        'INVALID_STATE',
        'The part of the CV this question is about is gone.',
      )
    }
    const refused = close(entry.cv, question)
    if (refused) return refused
    // Counted for the usage endpoint; the mock does not enforce the answer limit.
    if (isAnswer) db.answers[user.id] = [...recentAnswers(db, user.id, now), now]
    readyWhenAnswered(entry.cv)
    entry.cv.version += 1
    entry.cv.updatedAt = new Date(now).toISOString()
    return HttpResponse.json({ cv: entry.cv })
  })
}

export const questionHandlers = [
  http.post<Params>('/api/cvs/:id/questions/:questionId/answer', async ({ params, request }) => {
    const body: unknown = await readJson(request)
    return openQuestion(
      params,
      (cv, question) => {
        const answer = answerSchemaFor(question).safeParse(body)
        if (!answer.success) {
          // A wrong kind is a state the question is not in; anything else is a bad body.
          return answer.error.issues.some((issue) => issue.path[0] === 'kind')
            ? errorResponse(
                409,
                'INVALID_STATE',
                `This question takes a "${question.kind}" answer.`,
              )
            : validationError(answer.error)
        }
        cv.data = applyAnswer(cv.data!, question, answer.data)
        question.status = 'answered'
        question.answer = storedAnswer(answer.data)
      },
      { isAnswer: true },
    )
  }),

  http.post<Params>('/api/cvs/:id/questions/:questionId/skip', ({ params }) =>
    openQuestion(params, (_, question) => {
      if (!(SKIPPABLE_KINDS as readonly string[]).includes(question.kind)) {
        return errorResponse(409, 'INVALID_STATE', 'A confirmation must be answered yes or no.')
      }
      question.status = 'skipped'
    }),
  ),
]
