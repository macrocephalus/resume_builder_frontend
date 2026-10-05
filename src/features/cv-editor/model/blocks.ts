import type { ItemSection } from '@cv/shared'
import type { DraftFormValues } from '@/features/cv-editor/model/draftForm'

type Item<S extends ItemSection> = DraftFormValues[S][number]

export type ItemFieldConfig<S extends ItemSection> = {
  name: Exclude<keyof Item<S> & string, 'itemId'>
  label: string
  hint?: string
  /** One entry per line in a text area. */
  lines?: boolean
  /** The contract's missing rule may report this field (`findMissing`). */
  required?: boolean
}

export type ItemBlockConfig<S extends ItemSection> = {
  title: string
  /** Names one item: "Job" → "Job 2". */
  itemName: string
  add: string
  /** The contract's missing rule may report the whole block when it is empty. */
  required?: boolean
  /** Shown when the block has no items. */
  none: string
  fields: ItemFieldConfig<S>[]
  /** A new, empty item with a fresh id. */
  empty: () => Item<S>
}

const absent = 'An empty block stays out of the CV.'
const bullets = { label: 'What you did', hint: 'One point per line.', lines: true } as const

/** The labels and fields of each block made of items. */
export const itemBlocks: { [S in ItemSection]: ItemBlockConfig<S> } = {
  experience: {
    title: 'Experience',
    itemName: 'Job',
    required: true,
    add: 'Add job',
    none: `No jobs yet. ${absent}`,
    fields: [
      { name: 'title', label: 'Job title', required: true },
      { name: 'company', label: 'Company', required: true },
      { name: 'period', label: 'Period', hint: 'Like “2021 – present”.', required: true },
      { name: 'bullets', ...bullets },
    ],
    empty: () => ({ itemId: crypto.randomUUID(), title: '', company: '', period: '', bullets: '' }),
  },
  projects: {
    title: 'Projects',
    itemName: 'Project',
    add: 'Add project',
    none: `No projects yet. ${absent}`,
    fields: [
      { name: 'name', label: 'Name' },
      { name: 'period', label: 'Period' },
      { name: 'url', label: 'Link' },
      { name: 'bullets', ...bullets },
    ],
    empty: () => ({ itemId: crypto.randomUUID(), name: '', period: '', url: '', bullets: '' }),
  },
  education: {
    title: 'Education',
    itemName: 'Education',
    add: 'Add education',
    none: `No education yet. ${absent}`,
    fields: [
      { name: 'institution', label: 'School or university', required: true },
      { name: 'degree', label: 'Degree' },
      { name: 'period', label: 'Period' },
    ],
    empty: () => ({ itemId: crypto.randomUUID(), institution: '', degree: '', period: '' }),
  },
  certifications: {
    title: 'Certifications',
    itemName: 'Certificate',
    add: 'Add certificate',
    none: `No certificates yet. ${absent}`,
    fields: [
      { name: 'name', label: 'Name' },
      { name: 'issuer', label: 'Issuer' },
      { name: 'year', label: 'Year' },
    ],
    empty: () => ({ itemId: crypto.randomUUID(), name: '', issuer: '', year: '' }),
  },
  languages: {
    title: 'Languages',
    itemName: 'Language',
    add: 'Add language',
    none: `No languages yet. ${absent}`,
    fields: [
      { name: 'name', label: 'Language' },
      { name: 'level', label: 'Level', hint: 'Like “B2” or “Native”.' },
    ],
    empty: () => ({ itemId: crypto.randomUUID(), name: '', level: '' }),
  },
}
