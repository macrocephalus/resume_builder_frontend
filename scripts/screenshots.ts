// Captures every listed screen at phone and desktop width into .scratch/screens/.
// Run with `pnpm screenshots`; needs Chromium once: `pnpm exec playwright install chromium`.
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const screens = [{ name: 'home', path: '/' }]
const widths = [390, 1280]
const outDir = fileURLToPath(new URL('../.scratch/screens/', import.meta.url))

const server = await createServer({ logLevel: 'error' })
await server.listen()
const baseUrl = server.resolvedUrls?.local[0]
if (!baseUrl) throw new Error('The dev server did not report a local URL')
const origin = new URL(baseUrl).origin

const browser = await chromium.launch()
const offOrigin = new Set<string>()

try {
  await mkdir(outDir, { recursive: true })

  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 844 } })
    page.on('request', (request) => {
      const url = new URL(request.url())
      if (url.protocol.startsWith('http') && url.origin !== origin) offOrigin.add(request.url())
    })

    for (const screen of screens) {
      await page.goto(new URL(screen.path, baseUrl).href, { waitUntil: 'networkidle' })
      await page.evaluate('document.fonts.ready')
      const file = `${outDir}${screen.name}-${width}.png`
      await page.screenshot({ path: file, fullPage: true })
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
