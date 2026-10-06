import { CreateCvForm } from '@/features/cv-create/components/CreateCvForm'

export function CvCreateScreen() {
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <h1>New CV</h1>
      <CreateCvForm />
    </div>
  )
}
