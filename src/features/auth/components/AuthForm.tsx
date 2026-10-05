import { credentialsSchema, type Credentials } from '@cv/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { paths, safeNext } from '@/shared/config/paths'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { GlassCard } from '@/shared/ui/GlassCard'
import { Input } from '@/shared/ui/Input'
import { Notice } from '@/shared/ui/Notice'
import { useLogin } from '@/features/auth/api/useLogin'
import { useSignup } from '@/features/auth/api/useSignup'
import { PasswordInput } from '@/features/auth/components/PasswordInput'
import { authFailure, credentialsIssueText } from '@/features/auth/model/authForm'

type Mode = 'login' | 'signup'

type Copy = {
  title: string
  submit: string
  passwordAutoComplete: 'current-password' | 'new-password'
  passwordHint?: string
  switchText: string
  switchLink: string
  switchTo: (next: string | null) => string
}

const copy: Record<Mode, Copy> = {
  login: {
    title: 'Log in',
    submit: 'Log in',
    passwordAutoComplete: 'current-password',
    switchText: 'No account yet?',
    switchLink: 'Sign up',
    switchTo: paths.signup,
  },
  signup: {
    title: 'Sign up',
    submit: 'Create account',
    passwordAutoComplete: 'new-password',
    passwordHint: 'At least 8 characters.',
    switchText: 'Already have an account?',
    switchLink: 'Log in',
    switchTo: paths.login,
  },
}

export function AuthForm({ mode }: { mode: Mode }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = safeNext(searchParams.get('next'))
  const login = useLogin()
  const signup = useSignup()
  const mutation = mode === 'login' ? login : signup
  const text = copy[mode]

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<z.input<typeof credentialsSchema>, unknown, Credentials>({
    resolver: zodResolver(credentialsSchema, { error: credentialsIssueText }),
    defaultValues: { email: '', password: '' },
  })

  const submit = handleSubmit((values) =>
    mutation.mutate(values, {
      onSuccess: () => navigate(next ?? paths.cvList(), { replace: true }),
      onError: (error) => {
        const failure = authFailure(error)
        if (failure.field)
          setError(failure.field, { message: failure.message }, { shouldFocus: true })
        else setError('root', { message: failure.message })
      },
    }),
  )

  return (
    <GlassCard aria-labelledby="auth-title">
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <h1 id="auth-title">{text.title}</h1>
        {errors.root?.message ? (
          <Notice tone="bad" role="alert">
            {errors.root.message}
          </Notice>
        ) : null}
        <Field label="Email" error={errors.email?.message}>
          {(control) => (
            <Input
              {...control}
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
            />
          )}
        </Field>
        <Field label="Password" hint={text.passwordHint} error={errors.password?.message}>
          {(control) => (
            <PasswordInput
              {...control}
              {...register('password')}
              autoComplete={text.passwordAutoComplete}
            />
          )}
        </Field>
        <Button type="submit" block pending={mutation.isPending}>
          {text.submit}
        </Button>
        <p className="flex flex-wrap items-center justify-center gap-1">
          <span>{text.switchText}</span>
          <Link to={text.switchTo(next)}>{text.switchLink}</Link>
        </p>
      </form>
    </GlassCard>
  )
}
