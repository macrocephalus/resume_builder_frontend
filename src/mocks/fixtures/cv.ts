import type { CvData, CvStatus, Question, Requirement } from '@cv/shared'
import { DEFAULT_SECTION_ORDER, hasDraft, type Cv } from '@cv/shared'
import { updateDb, type MockUser } from '@/mocks/store'

/** A small draft; the full eight-block fixture arrives with generation. */
export const sampleDraft = (): CvData => ({
  contacts: {
    fullName: 'Olena Hnatiuk',
    email: 'olena@example.com',
    phone: null,
    location: 'Kyiv',
    links: [],
  },
  summary: 'Backend engineer with six years of Node.js and PostgreSQL.',
  experience: [
    {
      id: crypto.randomUUID(),
      title: 'Backend Engineer',
      company: 'Fintory',
      period: '2019 – present',
      bullets: ['Built the payments API on Node.js'],
    },
  ],
  projects: [],
  education: [],
  certifications: [],
  skills: ['Node.js', 'PostgreSQL'],
  languages: [],
  sectionOrder: [...DEFAULT_SECTION_ORDER],
})

const sampleRequirements = (): Requirement[] => [
  { id: crypto.randomUUID(), label: 'Node.js', kind: 'skill', keywords: ['node.js', 'node'] },
  { id: crypto.randomUUID(), label: 'Kubernetes', kind: 'skill', keywords: ['kubernetes', 'k8s'] },
]

const openQuestion = (label: string, field: string): Question => ({
  id: crypto.randomUUID(),
  kind: 'text',
  origin: 'auto',
  text: `What is your ${label.toLowerCase()}?`,
  label,
  options: [],
  claim: null,
  target: { section: 'contacts', field },
  status: 'open',
  answer: null,
})

/** A CV in `status`, with the fields that status carries (docs/cv-statuses.md). */
export function buildCv(status: CvStatus, overrides: Partial<Cv> = {}): Cv {
  const now = new Date().toISOString()
  const targetRole = overrides.targetRole ?? 'Senior Backend Engineer'
  return {
    id: crypto.randomUUID(),
    status,
    stage: status === 'generating' ? 'drafting' : null,
    attempt: status === 'retrying' ? 2 : 1,
    maxAttempts: 3,
    queuePosition: status === 'queued' ? 1 : null,
    errorCode: status === 'failed' ? 'LLM_UNAVAILABLE' : null,
    error:
      status === 'failed'
        ? 'The AI service is unavailable right now. Try again in a few minutes.'
        : null,
    updatedAt: now,
    title: targetRole,
    targetRole,
    roleContext: null,
    language: 'en',
    sourceType: 'text',
    sourceFilename: null,
    data: hasDraft(status) ? sampleDraft() : null,
    version: hasDraft(status) ? 1 : 0,
    requirements: hasDraft(status) ? sampleRequirements() : [],
    suggestedRoles: [],
    verification: null,
    questions:
      status === 'needs_input'
        ? [openQuestion('Phone', 'phone'), openQuestion('Location', 'location')]
        : [],
    createdAt: now,
    ...overrides,
  }
}

/** Stores a CV of `owner`, for tests and demos. */
export function seedCv(owner: MockUser, status: CvStatus, overrides: Partial<Cv> = {}): Cv {
  const cv = buildCv(status, overrides)
  updateDb((db) => db.cvs.push({ ownerId: owner.id, cv }))
  return cv
}
