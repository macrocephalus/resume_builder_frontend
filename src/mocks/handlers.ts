import { authHandlers } from '@/mocks/handlers/auth'
import { cvHandlers } from '@/mocks/handlers/cvs'
import { ingestHandlers } from '@/mocks/handlers/ingest'
import { questionHandlers } from '@/mocks/handlers/questions'

/** Every mock API handler: mock mode in the browser and the tests both use this list. */
export const handlers = [...authHandlers, ...cvHandlers, ...questionHandlers, ...ingestHandlers]
