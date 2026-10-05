import { DEFAULT_SECTION_ORDER, type Cv, type CvData } from '@cv/shared'
import { describe, expect, test } from 'vitest'
import {
  draftFormSchema,
  missingParts,
  splitLines,
  toDraftForm,
  toCvData,
  toPatchBody,
  type DraftFormValues,
} from '@/features/cv-editor/model/draftForm'

const jobId = '7d1c3f4e-9a43-4a5e-8a39-1d9f4f6b2a10'
const schoolId = '1b6f0f0e-58b6-4f87-9a3e-8c2b8d9b3d21'

const data = (): CvData => ({
  contacts: {
    fullName: 'Olena Hnatiuk',
    email: 'olena@example.com',
    phone: null,
    location: 'Kyiv',
    links: ['github.com/olena-h'],
  },
  summary: 'Backend engineer.',
  experience: [
    {
      id: jobId,
      title: 'Backend Engineer',
      company: 'Fintory',
      period: '2019 – present',
      bullets: ['Built the payments API', 'Mentored two engineers'],
    },
  ],
  projects: [],
  education: [{ id: schoolId, institution: 'KPI', degree: null, period: null }],
  certifications: [],
  skills: ['Node.js', 'PostgreSQL'],
  languages: [],
  sectionOrder: [...DEFAULT_SECTION_ORDER],
})

const cv = (overrides: Partial<Cv> = {}) =>
  ({ title: 'Olena — Backend', version: 3, data: data(), ...overrides }) as Cv

describe('toDraftForm / toCvData', () => {
  test('a draft survives the round trip through the form', () => {
    expect(toCvData(toDraftForm(cv()))).toEqual(data())
  })

  test('empty fields become empty strings in the form and null again in the draft', () => {
    const form = toDraftForm(cv())
    expect(form.contacts.phone).toBe('')
    expect(form.education[0]).toEqual({
      itemId: schoolId,
      institution: 'KPI',
      degree: '',
      period: '',
    })
  })

  test('bullets and links are edited one per line', () => {
    const form = toDraftForm(cv())
    expect(form.experience[0]?.bullets).toBe('Built the payments API\nMentored two engineers')
    expect(form.contacts.links).toBe('github.com/olena-h')
  })

  test('text is trimmed and blank lines are dropped', () => {
    const form = toDraftForm(cv())
    form.contacts.fullName = '  Olena  '
    form.contacts.phone = '   '
    form.experience[0]!.bullets = ' First \n\n  \nSecond'
    const result = toCvData(form)
    expect(result.contacts.fullName).toBe('Olena')
    expect(result.contacts.phone).toBeNull()
    expect(result.experience[0]?.bullets).toEqual(['First', 'Second'])
  })
})

describe('toPatchBody', () => {
  test('nothing changed: no request', () => {
    expect(toPatchBody(toDraftForm(cv()), cv())).toBeNull()
  })

  test('only the title changed: the draft is not sent', () => {
    const form = toDraftForm(cv())
    form.title = ' Olena — Platform '
    expect(toPatchBody(form, cv())).toEqual({ version: 3, title: 'Olena — Platform' })
  })

  test('a draft change sends the whole draft and no title', () => {
    const form = toDraftForm(cv())
    form.summary = 'Platform engineer.'
    const body = toPatchBody(form, cv())
    expect(body).toEqual({ version: 3, data: { ...data(), summary: 'Platform engineer.' } })
  })

  test('items with every field empty are dropped', () => {
    const form = toDraftForm(cv())
    form.experience.push({
      itemId: crypto.randomUUID(),
      title: '',
      company: ' ',
      period: '',
      bullets: '\n',
    })
    form.summary = 'Changed.'
    expect(toPatchBody(form, cv())?.data?.experience).toHaveLength(1)
  })

  test('an added empty item alone is no change', () => {
    const form = toDraftForm(cv())
    form.languages.push({ itemId: crypto.randomUUID(), name: '', level: '' })
    expect(toPatchBody(form, cv())).toBeNull()
  })

  test('whitespace typed into a field is no change', () => {
    const form = toDraftForm(cv())
    form.summary = 'Backend engineer.  '
    expect(toPatchBody(form, cv())).toBeNull()
  })
})

describe('missingParts', () => {
  test('a complete draft misses nothing', () => {
    expect(missingParts(toDraftForm(cv())).size).toBe(0)
  })

  test('names blocks, contact fields and fields inside items', () => {
    const form = toDraftForm(cv())
    form.contacts.fullName = ''
    form.contacts.email = ''
    form.summary = ' '
    form.skills = []
    form.experience[0]!.company = ''
    form.education[0]!.institution = ''
    form.education[0]!.degree = 'BSc'

    expect([...missingParts(form)].sort()).toEqual(
      [
        'contacts.fullName',
        'contacts.email',
        'contacts.phone',
        'summary',
        'skills',
        `experience.${jobId}.company`,
        `education.${schoolId}.institution`,
      ].sort(),
    )
  })

  test('no experience at all marks the block', () => {
    const form = toDraftForm(cv())
    form.experience = []
    expect(missingParts(form).has('experience')).toBe(true)
  })
})

describe('draftFormSchema', () => {
  const issues = (form: DraftFormValues) => {
    const result = draftFormSchema.safeParse(form)
    return result.success
      ? {}
      : Object.fromEntries(
          result.error.issues.map((issue) => [issue.path.join('.'), issue.message]),
        )
  }

  test('a draft from the server is valid', () => {
    expect(issues(toDraftForm(cv()))).toEqual({})
  })

  test('the title is required', () => {
    const form = toDraftForm(cv())
    form.title = '  '
    expect(issues(form)).toEqual({ title: 'Give the CV a title' })
  })

  test('limits are checked per field and per line', () => {
    const form = toDraftForm(cv())
    form.contacts.fullName = 'x'.repeat(201)
    form.experience[0]!.bullets = Array.from({ length: 13 }, (_, i) => `Bullet ${i}`).join('\n')
    form.contacts.links = `${'x'.repeat(301)}\nb`
    expect(issues(form)).toEqual({
      'contacts.fullName': 'Use at most 200 characters',
      'experience.0.bullets': 'Use at most 12 bullets',
      'contacts.links': 'Keep each link to 300 characters',
    })
  })
})

test('splitLines trims and drops blank lines', () => {
  expect(splitLines(' a \n\n b\r\n')).toEqual(['a', 'b'])
})
