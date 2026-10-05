import type { Question } from '@cv/shared'
import { describe, expect, test } from 'vitest'
import {
  answerBody,
  answerText,
  OTHER,
  questionTarget,
  verificationText,
} from '@/features/cv-editor/model/questions'

const question = (fields: Partial<Question>): Question => ({
  id: crypto.randomUUID(),
  kind: 'text',
  origin: 'auto',
  text: 'What phone number should employers use?',
  label: 'Phone',
  options: [],
  claim: null,
  target: { section: 'contacts', field: 'phone' },
  status: 'open',
  answer: null,
  ...fields,
})

const choice = question({ kind: 'choice', label: 'English', options: ['B2', 'C1'] })
const multi = question({
  kind: 'multi',
  label: 'Skills',
  options: ['Kafka', 'gRPC'],
  target: { section: 'skills' },
})

describe('questionTarget', () => {
  test('names the block and the field', () => {
    expect(questionTarget(question({}))).toBe('Contacts · Phone')
    expect(questionTarget(choice)).toBe('Contacts · English')
  })

  test('does not repeat a label that is the block name', () => {
    expect(questionTarget(multi)).toBe('Skills')
  })
})

describe('answerBody', () => {
  test('text: the trimmed value, nothing when blank or too long', () => {
    expect(answerBody(question({}), { text: ' +380 67 ' })).toEqual({
      kind: 'text',
      value: '+380 67',
    })
    expect(answerBody(question({}), { text: '  ' })).toBeNull()
    expect(answerBody(question({}), { text: 'x'.repeat(1001) })).toBeNull()
  })

  test('choice: an option, or Other with its text', () => {
    expect(answerBody(choice, { picked: ['C1'] })).toEqual({ kind: 'choice', value: 'C1' })
    expect(answerBody(choice, { picked: [OTHER], other: 'Native' })).toEqual({
      kind: 'choice',
      other: 'Native',
    })
    expect(answerBody(choice, { picked: [OTHER], other: ' ' })).toBeNull()
    expect(answerBody(choice, { picked: [] })).toBeNull()
  })

  test('multi: ticked options and / or Other, at least one', () => {
    expect(answerBody(multi, { picked: ['Kafka'], other: '' })).toEqual({
      kind: 'multi',
      values: ['Kafka'],
    })
    expect(answerBody(multi, { picked: [], other: 'Redis, NATS' })).toEqual({
      kind: 'multi',
      values: [],
      other: 'Redis, NATS',
    })
    expect(answerBody(multi, { picked: [], other: '' })).toBeNull()
  })

  test('an option that is not offered is refused', () => {
    expect(answerBody(choice, { picked: ['A1'] })).toBeNull()
  })
})

describe('answerText', () => {
  test('says what was answered', () => {
    expect(answerText(question({ status: 'answered', answer: '+380 67' }))).toBe('+380 67')
    expect(answerText(question({ status: 'answered', answer: ['Kafka', 'gRPC'] }))).toBe(
      'Kafka, gRPC',
    )
    expect(answerText(question({ status: 'skipped' }))).toBe('Skipped')
  })

  test('a confirm answer repeats the claim', () => {
    const confirm = { kind: 'confirm', claim: 'Cut latency by 40%' } as const
    expect(answerText(question({ ...confirm, status: 'answered', answer: true }))).toBe(
      'Added: Cut latency by 40%',
    )
    expect(answerText(question({ ...confirm, status: 'answered', answer: false }))).toBe(
      'Left out: Cut latency by 40%',
    )
  })
})

describe('verificationText', () => {
  test('lists what the check did, leaving out what did not happen', () => {
    expect(
      verificationText({ verified: 7, sentToConfirm: 1, skillsToConfirm: 3, cleared: 0 }),
    ).toBe(
      '7 bullets confirmed by quotes from your text, 1 sent to you to confirm, 3 skills moved to suggestions.',
    )
    expect(
      verificationText({ verified: 1, sentToConfirm: 0, skillsToConfirm: 0, cleared: 2 }),
    ).toBe(
      '1 bullet confirmed by a quote from your text, 2 unconfirmed fields cleared and asked about.',
    )
  })
})
