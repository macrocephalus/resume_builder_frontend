import { authHandlers } from '@/mocks/handlers/auth'
import { cvHandlers } from '@/mocks/handlers/cvs'
import { ingestHandlers } from '@/mocks/handlers/ingest'
import { questionHandlers } from '@/mocks/handlers/questions'
import { usageHandlers } from '@/mocks/handlers/usage'

/** Every mock API handler: mock mode in the browser and the tests both use this list. */
export const handlers = [
  ...authHandlers,
  ...cvHandlers,
  ...questionHandlers,
  ...ingestHandlers,
  ...usageHandlers,
]
