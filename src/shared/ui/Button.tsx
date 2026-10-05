import type { ComponentProps } from 'react'
import { cx } from '@/shared/lib/cx'
import { buttonClasses, type ButtonLook } from '@/shared/ui/buttonClasses'

type ButtonProps = ComponentProps<'button'> &
  ButtonLook & {
    /** A request started by this button is running: it is disabled and says so to screen readers. */
    pending?: boolean
  }

export function Button({
  variant,
  size,
  block,
  pending = false,
  disabled,
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={cx(buttonClasses({ variant, size, block }), className)}
      {...props}
    >
      {children}
    </button>
  )
}
