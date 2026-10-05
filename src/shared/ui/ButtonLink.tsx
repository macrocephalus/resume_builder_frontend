import { Link, type LinkProps } from 'react-router'
import { cx } from '@/shared/lib/cx'
import { buttonClasses, type ButtonLook } from '@/shared/ui/buttonClasses'

type ButtonLinkProps = LinkProps & ButtonLook

/** A link that navigates, with the look of a `Button`. */
export function ButtonLink({ variant, size, block, className, ...props }: ButtonLinkProps) {
  return <Link className={cx(buttonClasses({ variant, size, block }), className)} {...props} />
}
