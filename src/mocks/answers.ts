// How the mock API applies an answer: the simple rule of the spec, not the real AnswerAgent
// (docs/architecture.md §6.5 at the repo root). A scalar target gets the value; skills get the
// ticked values, or "{label}: {value}" for a typed answer; bullets, links and the summary get the
// answer appended; a confirmed claim is appended to its target.

import type { Answer, Cv, CvData, Question } from '@cv/shared'

/** The stored answer of a closed question. */
export function storedAnswer(answer: Answer): Question['answer'] {
  switch (answer.kind) {
    case 'text':
      return answer.value
    case 'choice':
      return answer.value ?? answer.other ?? ''
    case 'multi':
      return [...answer.values, ...splitList(answer.other)]
    case 'confirm':
      return answer.value
  }
}

const splitList = (value: string | undefined) =>
  (value ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '')

/** The item a target points at, or `undefined` when it is gone. */
function targetItem(data: CvData, { target }: Question): Record<string, unknown> | undefined {
  if (!target.itemId) return undefined
  const section = data[target.section as keyof CvData]
  return Array.isArray(section)
    ? (section as { id?: string }[]).find((item) => item.id === target.itemId)
    : undefined
}

/** False when the question is about an item that is no longer in the draft. */
export const targetExists = (data: CvData, question: Question) =>
  !question.target.itemId || targetItem(data, question) !== undefined

/** The draft with the answer written into the question's target. */
export function applyAnswer(data: CvData, question: Question, answer: Answer): CvData {
  const next = structuredClone(data)
  const values =
    answer.kind === 'confirm'
      ? answer.value && question.claim
        ? [question.claim]
        : []
      : ([storedAnswer(answer)].flat() as string[])
  if (values.length === 0) return next

  const { section, field } = question.target
  const item = targetItem(next, question)
  if (section === 'skills') {
    const known = new Set(next.skills.map((skill) => skill.toLowerCase()))
    const typed = answer.kind === 'text' || answer.kind === 'choice'
    const skills = typed ? values.map((value) => `${question.label}: ${value}`) : values
    next.skills.push(...skills.filter((skill) => !known.has(skill.toLowerCase())))
  } else if (section === 'summary') {
    next.summary = [next.summary, ...values].filter(Boolean).join(' ')
  } else if (section === 'contacts' && field === 'links') {
    next.contacts.links.push(...values)
  } else if (section === 'contacts' && field) {
    ;(next.contacts as Record<string, unknown>)[field] = values.join(', ')
  } else if (item && field === 'bullets') {
    ;(item.bullets as string[]).push(...values)
  } else if (item && field) {
    item[field] = values.join(', ')
  }
  return next
}

/** A `needs_input` CV with no open question left becomes `ready`. */
export function readyWhenAnswered(cv: Cv): void {
  if (cv.status === 'needs_input' && !cv.questions.some((question) => question.status === 'open')) {
    cv.status = 'ready'
  }
}
