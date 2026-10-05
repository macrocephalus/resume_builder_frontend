import { describe, expect, test } from 'vitest'
import { progressText } from '@/features/cv-editor/model/progressText'

const base = { stage: null, attempt: 1, maxAttempts: 3, queuePosition: null }

describe('progressText', () => {
  test('counts the CVs ahead in the queue', () => {
    expect(progressText({ ...base, status: 'queued', queuePosition: 3 })).toBe(
      '2 ahead of you in the queue',
    )
    expect(progressText({ ...base, status: 'queued', queuePosition: 1 })).toBe('Starting soon')
  })

  test('names the stage, and the attempt after a retry', () => {
    expect(progressText({ ...base, status: 'generating', stage: 'verifying' })).toBe(
      'Checking facts against your source',
    )
    expect(progressText({ ...base, status: 'generating', stage: 'drafting', attempt: 2 })).toBe(
      'Writing your CV · attempt 2 of 3',
    )
  })

  test('says which attempt failed while retrying', () => {
    expect(progressText({ ...base, status: 'retrying', attempt: 2 })).toBe(
      'Attempt 2 of 3 failed, retrying…',
    )
  })
})
