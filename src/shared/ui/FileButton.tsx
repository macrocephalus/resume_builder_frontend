import type { ChangeEvent, ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'
import { buttonClasses, type ButtonLook } from '@/shared/ui/buttonClasses'

type FileButtonProps = ButtonLook & {
  /** The button text, which is also the input's label. */
  children: ReactNode
  /** File types the picker offers, as in `<input accept>`. */
  accept?: string
  onFile: (file: File) => void
  /** A request with the picked file is running. */
  pending?: boolean
}

/**
 * A file picker that looks like a `Button`: a native file input inside its label, so the keyboard,
 * screen readers and the phone's own picker all work. Picking the same file twice works too.
 */
export function FileButton({
  children,
  accept,
  onFile,
  pending = false,
  ...look
}: FileButtonProps) {
  const pick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file && !pending) onFile(file)
  }

  return (
    <label
      aria-busy={pending || undefined}
      className={cx(
        buttonClasses({ variant: 'secondary', ...look }),
        'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent',
        pending && 'pointer-events-none opacity-55',
      )}
    >
      {children}
      {/* aria-disabled, not disabled: the input keeps keyboard focus while the upload runs. */}
      <input
        type="file"
        accept={accept}
        aria-disabled={pending || undefined}
        onChange={pick}
        className="sr-only"
      />
    </label>
  )
}
