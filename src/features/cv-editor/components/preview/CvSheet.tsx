import { Sheet } from '@/shared/ui/Sheet'
import { sheetText } from '@/shared/ui/sheetText'
import type { SheetLayout } from '@/features/cv-editor/model/sheet'

/** The A4 sheet of a draft, laid out like the PDF; an empty draft is a blank page, as in the PDF. */
export function CvSheet({ sheet }: { sheet: SheetLayout }) {
  return (
    <Sheet>
      {sheet.name ? <p className={sheetText.name}>{sheet.name}</p> : null}
      {sheet.contacts ? <p className={sheetText.contacts}>{sheet.contacts}</p> : null}
      {sheet.blocks.map((block) => (
        <section key={block.section}>
          <h3 className={sheetText.heading}>{block.heading}</h3>
          {block.kind === 'text' ? (
            <p className={sheetText.text}>{block.text}</p>
          ) : (
            block.items.map((item) => (
              <div key={item.id} className={sheetText.item}>
                {item.title ? <p className={sheetText.itemTitle}>{item.title}</p> : null}
                {item.meta ? <p className={sheetText.meta}>{item.meta}</p> : null}
                {item.bullets.length > 0 ? (
                  <ul className={sheetText.bullets}>
                    {item.bullets.map((bullet, at) => (
                      // Bullets are plain strings and may repeat; their place is their identity.
                      <li key={at}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))
          )}
        </section>
      ))}
    </Sheet>
  )
}
