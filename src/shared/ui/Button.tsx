import type { ComponentProps } from 'react'
import { cx } from '@/shared/lib/cx'

type Variant = 'primary' | 'ghost' | 'danger'
type Size = 'md' | 'sm'

const variants: Record<Variant, string> = {
  primary: 'border-accent bg-accent text-on-accent hover:brightness-110',
  ghost: 'border-transparent bg-transparent text-accent hover:underline',
  danger: 'border-bad bg-transparent text-bad hover:bg-bad-soft',
}

const sizes: Record<Size, string> = {
  md: 'min-h-10 px-4 py-2 text-[15px]',
  sm: 'min-h-10 px-2.5 py-1 text-sm',
}

type ButtonProps = ComponentProps<'button'> & {
  variant?: Variant
  size?: Size
  /** Full width. */
  block?: boolean
  /** A request started by this button is running: it is disabled and says so to screen readers. */
  pending?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
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
      className={cx(
        'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-sm border text-center font-medium disabled:cursor-default disabled:opacity-55 motion-safe:transition',
        variants[variant],
        sizes[size],
        block && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
