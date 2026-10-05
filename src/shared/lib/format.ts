const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

/** An ISO timestamp as a date and time in the device locale and time zone. */
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso))
}

/** A `Retry-After` in seconds as whole minutes to wait: "1 minute", "15 minutes". */
export function formatWait(seconds: number | null): string {
  const count = Math.max(1, Math.ceil((seconds ?? 60) / 60))
  return count === 1 ? '1 minute' : `${count} minutes`
}
