import { cx } from '@/shared/lib/cx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'md' | 'sm'

const variants: Record<ButtonVariant, string> = {
  primary: 'border-accent bg-accent text-on-accent hover:brightness-110',
  secondary: 'border-line-strong bg-surface text-ink hover:border-ink',
  ghost: 'border-transparent bg-transparent text-accent hover:underline',
  danger: 'border-bad bg-transparent text-bad hover:bg-bad-soft',
}

const sizes: Record<ButtonSize, string> = {
  md: 'min-h-10 px-4 py-2 text-[15px]',
  sm: 'min-h-10 px-2.5 py-1 text-sm',
}

export type ButtonLook = {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Full width. */
  block?: boolean
}

/** The button look, shared with `ButtonLink`. */
export function buttonClasses({ variant = 'primary', size = 'md', block = false }: ButtonLook) {
  return cx(
    'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-sm border text-center font-medium no-underline disabled:cursor-default disabled:opacity-55 motion-safe:transition',
    variants[variant],
    sizes[size],
    block && 'w-full',
  )
}
