import '@testing-library/jest-dom/vitest'
import { File as NodeFile } from 'node:buffer'
import { cleanup, configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '@/mocks/server'
import { resetDb } from '@/mocks/store'

// jsdom replaces FormData and File with its own, which Node's fetch cannot send: an upload would
// arrive empty. Put Node's own back (its FormData class is reachable only through a parsed body).
const nodeFormData = await new Response(new URLSearchParams('probe=1')).formData()
globalThis.FormData = nodeFormData.constructor as typeof FormData
globalThis.File = NodeFile as unknown as typeof File

// The first screen of a test file loads its lazy route module, which can take more than the
// default second when many test files run at once.
configure({ asyncUtilTimeout: 5000 })

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))

afterEach(() => {
  cleanup()
  server.resetHandlers()
  resetDb()
})

afterAll(() => server.close())
