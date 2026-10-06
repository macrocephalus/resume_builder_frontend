import { describe, expect, test } from 'vitest'
import { fileNameFrom } from '@/shared/api/fileName'

describe('fileNameFrom', () => {
  test.each([
    ['attachment; filename="Olena Backend.pdf"', 'Olena Backend.pdf'],
    ['attachment; filename=olena.pdf', 'olena.pdf'],
    ['attachment; filename="say \\"hi\\".pdf"', 'say "hi".pdf'],
    ['ATTACHMENT; FILENAME="olena.pdf"', 'olena.pdf'],
  ])('reads %s', (header, name) => {
    expect(fileNameFrom(header, 'cv.pdf')).toBe(name)
  })

  test('prefers the UTF-8 name', () => {
    expect(
      fileNameFrom(
        `attachment; filename="Olena - Backend.pdf"; filename*=UTF-8''Olena%20%E2%80%94%20Backend.pdf`,
        'cv.pdf',
      ),
    ).toBe('Olena — Backend.pdf')
  })

  test('a broken UTF-8 name falls back to the plain one', () => {
    expect(
      fileNameFrom(`attachment; filename*=UTF-8''%E2%28; filename="plain.pdf"`, 'cv.pdf'),
    ).toBe('plain.pdf')
  })

  test('keeps only the last part of a path', () => {
    expect(fileNameFrom('attachment; filename="../../etc/olena.pdf"', 'cv.pdf')).toBe('olena.pdf')
    expect(fileNameFrom('attachment; filename="C:\\\\Users\\\\me.pdf"', 'cv.pdf')).toBe('me.pdf')
  })

  test.each([null, '', 'attachment', 'attachment; filename=""', 'attachment; filename="/"'])(
    'falls back when there is no name: %s',
    (header) => {
      expect(fileNameFrom(header, 'cv.pdf')).toBe('cv.pdf')
    },
  )
})
