import { authHandlers } from '@/mocks/handlers/auth'
import { cvHandlers } from '@/mocks/handlers/cvs'

/** Every mock API handler: mock mode in the browser and the tests both use this list. */
export const handlers = [...authHandlers, ...cvHandlers]
