import { setupServer } from 'msw/node'
import { handlers } from '@/mocks/handlers'

/** The mock API for Vitest. */
export const server = setupServer(...handlers)
