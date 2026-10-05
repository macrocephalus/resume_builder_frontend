import { ApiError } from '@/shared/api/ApiError'
import { errorText } from '@/shared/api/errorText'

/** `409 INVALID_STATE`: the question was closed already, or what it was about is gone. */
export const isQuestionGone = (error: unknown) =>
  error instanceof ApiError && error.code === 'INVALID_STATE'

export const questionGoneText =
  'That question was already closed, or the part of the CV it was about is gone. The CV is now up to date.'

/** Why an answer or skip did not go through, for its card. */
export const replyErrorText = (error: unknown) => `Not sent. ${errorText(error)}`
