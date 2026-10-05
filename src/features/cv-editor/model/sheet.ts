import {
  dropEmptyItems,
  isSectionEmpty,
  type CvData,
  type CvSection,
  type MovableSection,
} from '@cv/shared'

// What the A4 preview shows, in the layout of the PDF (docs/architecture.md §10 at the repo root):
// the name, one contact line, then each non-empty block in the draft's order under its heading in
// the CV language. Nothing empty is shown: no heading without content, no stray separator.

export type SheetItem = { id: string; title: string | null; meta: string | null; bullets: string[] }

export type SheetBlock = { section: MovableSection; heading: string } & (
  { kind: 'text'; text: string } | { kind: 'items'; items: SheetItem[] }
)

export type SheetLayout = { name: string | null; contacts: string | null; blocks: SheetBlock[] }

/** Trimmed text, or `null` when blank. */
const clean = (value: string | null | undefined) => value?.trim() || null

/** The non-blank parts joined by `separator`, or `null` when there are none. */
const join = (separator: string, parts: readonly (string | null)[]) =>
  parts
    .map(clean)
    .filter((part) => part !== null)
    .join(separator) || null

const lines = (values: readonly string[]) => values.map(clean).filter((value) => value !== null)

function body(data: CvData, section: MovableSection) {
  switch (section) {
    case 'summary':
      return { kind: 'text', text: clean(data.summary) ?? '' } as const
    case 'skills':
      return { kind: 'text', text: lines(data.skills).join(', ') } as const
    case 'languages':
      return {
        kind: 'text',
        text: data.languages
          .map(({ name, level }) => {
            const [named, levelled] = [clean(name), clean(level)]
            // "English (C1)"; just the one that is there when the other is missing.
            return named && levelled ? `${named} (${levelled})` : (named ?? levelled)
          })
          .filter((entry) => entry !== null)
          .join(', '),
      } as const
    case 'experience':
      return {
        kind: 'items',
        items: data.experience.map((item) => ({
          id: item.id,
          title: join(', ', [item.title, item.company]),
          meta: clean(item.period),
          bullets: lines(item.bullets),
        })),
      } as const
    case 'projects':
      return {
        kind: 'items',
        items: data.projects.map((item) => ({
          id: item.id,
          title: clean(item.name),
          meta: join(' · ', [item.period, item.url]),
          bullets: lines(item.bullets),
        })),
      } as const
    case 'education':
      return {
        kind: 'items',
        items: data.education.map((item) => ({
          id: item.id,
          title: join(', ', [item.institution, item.degree]),
          meta: clean(item.period),
          bullets: [],
        })),
      } as const
    case 'certifications':
      return {
        kind: 'items',
        items: data.certifications.map((item) => ({
          id: item.id,
          title: join(', ', [item.name, item.issuer]),
          meta: clean(item.year),
          bullets: [],
        })),
      } as const
  }
}

/** The sheet for a draft; `headings` come from the CV language (`getCvLanguage`). */
export function toSheet(draft: CvData, headings: Record<CvSection, string>): SheetLayout {
  const data = dropEmptyItems(draft)
  const { fullName, email, phone, location, links } = data.contacts
  return {
    name: clean(fullName),
    contacts: join(' · ', [email, phone, location, ...links]),
    blocks: data.sectionOrder
      .filter((section) => !isSectionEmpty(data, section))
      .map((section) => ({ section, heading: headings[section], ...body(data, section) })),
  }
}
