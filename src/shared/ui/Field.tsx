import { useId, type ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'

/** Props a control inside a `Field` must spread on itself. */
export type FieldControlProps = {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: true
}

type FieldProps = {
  /** Text, plus an optional marker (like "missing") that becomes part of the name. */
  label: ReactNode
  hint?: string
  /** Shown under the control and announced with it. */
  error?: string
  className?: string
  children: (control: FieldControlProps) => ReactNode
}

/**
 * A label, an optional hint and an error around one control, wired by ids. The text is `ink`
 * (`bad` for the error), so a field reads the same on a solid panel and on glass.
 */
export function Field({ label, hint, error, className, children }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ')

  return (
    <div className={cx('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-ink">
        {label}
      </label>
      {children({
        id,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : undefined,
      })}
      {hint ? (
        <p id={hintId} className="text-[12.5px] text-ink">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-[13px] text-bad">
          {error}
        </p>
      ) : null}
    </div>
  )
}
