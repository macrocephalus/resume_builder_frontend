import { get, useFormContext, useFormState, type FieldPath } from 'react-hook-form'
import { Field } from '@/shared/ui/Field'
import { Input } from '@/shared/ui/Input'
import { Textarea } from '@/shared/ui/Textarea'
import { MissingMark } from '@/features/cv-editor/components/editor/MissingMark'
import type { DraftFormValues } from '@/features/cv-editor/model/draftForm'

type TextFieldProps = {
  name: FieldPath<DraftFormValues>
  label: string
  hint?: string
  /** A text area; `rows` sets its height. */
  rows?: number
  /** The key of `missingParts` that marks this field. */
  missing?: string
  type?: 'text' | 'email' | 'tel'
  autoComplete?: string
  /** Spans both columns of a two-column grid. */
  wide?: boolean
}

/** One registered field of the editor, with its own error. */
export function TextField({
  name,
  label,
  hint,
  rows,
  missing,
  type,
  autoComplete,
  wide,
}: TextFieldProps) {
  const { register } = useFormContext<DraftFormValues>()
  // Subscribes to this field's error only.
  const { errors } = useFormState<DraftFormValues>({ name, exact: true })
  const error: unknown = get(errors, name)?.message

  return (
    <Field
      label={
        <span className="inline-flex flex-wrap items-center gap-2">
          {/* The space keeps "Email missing" two words in the accessible name. */}
          {label} {missing ? <MissingMark part={missing} /> : null}
        </span>
      }
      hint={hint}
      error={typeof error === 'string' ? error : undefined}
      className={wide ? 'md:col-span-2' : undefined}
    >
      {(control) =>
        rows ? (
          <Textarea {...control} {...register(name)} rows={rows} />
        ) : (
          <Input {...control} {...register(name)} type={type} autoComplete={autoComplete} />
        )
      }
    </Field>
  )
}
