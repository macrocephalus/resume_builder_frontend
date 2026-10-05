import {
  API_LIMITS,
  CV_LIMITS,
  dropEmptyItems,
  findMissing,
  MOVABLE_SECTIONS,
  type Cv,
  type CvData,
  type PatchCvBody,
} from '@cv/shared'
import { z } from 'zod'

// The editor's form: the draft as people type it. Text fields are strings ('' when empty),
// bullets and links are one text area with one entry per line, and skills are objects because
// `useFieldArray` needs them. Item ids are `itemId`, since `useFieldArray` owns `id`.

/** Trimmed, non-blank lines. */
export const splitLines = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')

const text = (max: number) => z.string().max(max, { error: `Use at most ${max} characters` })

const lines = (max: { lines: number; line: number }, noun: string) =>
  z.string().superRefine((value, ctx) => {
    const entries = splitLines(value)
    if (entries.length > max.lines) {
      ctx.addIssue({ code: 'custom', message: `Use at most ${max.lines} ${noun}s` })
    } else if (entries.some((entry) => entry.length > max.line)) {
      ctx.addIssue({ code: 'custom', message: `Keep each ${noun} to ${max.line} characters` })
    }
  })

const short = text(CV_LIMITS.shortText)
const bullets = lines({ lines: CV_LIMITS.bullets, line: CV_LIMITS.bullet }, 'bullet')
const itemId = z.string()

export const draftFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(API_LIMITS.title.min, { error: 'Give the CV a title' })
    .max(API_LIMITS.title.max, { error: `Use at most ${API_LIMITS.title.max} characters` }),
  contacts: z.object({
    fullName: short,
    email: short,
    phone: short,
    location: short,
    links: lines({ lines: CV_LIMITS.links, line: CV_LIMITS.link }, 'link'),
  }),
  summary: text(CV_LIMITS.summary),
  experience: z
    .array(z.object({ itemId, title: short, company: short, period: short, bullets }))
    .max(CV_LIMITS.experience),
  projects: z
    .array(z.object({ itemId, name: short, period: short, url: text(CV_LIMITS.link), bullets }))
    .max(CV_LIMITS.projects),
  education: z
    .array(z.object({ itemId, institution: short, degree: short, period: short }))
    .max(CV_LIMITS.education),
  certifications: z
    .array(z.object({ itemId, name: short, issuer: short, year: short }))
    .max(CV_LIMITS.certifications),
  skills: z.array(z.object({ value: text(CV_LIMITS.skill) })).max(CV_LIMITS.skills),
  languages: z.array(z.object({ itemId, name: short, level: short })).max(CV_LIMITS.languages),
  sectionOrder: z.array(z.enum(MOVABLE_SECTIONS)),
})

export type DraftFormValues = z.infer<typeof draftFormSchema>

const fromText = (value: string | null) => value ?? ''
const toText = (value: string) => value.trim() || null

/** The form's default values for a CV that has a draft. */
export function toDraftForm({ title, data }: Pick<Cv, 'title' | 'data'>): DraftFormValues {
  if (!data) throw new Error('The editor needs a draft')
  return {
    title,
    contacts: {
      fullName: fromText(data.contacts.fullName),
      email: fromText(data.contacts.email),
      phone: fromText(data.contacts.phone),
      location: fromText(data.contacts.location),
      links: data.contacts.links.join('\n'),
    },
    summary: fromText(data.summary),
    experience: data.experience.map(({ id, title: role, company, period, bullets: items }) => ({
      itemId: id,
      title: fromText(role),
      company: fromText(company),
      period: fromText(period),
      bullets: items.join('\n'),
    })),
    projects: data.projects.map(({ id, name, period, url, bullets: items }) => ({
      itemId: id,
      name: fromText(name),
      period: fromText(period),
      url: fromText(url),
      bullets: items.join('\n'),
    })),
    education: data.education.map(({ id, institution, degree, period }) => ({
      itemId: id,
      institution: fromText(institution),
      degree: fromText(degree),
      period: fromText(period),
    })),
    certifications: data.certifications.map(({ id, name, issuer, year }) => ({
      itemId: id,
      name: fromText(name),
      issuer: fromText(issuer),
      year: fromText(year),
    })),
    skills: data.skills.map((value) => ({ value })),
    languages: data.languages.map(({ id, name, level }) => ({
      itemId: id,
      name: fromText(name),
      level: fromText(level),
    })),
    sectionOrder: [...data.sectionOrder],
  }
}

/** The draft the form describes: trimmed, empty text as `null`, blank lines dropped. */
export function toCvData(form: DraftFormValues): CvData {
  return {
    contacts: {
      fullName: toText(form.contacts.fullName),
      email: toText(form.contacts.email),
      phone: toText(form.contacts.phone),
      location: toText(form.contacts.location),
      links: splitLines(form.contacts.links),
    },
    summary: toText(form.summary),
    experience: form.experience.map((item) => ({
      id: item.itemId,
      title: toText(item.title),
      company: toText(item.company),
      period: toText(item.period),
      bullets: splitLines(item.bullets),
    })),
    projects: form.projects.map((item) => ({
      id: item.itemId,
      name: toText(item.name),
      period: toText(item.period),
      url: toText(item.url),
      bullets: splitLines(item.bullets),
    })),
    education: form.education.map((item) => ({
      id: item.itemId,
      institution: toText(item.institution),
      degree: toText(item.degree),
      period: toText(item.period),
    })),
    certifications: form.certifications.map((item) => ({
      id: item.itemId,
      name: toText(item.name),
      issuer: toText(item.issuer),
      year: toText(item.year),
    })),
    skills: form.skills.map(({ value }) => value.trim()).filter((value) => value !== ''),
    languages: form.languages.map((item) => ({
      id: item.itemId,
      name: toText(item.name),
      level: toText(item.level),
    })),
    sectionOrder: [...form.sectionOrder],
  }
}

const saved = (data: CvData) => JSON.stringify(dropEmptyItems(data))

/**
 * The PATCH body for what the form changed: the title only if it changed, the draft (empty items
 * dropped) only if it changed. `null` when nothing would change.
 */
export function toPatchBody(form: DraftFormValues, cv: Cv): PatchCvBody | null {
  const body: PatchCvBody = { version: cv.version }
  const title = form.title.trim()
  if (title !== cv.title) body.title = title
  const data = dropEmptyItems(toCvData(form))
  if (JSON.stringify(data) !== saved(toCvData(toDraftForm(cv)))) body.data = data
  return body.title === undefined && body.data === undefined ? null : body
}

/**
 * The required parts the form lacks, by the contract's rule (`findMissing`), as keys:
 * `summary`, `contacts.fullName`, `experience.<itemId>.title`.
 */
export function missingParts(form: DraftFormValues): Set<string> {
  return new Set(
    findMissing(toCvData(form)).map(({ section, itemId, field }) =>
      [section, itemId, field].filter(Boolean).join('.'),
    ),
  )
}
