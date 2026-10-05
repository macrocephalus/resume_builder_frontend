import { useState, type ReactNode } from 'react'
import { Button } from '@/shared/ui/Button'

type ConfirmButtonProps = {
  /** The first button: "Delete". */
  children: ReactNode
  /** The second step: "Delete for good". */
  confirmLabel: string
  onConfirm: () => void
  /** The confirmed action is running. */
  pending?: boolean
}

type Step = 'idle' | 'asking' | 'back'

const focus = (node: HTMLButtonElement | null) => node?.focus()

/**
 * A two-step inline confirm: the first press asks, the second does it. Cancel comes first and
 * takes focus, so a double click or a double Enter lands on Cancel, never on the action. Leaving
 * the second step puts focus back on the first button.
 */
export function ConfirmButton({
  children,
  confirmLabel,
  onConfirm,
  pending = false,
}: ConfirmButtonProps) {
  const [step, setStep] = useState<Step>('idle')

  if (step === 'asking' || pending) {
    return (
      <span className="inline-flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          ref={focus}
          disabled={pending}
          onClick={() => setStep('back')}
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          size="sm"
          pending={pending}
          onClick={() => {
            setStep('back')
            onConfirm()
          }}
        >
          {confirmLabel}
        </Button>
      </span>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      ref={step === 'back' ? focus : undefined}
      onClick={() => setStep('asking')}
    >
      {children}
    </Button>
  )
}
