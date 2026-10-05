import { useQuery } from '@tanstack/react-query'
import { Link, useNavigation } from 'react-router'
import { errorText } from '@/shared/api/errorText'
import { paths } from '@/shared/config/paths'
import { Button } from '@/shared/ui/Button'
import { authQueries } from '@/features/auth/api/authQueries'
import { useLogout } from '@/features/auth/api/useLogout'

export function TopBar() {
  const { data: email } = useQuery({ ...authQueries.me(), select: (user) => user?.email })
  const logout = useLogout()
  const loading = useNavigation().state === 'loading'

  return (
    <header className="sticky top-0 z-10 border-b glass">
      <div className="mx-auto flex min-h-14 max-w-page items-center gap-3 px-4 lg:px-6">
        <Link
          to={paths.cvList()}
          className="grow font-display text-sm font-semibold text-ink no-underline"
        >
          AI CV Builder
        </Link>
        {email ? (
          <span className="min-w-0 truncate font-mono text-xs text-ink">{email}</span>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          pending={logout.isPending}
          onClick={() => logout.mutate()}
        >
          Log out
        </Button>
      </div>
      {logout.isError ? (
        <p
          role="alert"
          className="mx-auto max-w-page px-4 pb-2 text-right text-sm text-ink lg:px-6"
        >
          Could not log out. {errorText(logout.error)}
        </p>
      ) : null}
      {loading ? (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-accent motion-safe:animate-pulse"
        />
      ) : null}
    </header>
  )
}
