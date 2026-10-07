import type { Answer, Question } from '@cv/shared'
import { describe, expect, test } from 'vitest'
import { ApiError } from '@/shared/api/ApiError'
import { applyErrorText, refusedReplies } from '@/features/cv-editor/model/questionErrors'
import {
  appliedText,
  applyLabel,
  repliesFor,
  replySummary,
} from '@/features/cv-editor/model/replies'

const question = (id: string, status: Question['status'] = 'open'): Question => ({
  id,
  status,
  kind: 'text',
  origin: 'auto',
  text: '',
  label: '',
  options: [],
  claim: null,
  target: { section: 'summary' },
  answer: null,
})

const text = (value: string): Answer => ({ kind: 'text', value })

describe('repliesFor', () => {
  test('follows the order of the list and leaves out closed questions and unreplied cards', () => {
    const questions = [question('a'), question('b', 'answered'), question('c'), question('d')]
    const replied = { d: text('four'), b: text('two'), a: null }

    expect(repliesFor(questions, replied)).toEqual([
      { questionId: 'a', answer: null },
      { questionId: 'd', answer: text('four') },
    ])
  })
})

describe('replySummary', () => {
  test('says what the card holds in a few words', () => {
    expect(replySummary(null)).toBe('Skipped')
    expect(replySummary({ kind: 'confirm', value: true })).toBe('Yes')
    expect(replySummary({ kind: 'confirm', value: false })).toBe('No')
    expect(replySummary({ kind: 'choice', value: 'B2' })).toBe('B2')
    expect(replySummary({ kind: 'choice', other: 'Native-level Polish' })).toBe(
      'Native-level Polish',
    )
    expect(replySummary({ kind: 'multi', values: ['Docker', 'Kafka'], other: 'NATS, Go' })).toBe(
      'Docker, Kafka, NATS, Go',
    )
  })

  test('cuts a long text to about 80 characters', () => {
    const summary = replySummary(text(`${'word '.repeat(30)}end`))
    expect(summary.length).toBe(80)
    expect(summary.endsWith('…')).toBe(true)
    expect(replySummary(text('a'.repeat(80)))).toBe('a'.repeat(80))
  })
})

describe('counts', () => {
  test('one reply, many replies', () => {
    expect(applyLabel(1)).toBe('Apply 1 reply')
    expect(applyLabel(3)).toBe('Apply 3 replies')
    expect(appliedText(1)).toBe('1 reply applied')
    expect(appliedText(2)).toBe('2 replies applied')
  })
})

describe('refused replies', () => {
  const sent = [
    { questionId: 'a', answer: text('one') },
    { questionId: 'b', answer: text('two') },
  ]
  const validation = (fields: Record<string, unknown>) =>
    new ApiError(400, 'VALIDATION_ERROR', 'The request is invalid.', { fields })

  test('maps the fields of a 400 to the questions they were sent for', () => {
    const error = validation({
      'replies.1.answer.value': 'Too long',
      'replies.1.answer': 'Also this',
      'replies.9.answer': 'Nothing was sent here',
      body: 'Not about a reply',
    })
    expect(refusedReplies(error, sent)).toEqual({ b: 'Too long' })
    expect(applyErrorText(error, sent)).toBe(
      'Not applied: check the marked replies and apply again.',
    )
  })

  test('other errors refuse nothing and keep their own text', () => {
    expect(refusedReplies(new ApiError(503, 'NETWORK_ERROR', ''), sent)).toEqual({})
    expect(applyErrorText(new ApiError(0, 'NETWORK_ERROR', ''), sent)).toBe(
      'Not applied. Cannot reach the server. Check your connection and try again.',
    )
    expect(applyErrorText(new ApiError(409, 'INVALID_STATE', 'Closed.'), sent)).toBe(
      'Some questions changed — check your replies and apply again.',
    )
    expect(applyErrorText(new ApiError(404, 'NOT_FOUND', 'Gone.'), sent)).toBe(
      'Some questions changed — check your replies and apply again.',
    )
  })
})
