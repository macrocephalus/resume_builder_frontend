import { Button } from '@/shared/ui/Button'

type ErrorStateProps = {
  title: string
  message: string
  onRetry?: () => void
  /** The retry is running. */
  retrying?: boolean
}

/** A failed view with what went wrong and a Retry. */
export function ErrorState({ title, message, onRetry, retrying = false }: ErrorStateProps) {
  return (
    <section
      role="alert"
      className="flex flex-col items-start gap-3 rounded-md border border-line bg-surface p-6 text-ink"
    >
      <h1>{title}</h1>
      <p className="text-muted">{message}</p>
      {onRetry ? (
        <Button onClick={onRetry} pending={retrying}>
          Retry
        </Button>
      ) : null}
    </section>
  )
}
