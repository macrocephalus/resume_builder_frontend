/** The first paint while the first screen's data loads: grey bars where content will be. */
export function PageSkeleton() {
  return (
    <output aria-label="Loading" className="flex flex-col">
      <div className="min-h-14 border-b border-line bg-surface" />
      <div className="mx-auto flex w-full max-w-page flex-col gap-4 px-4 py-6 lg:px-6">
        <div className="h-8 w-48 rounded-sm bg-line motion-safe:animate-pulse" />
        <div className="h-20 rounded-md bg-surface motion-safe:animate-pulse" />
        <div className="h-20 rounded-md bg-surface motion-safe:animate-pulse" />
      </div>
    </output>
  )
}
