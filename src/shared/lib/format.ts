const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

/** An ISO timestamp as a date and time in the device locale and time zone. */
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso))
}
