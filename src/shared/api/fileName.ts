const EXTENDED = /filename\*\s*=\s*utf-8'[^']*'([^;\s]+)/i
const QUOTED = /filename\s*=\s*"((?:[^"\\]|\\.)*)"/i
const TOKEN = /filename\s*=\s*([^;\s"]+)/i

function extendedName(header: string): string | null {
  const encoded = EXTENDED.exec(header)?.[1]
  if (!encoded) return null
  try {
    return decodeURIComponent(encoded)
  } catch {
    return null
  }
}

/**
 * The file name a `Content-Disposition` header gives: the UTF-8 `filename*` first, then
 * `filename`; only its last path part, since a name is not a place to save to.
 */
export function fileNameFrom(header: string | null, fallback: string): string {
  if (!header) return fallback
  const name =
    extendedName(header) ??
    QUOTED.exec(header)?.[1]?.replace(/\\(.)/g, '$1') ??
    TOKEN.exec(header)?.[1] ??
    ''
  return name.split(/[/\\]/).at(-1)?.trim() || fallback
}
