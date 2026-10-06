import { describe, expect, test } from 'vitest'
import { ApiError } from '@/shared/api/ApiError'
import { createFailure, readPrefill } from '@/features/cv-create/model/createForm'

const id = '7d1c3f4e-9a43-4a5e-8a39-1d9f4f6b2a10'
const search = (query: string) => new URLSearchParams(query)

describe('readPrefill', () => {
  test('reads the parent CV and the role', () => {
    expect(readPrefill(search(`fromCvId=${id}&role=+Node.js+Tech+Lead+`))).toEqual({
      fromCvId: id,
      role: 'Node.js Tech Lead',
    })
  })

  test('ignores a parent that is not a CV id, and keeps the role', () => {
    expect(readPrefill(search('fromCvId=../../me&role=Platform+Engineer'))).toEqual({
      fromCvId: null,
      role: 'Platform Engineer',
    })
  })

  test('is empty for the plain form', () => {
    expect(readPrefill(search(''))).toEqual({ fromCvId: null, role: '' })
  })

  test('cuts a role longer than the contract allows', () => {
    expect(readPrefill(search(`role=${'x'.repeat(300)}`)).role).toHaveLength(100)
  })
})

describe('createFailure', () => {
  test('says the parent CV is gone or has no draft yet', () => {
    expect(createFailure(new ApiError(404, 'NOT_FOUND', 'Not found')).message).toBe(
      'The CV you started from is gone. Start a new CV with your own text instead.',
    )
    expect(createFailure(new ApiError(409, 'INVALID_STATE', 'No draft')).message).toBe(
      'The CV you started from has no draft yet. Try again when it is done.',
    )
  })
})
