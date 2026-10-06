/** How long the browser may take to read the file after the click. */
const KEEP_URL_MS = 60_000

/**
 * Hands a file to the browser's downloads through a temporary `<a download>`. The object URL
 * lives on for a while: Safari on iOS reads it after the click returns, and revoking it at once
 * cancels the download there.
 */
export function saveFile(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.hidden = true
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), KEEP_URL_MS)
}
