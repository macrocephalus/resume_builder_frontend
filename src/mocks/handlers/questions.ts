import {
  answerSchemaFor,
  applyAnswer,
  repliesBodySchema,
  SKIPPABLE_KINDS,
  storedAnswer,
  targetExists,
  type Answer,
  type Question,
} from '@cv/shared'
import { http, HttpResponse } from 'msw'
import { readyWhenAnswered } from '@/mocks/cv-status'
import { sessionUser, unauthorized } from '@/mocks/handlers/auth'
import { errorResponse, readJson, validationError } from '@/mocks/respond'
import { updateDb } from '@/mocks/store'
import { runWorker } from '@/mocks/worker'

type Checked = { question: Question; answer: Answer | null }

export const questionHandlers = [
  /**
   * Applies a batch of answers and skips as the API does, minus the answer wording: every answer
   * goes in as written with the shared `applyAnswer`, the server's own fallback. Every reply is
   * checked before anything is written, so the batch is applied whole or not at all.
   */
  http.post<{ id: string }>('/api/cvs/:id/replies', async ({ params, request }) => {
    const user = sessionUser()
    if (!user) return unauthorized()
    const body = repliesBodySchema.safeParse(await readJson(request))
    if (!body.success) return validationError(body.error)
    const now = Date.now()
    return updateDb((db) => {
      runWorker(db.cvs, now)
      const entry = db.cvs.find((own) => own.ownerId === user.id && own.cv.id === params.id)
      if (!entry) return errorResponse(404, 'NOT_FOUND', 'This CV does not exist.')
      const { cv } = entry
      let data = cv.data
      if (cv.status !== 'needs_input' || !data) {
        return errorResponse(409, 'INVALID_STATE', 'This CV takes no replies right now.')
      }

      const checked: Checked[] = []
      const fields: Record<string, string> = {}
      for (const [index, reply] of body.data.replies.entries()) {
        const question = cv.questions.find((own) => own.id === reply.questionId)
        if (!question) return errorResponse(404, 'NOT_FOUND', 'This question does not exist.')
        if (question.status !== 'open') {
          return errorResponse(409, 'INVALID_STATE', 'This question is already closed.')
        }
        if (!targetExists(data, question)) {
          return errorResponse(
            409,
            'INVALID_STATE',
            'The part of the CV this question is about is gone.',
          )
        }
        if (reply.answer === null) {
          if (!(SKIPPABLE_KINDS as readonly string[]).includes(question.kind)) {
            fields[`replies.${index}.answer`] = 'A confirm question must be answered yes or no.'
          }
          checked.push({ question, answer: null })
          continue
        }
        const answer = answerSchemaFor(question).safeParse(reply.answer)
        if (!answer.success) {
          // A wrong kind is a state the question is not in; anything else is a bad body.
          if (answer.error.issues.some((issue) => issue.path[0] === 'kind')) {
            return errorResponse(
              409,
              'INVALID_STATE',
              `This question takes a "${question.kind}" answer.`,
            )
          }
          for (const issue of answer.error.issues) {
            fields[['replies', index, 'answer', ...issue.path].join('.')] ??= issue.message
          }
          continue
        }
        checked.push({ question, answer: answer.data })
      }
      if (Object.keys(fields).length > 0) {
        return errorResponse(400, 'VALIDATION_ERROR', 'The request is invalid.', {
          details: { fields },
        })
      }

      for (const { question, answer } of checked) {
        if (answer === null) {
          question.status = 'skipped'
          continue
        }
        data = applyAnswer(data, question, answer, () => crypto.randomUUID())
        question.status = 'answered'
        question.answer = storedAnswer(answer)
      }
      cv.data = data
      cv.version += 1
      readyWhenAnswered(cv)
      cv.updatedAt = new Date(now).toISOString()
      return HttpResponse.json({ cv })
    })
  }),
]
