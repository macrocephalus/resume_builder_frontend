import { Link } from 'react-router'
import { paths } from '@/shared/config/paths'

export function NotFound() {
  return (
    <section className="flex flex-col items-start gap-3">
      <h1>Page not found</h1>
      <p>This page does not exist, or the link is broken.</p>
      <Link to={paths.cvList()}>Go to My CVs</Link>
    </section>
  )
}
