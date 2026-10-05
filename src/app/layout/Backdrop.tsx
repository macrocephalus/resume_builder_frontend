import { useMatches } from 'react-router'
import { cx } from '@/shared/lib/cx'

function asksForDrift(handle: unknown): boolean {
  return (
    typeof handle === 'object' &&
    handle !== null &&
    'backdrop' in handle &&
    handle.backdrop === 'drift'
  )
}

const shape = 'absolute rounded-full opacity-70 blur-3xl'
const driftA = 'motion-safe:group-data-[motion=drift]:animate-drift-a'
const driftB = 'motion-safe:group-data-[motion=drift]:animate-drift-b'

export function Backdrop() {
  const drifts = useMatches().some((match) => asksForDrift(match.handle))

  return (
    <div
      aria-hidden="true"
      data-testid="backdrop"
      data-motion={drifts ? 'drift' : 'still'}
      className="group pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg"
    >
      <div className={cx(shape, driftA, '-top-32 -left-32 size-96 bg-blob-1 lg:size-160')} />
      <div className={cx(shape, driftB, 'top-1/4 -right-40 size-88 bg-blob-2 lg:size-144')} />
      <div className={cx(shape, driftB, 'top-1/2 -left-24 size-80 bg-blob-3 lg:size-128')} />
      <div className={cx(shape, driftA, '-right-24 -bottom-32 size-96 bg-blob-4 lg:size-160')} />
      <div className={cx(shape, driftA, '-bottom-40 left-1/3 size-80 bg-blob-5 lg:size-128')} />
    </div>
  )
}
