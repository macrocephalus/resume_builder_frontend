import { cx } from '@/shared/lib/cx'

const shape = 'absolute rounded-full opacity-70 blur-3xl'
// The shapes drift while an element with `data-backdrop="drift"` is on the page (the generation
// panel). CSS only, so no state connects that panel and this layer.
const driftA = 'motion-safe:[:root:has([data-backdrop=drift])_&]:animate-drift-a'
const driftB = 'motion-safe:[:root:has([data-backdrop=drift])_&]:animate-drift-b'

export function Backdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg"
    >
      <div className={cx(shape, driftA, '-top-32 -left-32 size-96 bg-blob-1 lg:size-160')} />
      <div className={cx(shape, driftB, 'top-1/4 -right-40 size-88 bg-blob-2 lg:size-144')} />
      <div className={cx(shape, driftB, 'top-1/2 -left-24 size-80 bg-blob-3 lg:size-128')} />
      <div className={cx(shape, driftA, '-right-24 -bottom-32 size-96 bg-blob-4 lg:size-160')} />
      <div className={cx(shape, driftA, '-bottom-40 left-1/3 size-80 bg-blob-5 lg:size-128')} />
    </div>
  )
}
