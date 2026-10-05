import { CV_LIMITS, type ItemSection } from '@cv/shared'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useFormContext, type FieldPath } from 'react-hook-form'
import { Button } from '@/shared/ui/Button'
import { Fieldset } from '@/shared/ui/Fieldset'
import { MetaLine } from '@/shared/ui/MetaLine'
import { EditorBlock, type BlockMove } from '@/features/cv-editor/components/editor/EditorBlock'
import { TextField } from '@/features/cv-editor/components/editor/TextField'
import { itemBlocks, type ItemBlockConfig } from '@/features/cv-editor/model/blocks'
import type { DraftFormValues } from '@/features/cv-editor/model/draftForm'

/** A block made of items (jobs, projects…): each can be edited, moved up or down and removed. */
export function ItemBlock({ section, move }: { section: ItemSection; move: BlockMove }) {
  // The configs differ per section; this component only reads what they have in common.
  const config = itemBlocks[section] as ItemBlockConfig<ItemSection>
  const { control } = useFormContext<DraftFormValues>()
  const { fields, append, remove, swap } = useFieldArray({ control, name: section })
  const limit = CV_LIMITS[section]

  return (
    <EditorBlock title={config.title} missing={config.required ? section : undefined} move={move}>
      {fields.length === 0 ? <MetaLine>{config.none}</MetaLine> : null}
      {fields.map((field, index) => (
        <Fieldset key={field.id} legend={`${config.itemName} ${index + 1}`}>
          <div className="grid gap-3 md:grid-cols-2">
            {config.fields.map((itemField) => (
              <TextField
                key={itemField.name}
                name={`${section}.${index}.${itemField.name}` as FieldPath<DraftFormValues>}
                label={itemField.label}
                hint={itemField.hint}
                rows={itemField.lines ? 4 : undefined}
                missing={
                  itemField.required ? `${section}.${field.itemId}.${itemField.name}` : undefined
                }
                wide={itemField.lines}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              aria-label="Move up"
              className="min-w-10"
              disabled={index === 0}
              onClick={() => swap(index, index - 1)}
            >
              <ArrowUp size={16} aria-hidden="true" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              aria-label="Move down"
              className="min-w-10"
              disabled={index === fields.length - 1}
              onClick={() => swap(index, index + 1)}
            >
              <ArrowDown size={16} aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => remove(index)}>
              <Trash2 size={16} aria-hidden="true" />
              Remove
            </Button>
          </div>
        </Fieldset>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          disabled={fields.length >= limit}
          onClick={() => append(config.empty())}
        >
          <Plus size={16} aria-hidden="true" />
          {config.add}
        </Button>
        {fields.length >= limit ? <MetaLine>Up to {limit} in this block.</MetaLine> : null}
      </div>
    </EditorBlock>
  )
}
