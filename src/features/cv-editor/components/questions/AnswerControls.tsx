import { ANSWER_LIMITS, type Question } from '@cv/shared'
import { Chip } from '@/shared/ui/Chip'
import { Field } from '@/shared/ui/Field'
import { Input } from '@/shared/ui/Input'
import { OTHER, type AnswerDraft } from '@/features/cv-editor/model/questions'

type AnswerControlsProps = {
  question: Question
  draft: AnswerDraft
  onChange: (draft: AnswerDraft) => void
}

/** The inputs of a `text`, `choice` or `multi` question. */
export function AnswerControls({ question, draft, onChange }: AnswerControlsProps) {
  const picked = draft.picked ?? []

  if (question.kind === 'text') {
    return (
      <Field label="Your answer">
        {(control) => (
          <Input
            {...control}
            value={draft.text ?? ''}
            maxLength={ANSWER_LIMITS.text}
            autoComplete="off"
            onChange={(event) => onChange({ text: event.target.value })}
          />
        )}
      </Field>
    )
  }

  const multi = question.kind === 'multi'
  const toggle = (option: string) =>
    onChange({
      ...draft,
      picked: multi
        ? picked.includes(option)
          ? picked.filter((value) => value !== option)
          : [...picked, option]
        : [option],
    })

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {question.options.map((option) => (
          <Chip key={option} pressed={picked.includes(option)} onClick={() => toggle(option)}>
            {option}
          </Chip>
        ))}
        {multi ? null : (
          <Chip pressed={picked.includes(OTHER)} onClick={() => toggle(OTHER)}>
            Other
          </Chip>
        )}
      </div>
      {multi || picked.includes(OTHER) ? (
        <Field label={multi ? 'Other, comma-separated' : 'Your own answer'}>
          {(control) => (
            <Input
              {...control}
              value={draft.other ?? ''}
              maxLength={ANSWER_LIMITS.text}
              autoComplete="off"
              onChange={(event) => onChange({ ...draft, other: event.target.value })}
            />
          )}
        </Field>
      ) : null}
    </>
  )
}
