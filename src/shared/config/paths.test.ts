import { describe, expect, test } from 'vitest'
import { paths, safeNext } from '@/shared/config/paths'

describe('safeNext', () => {
  test.each(['/', '/cvs/1', '/cvs/1?tab=questions', '/cvs/1#top'])('keeps the path %s', (next) => {
    expect(safeNext(next)).toBe(next)
  })

  test.each([
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '/.//evil.example',
    '/..//evil.example',
    '/%2e//evil.example',
    '/./\\evil.example',
    'javascript:alert(1)',
    'cvs/1',
    '',
    null,
    undefined,
  ])('refuses %s', (next) => {
    expect(safeNext(next)).toBeNull()
  })
})

describe('paths.login', () => {
  test('carries a return address', () => {
    expect(paths.login('/cvs/1?tab=match')).toBe('/login?next=%2Fcvs%2F1%3Ftab%3Dmatch')
  })

  test('drops a return address to the start page or to another site', () => {
    expect(paths.login('/')).toBe('/login')
    expect(paths.login('//evil.example')).toBe('/login')
  })
})

describe('paths.newCv', () => {
  test('is the plain form without a parent CV', () => {
    expect(paths.newCv()).toBe('/cvs/new')
  })

  test('carries the parent CV and the role to prefill', () => {
    expect(paths.newCv({ fromCvId: 'a1', role: 'Node.js Tech Lead' })).toBe(
      '/cvs/new?fromCvId=a1&role=Node.js+Tech+Lead',
    )
  })
})
