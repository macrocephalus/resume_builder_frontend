import { CV_LIMITS } from '@cv/shared'
import { sectionTitles } from '@/features/cv-editor/model/blocks'
import { EditorBlock } from '@/features/cv-editor/components/editor/EditorBlock'
import { TextField } from '@/features/cv-editor/components/editor/TextField'

export function ContactsBlock() {
  return (
    <EditorBlock title={sectionTitles.contacts}>
      <TextField
        name="contacts.fullName"
        label="Full name"
        autoComplete="name"
        missing="contacts.fullName"
      />
      <div className="grid gap-3 md:grid-cols-2">
        <TextField
          name="contacts.email"
          label="Email"
          type="email"
          autoComplete="email"
          missing="contacts.email"
        />
        <TextField
          name="contacts.phone"
          label="Phone"
          type="tel"
          autoComplete="tel"
          missing="contacts.phone"
        />
      </div>
      <TextField name="contacts.location" label="Location" hint="City and country." />
      <TextField
        name="contacts.links"
        label="Links"
        hint={`One per line, up to ${CV_LIMITS.links}: GitHub, LinkedIn, a portfolio.`}
        rows={3}
      />
    </EditorBlock>
  )
}
