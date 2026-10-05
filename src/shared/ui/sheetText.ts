/**
 * The type of the A4 preview sheet, in container-query units of its width, so it scales like
 * the PDF page (595 pt wide, 50 pt margins, a 20 pt name, 9 pt headings).
 */
export const sheetText = {
  name: 'text-[3.36cqw] leading-[1.2] font-bold',
  contacts: 'mt-[0.6cqw] text-[1.6cqw] text-paper-muted',
  heading:
    'mt-[2.6cqw] mb-[1cqw] border-b border-paper-line pb-[0.5cqw] text-[1.5cqw] font-bold tracking-[0.08em] uppercase',
  /** One job, project…: spaced from the previous one, not from the heading. */
  item: 'mt-[1.2cqw] [h3+&]:mt-0',
  itemTitle: 'font-bold',
  meta: 'text-[1.6cqw] text-paper-muted',
  bullets: 'mt-[0.4cqw] list-disc pl-[2.4cqw]',
  /** A paragraph; its line breaks stay, as in the PDF. */
  text: 'whitespace-pre-line',
} as const
