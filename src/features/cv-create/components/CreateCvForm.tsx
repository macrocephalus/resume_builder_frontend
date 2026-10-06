import {
  API_LIMITS,
  CV_LANGUAGES,
  createCvBodySchema,
  DEFAULT_CV_LANGUAGE,
  type CreateCvBody,
  type Cv,
} from '@cv/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { paths } from '@/shared/config/paths'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { Input } from '@/shared/ui/Input'
import { Notice } from '@/shared/ui/Notice'
import { Panel } from '@/shared/ui/Panel'
import { Select } from '@/shared/ui/Select'
import { Textarea } from '@/shared/ui/Textarea'
import { useCreateCv } from '@/features/cv-create/api/useCreateCv'
import { PdfUpload } from '@/features/cv-create/components/PdfUpload'
import { SourceCounter } from '@/features/cv-create/components/SourceCounter'
import {
  createFailure,
  createIssueText,
  sourceTextLimits,
  type CreateFormInput,
} from '@/features/cv-create/model/createForm'

type CreateCvFormProps = {
  /** The target role to start with. */
  role: string
  /** The CV whose source and facts the new one reuses, instead of a text typed here. */
  parent?: Pick<Cv, 'id' | 'title' | 'language'>
}

/**
 * The New CV form: the role, a note on it, the CV language and the experience text. Made from
 * another CV, it has no experience text: the new CV reuses that CV's source and facts.
 */
export function CreateCvForm({ role, parent }: CreateCvFormProps) {
  const navigate = useNavigate()
  const create = useCreateCv()
  const {
    register,
    control,
    getValues,
    setValue,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateFormInput, unknown, CreateCvBody>({
    resolver: zodResolver(createCvBodySchema, { error: createIssueText }),
    defaultValues: {
      targetRole: role,
      roleContext: '',
      language: parent?.language ?? DEFAULT_CV_LANGUAGE,
      // The contract takes a text or a parent CV, never both.
      ...(parent ? { fromCvId: parent.id } : { sourceText: '' }),
      sourceType: 'text',
      sourceFilename: null,
    },
  })

  const submit = handleSubmit(({ roleContext, sourceType, sourceFilename, ...body }) =>
    create.mutate(
      {
        ...body,
        roleContext: roleContext || null,
        // From another CV the source is that CV's: where it came from is not this form's to say.
        ...(parent ? {} : { sourceType, sourceFilename }),
      },
      {
        onSuccess: (cv) => navigate(paths.cv(cv.id)),
        onError: (error) => {
          const failure = createFailure(error)
          if (failure.field)
            setError(failure.field, { message: failure.message }, { shouldFocus: true })
          else setError('root', { message: failure.message })
        },
      },
    ),
  )

  return (
    <Panel className="p-4 md:p-6">
      <form noValidate onSubmit={submit} className="flex flex-col gap-5">
        <Field
          label="Target role"
          hint="The position this CV is for, like “Senior Backend Engineer”."
          error={errors.targetRole?.message}
        >
          {(field) => <Input {...field} {...register('targetRole')} autoComplete="off" />}
        </Field>
        <Field
          label="About the role (optional)"
          hint="A short note or a pasted vacancy: focus, stack, seniority. It shapes the summary and the order; it is never used as facts about you."
          error={errors.roleContext?.message}
        >
          {(field) => <Textarea {...field} {...register('roleContext')} rows={4} />}
        </Field>
        <Field
          label="CV language"
          hint="The CV, its questions and its headings come in this language. Your text may be in any language."
          error={errors.language?.message}
        >
          {(field) => (
            <Select {...field} {...register('language')}>
              {CV_LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.nativeName}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {parent ? (
          <Notice>
            Made from your CV “{parent.title}”: the same background and the facts you confirmed
            there, aimed at the new role.
          </Notice>
        ) : (
          <div className="flex flex-col gap-1.5">
            <PdfUpload
              hasText={() => (getValues('sourceText') ?? '').trim() !== ''}
              onUse={(pdf) => {
                setValue('sourceText', pdf.text, { shouldDirty: true, shouldValidate: true })
                setValue('sourceType', 'pdf')
                // The name is for display only; the contract keeps it short.
                setValue('sourceFilename', pdf.filename.slice(0, API_LIMITS.sourceFilename))
              }}
            />
            <Field
              label="Your experience"
              hint={`Paste your CV or describe your work in your own words: roles, companies, dates, what you did. ${sourceTextLimits}.`}
              error={errors.sourceText?.message}
            >
              {(field) => <Textarea {...field} {...register('sourceText')} rows={12} />}
            </Field>
            <SourceCounter control={control} />
          </div>
        )}
        {errors.root?.message ? (
          <Notice tone="bad" role="alert">
            {errors.root.message}
          </Notice>
        ) : null}
        <div>
          <Button type="submit" pending={create.isPending}>
            Create CV
          </Button>
        </div>
      </form>
    </Panel>
  )
}
