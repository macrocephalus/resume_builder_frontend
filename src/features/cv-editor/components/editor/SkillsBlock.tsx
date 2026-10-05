import { CV_LIMITS } from '@cv/shared'
import { Plus } from 'lucide-react'
import { useRef, useState, type KeyboardEvent } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { Button } from '@/shared/ui/Button'
import { Chip } from '@/shared/ui/Chip'
import { Field } from '@/shared/ui/Field'
import { Input } from '@/shared/ui/Input'
import { MetaLine } from '@/shared/ui/MetaLine'
import { EditorBlock, type BlockMove } from '@/features/cv-editor/components/editor/EditorBlock'
import type { DraftFormValues } from '@/features/cv-editor/model/draftForm'

/** Skills as chips: type one and press Enter or Add; remove one with its ✕. */
export function SkillsBlock({ move }: { move: BlockMove }) {
  const { control } = useFormContext<DraftFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'skills' })
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string>()
  const full = fields.length >= CV_LIMITS.skills

  const add = () => {
    const value = input.current?.value.trim() ?? ''
    if (value === '') return
    if (value.length > CV_LIMITS.skill) {
      setError(`Use at most ${CV_LIMITS.skill} characters`)
      return
    }
    setError(undefined)
    if (input.current) input.current.value = ''
    // Already on the list: nothing to add.
    if (fields.some((skill) => skill.value.toLowerCase() === value.toLowerCase())) return
    append({ value }, { shouldFocus: false })
  }

  const addOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    // Enter adds the skill instead of saving the form.
    event.preventDefault()
    add()
  }

  return (
    <EditorBlock title="Skills" missing="skills" move={move}>
      {fields.length === 0 ? (
        <MetaLine>No skills yet.</MetaLine>
      ) : (
        <ul aria-label="Your skills" className="flex flex-wrap gap-2">
          {fields.map((skill, index) => (
            <li key={skill.id} className="max-w-full">
              <Chip removeLabel={`Remove ${skill.value}`} onRemove={() => remove(index)}>
                {skill.value}
              </Chip>
            </li>
          ))}
        </ul>
      )}
      <Field
        label="Add a skill"
        hint={full ? `Up to ${CV_LIMITS.skills} skills.` : undefined}
        error={error}
      >
        {(control) => (
          <div className="flex gap-2">
            <Input
              {...control}
              ref={input}
              disabled={full}
              autoComplete="off"
              enterKeyHint="done"
              onKeyDown={addOnEnter}
            />
            <Button variant="secondary" disabled={full} onClick={add}>
              <Plus size={16} aria-hidden="true" />
              Add
            </Button>
          </div>
        )}
      </Field>
    </EditorBlock>
  )
}
