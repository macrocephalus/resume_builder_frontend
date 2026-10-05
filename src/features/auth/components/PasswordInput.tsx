import { useState, type ComponentProps } from 'react'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'

/** A password input with a show / hide button. */
export function PasswordInput(props: Omit<ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="flex items-center gap-1">
      <Input type={visible ? 'text' : 'password'} {...props} />
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={visible}
        aria-label="Show password"
        onClick={() => setVisible(!visible)}
      >
        {visible ? 'Hide' : 'Show'}
      </Button>
    </div>
  )
}
