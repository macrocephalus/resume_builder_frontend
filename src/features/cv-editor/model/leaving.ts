/** Navigation state that leaves the editor without asking about unsaved changes. */
export const discardEdits = { discardEdits: true } as const

export const isDiscardingEdits = (state: unknown) =>
  typeof state === 'object' && state !== null && 'discardEdits' in state
