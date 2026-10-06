// Captures every listed screen at phone and desktop width into .scratch/screens/, in mock mode.
// Run with `pnpm screenshots`; needs Chromium once: `pnpm exec playwright install chromium`.
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium, type Page } from 'playwright'
import { createServer } from 'vite'

type Screen = {
  name: string
  path: string
  signedIn?: boolean
  /** Create a CV for this role through the form first, and wait for this text on its page. */
  create?: { role: string; waitFor: string }
  /** What to do on the page before the screenshot. */
  act?: (page: Page) => Promise<void>
  /** Only the viewport, so sticky bars show where a user sees them. */
  viewportOnly?: boolean
}

const screens: Screen[] = [
  { name: 'login', path: '/login' },
  { name: 'signup', path: '/signup' },
  { name: 'my-cvs', path: '/', signedIn: true },
  { name: 'not-found', path: '/no-such-page', signedIn: true },
  { name: 'new-cv', path: '/cvs/new', signedIn: true },
  {
    name: 'cv-generating',
    path: '/cvs/new',
    signedIn: true,
    create: { role: 'Senior Backend Engineer', waitFor: 'Writing your CV' },
  },
  {
    name: 'cv-failed',
    path: '/cvs/new',
    signedIn: true,
    create: { role: 'Fail Engineer', waitFor: 'The AI service is unavailable' },
  },
  {
    name: 'cv-editor',
    path: '/cvs/new',
    signedIn: true,
    create: { role: 'Senior Backend Engineer', waitFor: '4 open questions' },
  },
  {
    name: 'cv-editor-unsaved',
    path: '/',
    signedIn: true,
    act: async (page) => {
      await page.getByRole('link', { name: 'Open' }).first().click()
      await page.getByLabel('About you').fill('Backend engineer with six years of Node.js.')
    },
    viewportOnly: true,
  },
  {
    name: 'cv-pdf',
    path: '/',
    signedIn: true,
    act: async (page) => {
      await page.getByRole('link', { name: 'Open' }).first().click()
      await page.getByLabel('About you').fill('')
      // The download sits in the header: back to the top, where the note shows.
      await page.evaluate('window.scrollTo(0, 0)')
    },
    viewportOnly: true,
  },
  {
    name: 'cv-questions',
    path: '/',
    signedIn: true,
    act: async (page) => {
      await page.getByRole('link', { name: 'Open' }).first().click()
      await page.getByLabel('CV title').waitFor()
      const questions = page.getByRole('button', { name: /^Questions/ })
      // From 980 px the questions are already open next to the editor.
      if (await questions.isVisible()) await questions.click()
      await page.getByRole('button', { name: 'Kafka' }).click()
    },
  },
  {
    name: 'cv-match',
    path: '/',
    signedIn: true,
    act: async (page) => {
      await page.getByRole('link', { name: 'Open' }).first().click()
      await page.getByRole('button', { name: 'Match' }).click()
      await page.getByRole('region', { name: 'Match' }).waitFor()
    },
  },
  {
    name: 'cv-preview',
    path: '/',
    signedIn: true,
    act: async (page) => {
      await page.getByRole('link', { name: 'Open' }).first().click()
      await page.getByRole('button', { name: 'Preview' }).click()
    },
  },
]
const widths = [390, 1280]
const screenHeight = 844
const outDir = fileURLToPath(new URL('../.scratch/screens/', import.meta.url))

const server = await createServer({ mode: 'mock', logLevel: 'error' })
await server.listen()
const baseUrl = server.resolvedUrls?.local[0]
if (!baseUrl) throw new Error('The dev server did not report a local URL')
const origin = new URL(baseUrl).origin

const browser = await chromium.launch()
const offOrigin = new Set<string>()

const sampleExperience =
  'Backend engineer with six years of Node.js and PostgreSQL at Fintory; built the payments API. '

/** Signs up a fresh user through the UI; the mock keeps the session in this page's storage. */
/**
 * Makes the window as tall as the page, so one shot shows all of it. Playwright's `fullPage`
 * draws fixed and sticky layers one screen tall: the backdrop would end there and the bars would
 * hang in the middle of the picture.
 */
async function growToPage(page: Page, width: number) {
  // Growing the window can change what depends on its height; measure until it settles.
  for (let tries = 0; tries < 3; tries++) {
    const height = Number(await page.evaluate('document.documentElement.scrollHeight'))
    if (height === page.viewportSize()?.height) return
    await page.setViewportSize({ width, height })
  }
}

async function signUp(page: Page) {
  await page.goto(new URL('/signup', baseUrl).href)
  await page.getByLabel('Email', { exact: true }).fill('ann@example.com')
  await page.getByLabel('Password', { exact: true }).fill('correct-horse')
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.getByRole('heading', { name: 'My CVs' }).waitFor()
}

try {
  await mkdir(outDir, { recursive: true })

  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: screenHeight } })
    page.on('request', (request) => {
      const url = new URL(request.url())
      if (url.protocol.startsWith('http') && url.origin !== origin) offOrigin.add(request.url())
    })

    for (const screen of screens) {
      if (screen.signedIn && !(await page.getByRole('button', { name: 'Log out' }).count())) {
        await signUp(page)
      }
      await page.goto(new URL(screen.path, baseUrl).href, { waitUntil: 'networkidle' })
      if (screen.create) {
        await page.getByLabel('Target role').fill(screen.create.role)
        await page.getByLabel('Your experience').fill(sampleExperience)
        await page.getByRole('button', { name: 'Create CV' }).click()
        // The fake worker takes one CV at a time, so a CV may wait for the one before it.
        await page.getByText(screen.create.waitFor).waitFor({ timeout: 45_000 })
      }
      await screen.act?.(page)
      await page.evaluate('document.fonts.ready')
      const file = `${outDir}${screen.name}-${width}.png`
      if (!screen.viewportOnly) await growToPage(page, width)
      await page.screenshot({ path: file, animations: 'disabled' })
      await page.setViewportSize({ width, height: screenHeight })
      console.log(file)
    }

    await page.close()
  }
} finally {
  await browser.close()
  await server.close()
}

// Fonts and assets are self-hosted: nothing may be fetched from another origin.
if (offOrigin.size > 0) {
  throw new Error(`Requests left the origin:\n${[...offOrigin].join('\n')}`)
}
