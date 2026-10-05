import { StepList } from '@/shared/ui/StepList'
import { AuthForm } from '@/features/auth/components/AuthForm'

const steps = [
  'Upload a PDF or describe your experience in your own words, and name the target role.',
  'The CV is generated in the background: close the page and come back later.',
  'Anything your text does not say comes back as a question, never invented.',
  'Edit any field and download an A4 PDF.',
]

export function AuthScreen({ mode }: { mode: 'login' | 'signup' }) {
  return (
    <main className="mx-auto grid w-full max-w-page gap-10 px-4 py-8 lg:grid-cols-2 lg:items-start lg:px-6 lg:py-16">
      <div className="mx-auto w-full max-w-md lg:mx-0">
        <AuthForm mode={mode} />
      </div>
      <section aria-labelledby="how-it-works" className="hidden flex-col gap-4 lg:flex">
        <h2 id="how-it-works">AI CV Builder: a CV for the role you want</h2>
        <StepList steps={steps} />
      </section>
    </main>
  )
}
