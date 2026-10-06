import { DEFAULT_SECTION_ORDER } from '@cv/shared'
import { describe, expect, test } from 'vitest'
import { toDraftForm } from '@/features/cv-editor/model/draftForm'
import { pdfGaps } from '@/features/cv-editor/model/pdf'

const job = (id: string) => ({
  id,
  title: 'Backend Engineer',
  company: 'Fintory',
  period: '2019 – present',
  bullets: [],
})

const form = () =>
  toDraftForm({
    title: 'Olena — Backend',
    data: {
      contacts: {
        fullName: 'Olena',
        email: 'o@example.com',
        phone: null,
        location: null,
        links: [],
      },
      summary: 'Backend engineer.',
      experience: [job(crypto.randomUUID()), job(crypto.randomUUID())],
      projects: [],
      education: [{ id: crypto.randomUUID(), institution: 'KPI', degree: 'BSc', period: null }],
      certifications: [],
      skills: ['Node.js'],
      languages: [],
      sectionOrder: [...DEFAULT_SECTION_ORDER],
    },
  })

describe('pdfGaps', () => {
  test('a complete draft leaves nothing out', () => {
    expect(pdfGaps(form())).toEqual([])
  })

  test('names the missing blocks and contact fields, email and phone as one', () => {
    const values = form()
    values.contacts.fullName = ' '
    values.contacts.email = ''
    values.summary = ''
    values.experience = []
    values.skills = []
    expect(pdfGaps(values)).toEqual([
      'full name',
      'email or phone',
      'summary',
      'experience',
      'skills',
    ])
  })

  test('names the empty fields of an item by its number', () => {
    const values = form()
    values.experience[1]!.company = ''
    values.experience[1]!.period = ''
    values.education[0]!.institution = ''
    expect(pdfGaps(values)).toEqual([
      'company and period of job 2',
      'school or university of education 1',
    ])
  })
})
