// The only file that spells URLs: route patterns, link builders and API endpoints.

/** Path patterns for the route table. */
export const routes = {
  cvList: '/',
  login: '/login',
  signup: '/signup',
} as const

/**
 * A return address is accepted only as a path on this site: it starts with one `/`, so
 * `//evil.example` and `https://evil.example` are refused.
 */
const isSitePath = (path: string) =>
  path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\')

export function safeNext(next: string | null | undefined): string | null {
  if (!next || !isSitePath(next)) return null
  const base = 'http://app.invalid'
  const url = new URL(next, base)
  const path = url.pathname + url.search + url.hash
  // Checked again after normalising: `/.//evil.example` becomes `//evil.example`.
  return url.origin === base && isSitePath(path) ? path : null
}

function withNext(path: string, next: string | null | undefined): string {
  const target = safeNext(next)
  return target && target !== routes.cvList ? `${path}?next=${encodeURIComponent(target)}` : path
}

/** Links and redirect targets. */
export const paths = {
  cvList: () => routes.cvList,
  login: (next?: string | null) => withNext(routes.login, next),
  signup: (next?: string | null) => withNext(routes.signup, next),
}

export const apiPaths = {
  signup: '/api/auth/signup',
  login: '/api/auth/login',
  logout: '/api/auth/logout',
  me: '/api/auth/me',
} as const
