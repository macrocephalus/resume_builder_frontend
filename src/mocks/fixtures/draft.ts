import {
  autoQuestionText,
  DEFAULT_SECTION_ORDER,
  type CvData,
  type CvLanguage,
  type Question,
  type Requirement,
} from '@cv/shared'

/** What the fake worker writes when a generation succeeds. */
export type GeneratedDraft = {
  data: CvData
  questions: Question[]
  requirements: Requirement[]
  suggestedRoles: string[]
  verification: {
    verified: number
    sentToConfirm: number
    skillsToConfirm: number
    cleared: number
  }
}

/**
 * One English backend-engineer CV with all eight blocks. With `withQuestions` it also has one open
 * question of each kind; the fields they ask about are left empty in the draft. The auto question
 * is worded in the CV language by the shared `autoQuestionText`, as the API words it.
 */
export function generatedDraft({
  withQuestions,
  language = 'en',
}: {
  withQuestions: boolean
  language?: CvLanguage
}): GeneratedDraft {
  const job = crypto.randomUUID()
  const english = crypto.randomUUID()

  const data: CvData = {
    contacts: {
      fullName: 'Olena Hnatiuk',
      email: 'olena.hnatiuk@example.com',
      phone: withQuestions ? null : '+380 67 123 45 67',
      location: 'Kyiv, Ukraine',
      links: ['github.com/olena-h', 'linkedin.com/in/olena-hnatiuk'],
    },
    summary:
      'Backend engineer with six years of Node.js and PostgreSQL in fintech. Built and ran the payments API of a card-issuing platform, and mentored three junior engineers.',
    experience: [
      {
        id: job,
        title: 'Senior Backend Engineer',
        company: 'Fintory',
        period: '2021 – present',
        bullets: [
          'Built the payments API on Node.js and PostgreSQL, serving 40 partner banks',
          'Moved card authorisations to an outbox pattern, removing lost-message incidents',
          'Mentored three junior engineers through their first production releases',
        ],
      },
      {
        id: crypto.randomUUID(),
        title: 'Backend Engineer',
        company: 'Kyivstar Digital',
        period: '2018 – 2021',
        bullets: [
          'Wrote the billing export service in TypeScript',
          'Cut the nightly report job from 3 hours to 20 minutes with batched SQL',
        ],
      },
    ],
    projects: [
      {
        id: crypto.randomUUID(),
        name: 'pg-outbox',
        period: '2023',
        url: 'github.com/olena-h/pg-outbox',
        bullets: ['Open-source transactional outbox for PostgreSQL and Node.js'],
      },
    ],
    education: [
      {
        id: crypto.randomUUID(),
        institution: 'Igor Sikorsky Kyiv Polytechnic Institute',
        degree: 'BSc in Computer Science',
        period: '2014 – 2018',
      },
    ],
    certifications: [
      {
        id: crypto.randomUUID(),
        name: 'AWS Certified Developer – Associate',
        issuer: 'Amazon Web Services',
        year: '2022',
      },
    ],
    skills: ['Node.js', 'TypeScript', 'PostgreSQL', 'Redis', 'Docker', 'REST API design'],
    languages: [
      { id: crypto.randomUUID(), name: 'Ukrainian', level: 'Native' },
      { id: english, name: 'English', level: withQuestions ? null : 'C1' },
    ],
    sectionOrder: [...DEFAULT_SECTION_ORDER],
  }

  const question = (fields: Omit<Question, 'id' | 'status' | 'answer'>): Question => ({
    id: crypto.randomUUID(),
    status: 'open',
    answer: null,
    ...fields,
  })

  const questions: Question[] = withQuestions
    ? [
        question({
          kind: 'text',
          origin: 'auto',
          ...autoQuestionText(data, { section: 'contacts', field: 'phone' }, language),
          options: [],
          claim: null,
          target: { section: 'contacts', field: 'phone' },
        }),
        question({
          kind: 'choice',
          origin: 'model',
          text: 'What is your level of English?',
          label: 'English',
          options: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native'],
          claim: null,
          target: { section: 'languages', itemId: english, field: 'level' },
        }),
        question({
          kind: 'multi',
          origin: 'verifier',
          text: 'Which of these have you worked with? Only what you tick goes into the CV.',
          label: 'Skills',
          options: ['Kubernetes', 'Kafka', 'gRPC'],
          claim: null,
          target: { section: 'skills' },
        }),
        question({
          kind: 'confirm',
          origin: 'verifier',
          text: 'Your text does not say this. Should it stay in the CV?',
          label: 'Fintory',
          options: [],
          claim: 'Cut payment latency by 40% with a read-through Redis cache',
          target: { section: 'experience', itemId: job, field: 'bullets' },
        }),
      ]
    : []

  const requirement = (
    label: string,
    kind: Requirement['kind'],
    keywords: string[],
  ): Requirement => ({
    id: crypto.randomUUID(),
    label,
    kind,
    keywords,
  })

  return {
    data,
    questions,
    requirements: [
      requirement('Node.js', 'skill', ['node.js', 'node']),
      requirement('PostgreSQL', 'skill', ['postgresql', 'postgres']),
      requirement('Kubernetes', 'skill', ['kubernetes', 'k8s']),
      requirement('Team leadership', 'experience', ['mentored', 'led', 'team lead']),
      requirement('Event-driven systems', 'experience', ['kafka', 'outbox', 'event-driven']),
    ],
    suggestedRoles: ['Node.js Tech Lead', 'Platform Engineer'],
    verification: {
      verified: 7,
      sentToConfirm: withQuestions ? 1 : 0,
      skillsToConfirm: withQuestions ? 3 : 0,
      cleared: withQuestions ? 2 : 0,
    },
  }
}
