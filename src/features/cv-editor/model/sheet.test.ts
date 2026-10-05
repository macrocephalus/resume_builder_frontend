import { DEFAULT_SECTION_ORDER, getCvLanguage, type CvData } from '@cv/shared'
import { describe, expect, test } from 'vitest'
import { toSheet } from '@/features/cv-editor/model/sheet'

const english = getCvLanguage('en').headings

const empty = (): CvData => ({
  contacts: { fullName: null, email: null, phone: null, location: null, links: [] },
  summary: null,
  experience: [],
  projects: [],
  education: [],
  certifications: [],
  skills: [],
  languages: [],
  sectionOrder: [...DEFAULT_SECTION_ORDER],
})

const id = () => crypto.randomUUID()

const full = (): CvData => ({
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
      id: id(),
      title: 'Backend Engineer',
      company: 'Fintory',
      period: '2019 – present',
      bullets: ['Built the payments API', ' '],
    },
    { id: id(), title: null, company: 'Acme', period: null, bullets: [] },
  ],
  projects: [
    { id: id(), name: 'pg-outbox', period: '2023', url: 'github.com/x', bullets: ['Outbox'] },
  ],
  education: [{ id: id(), institution: 'KPI', degree: 'BSc', period: '2014 – 2018' }],
  certifications: [{ id: id(), name: 'AWS Developer', issuer: null, year: '2022' }],
  skills: ['Node.js', '', 'PostgreSQL'],
  languages: [
    { id: id(), name: 'Ukrainian', level: 'Native' },
    { id: id(), name: 'English', level: null },
  ],
  sectionOrder: [...DEFAULT_SECTION_ORDER],
})

describe('toSheet', () => {
  test('the name, then one contact line', () => {
    const sheet = toSheet(full(), english)
    expect(sheet.name).toBe('Olena Hnatiuk')
    expect(sheet.contacts).toBe('olena@example.com · Kyiv · github.com/olena-h')
  })

  test('blocks follow the section order with headings in the CV language', () => {
    const data = { ...full(), sectionOrder: [...DEFAULT_SECTION_ORDER].reverse() }
    expect(toSheet(data, english).blocks.map((block) => block.heading)).toEqual([
      'Languages',
      'Skills',
      'Certifications',
      'Education',
      'Projects',
      'Experience',
      'Summary',
    ])
    expect(toSheet(data, getCvLanguage('uk').headings).blocks[0]?.heading).toBe('Мови')
  })

  test('a draft with only a name has no blocks and no contact line', () => {
    const data = empty()
    data.contacts.fullName = 'Olena'
    expect(toSheet(data, english)).toEqual({ name: 'Olena', contacts: null, blocks: [] })
  })

  test('empty items, fields and bullets leave no trace', () => {
    const data = full()
    data.education.push({ id: id(), institution: ' ', degree: null, period: null })
    const blocks = toSheet(data, english).blocks
    const experience = blocks.find((block) => block.section === 'experience')
    expect(experience).toMatchObject({
      section: 'experience',
      heading: 'Experience',
      kind: 'items',
      items: [
        {
          title: 'Backend Engineer, Fintory',
          meta: '2019 – present',
          bullets: ['Built the payments API'],
        },
        { title: 'Acme', meta: null, bullets: [] },
      ],
    })
    expect(blocks.find((block) => block.section === 'education')).toMatchObject({
      items: [{ title: 'KPI, BSc', meta: '2014 – 2018', bullets: [] }],
    })
    // No leftover separators around a missing part, and nothing spelled "undefined".
    expect(JSON.stringify(blocks)).not.toMatch(/undefined|, ,|· ·|":", |, "|· "/)
  })

  test('projects, certifications, skills and languages', () => {
    const blocks = toSheet(full(), english).blocks
    const by = (section: string) => blocks.find((block) => block.section === section)
    expect(by('projects')).toMatchObject({
      items: [{ title: 'pg-outbox', meta: '2023 · github.com/x', bullets: ['Outbox'] }],
    })
    expect(by('certifications')).toMatchObject({
      items: [{ title: 'AWS Developer', meta: '2022', bullets: [] }],
    })
    expect(by('skills')).toMatchObject({ kind: 'text', text: 'Node.js, PostgreSQL' })
    expect(by('languages')).toMatchObject({ kind: 'text', text: 'Ukrainian (Native), English' })
  })

  test('text is trimmed', () => {
    const data = empty()
    data.summary = '  Backend engineer.  '
    expect(toSheet(data, english).blocks).toEqual([
      { section: 'summary', heading: 'Summary', kind: 'text', text: 'Backend engineer.' },
    ])
  })
})
