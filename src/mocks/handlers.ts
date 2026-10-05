import { authHandlers } from '@/mocks/handlers/auth'
import { cvHandlers } from '@/mocks/handlers/cvs'
import { ingestHandlers } from '@/mocks/handlers/ingest'

/** Every mock API handler: mock mode in the browser and the tests both use this list. */
export const handlers = [...authHandlers, ...cvHandlers, ...ingestHandlers]
