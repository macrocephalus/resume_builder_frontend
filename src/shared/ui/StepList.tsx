import type { ReactNode } from 'react'

/** Numbered steps separated by thin lines ("how it works"). */
export function StepList({ steps }: { steps: ReactNode[] }) {
  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => (
        // The steps are static text, so their position is their identity.
        // oxlint-disable-next-line react/no-array-index-key
        <li
          key={index}
          className="grid grid-cols-[26px_minmax(0,1fr)] gap-2 border-t border-line py-2 text-[15px]"
        >
          <span aria-hidden="true" className="pt-0.5 font-mono text-[12.5px] text-muted">
            {index + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  )
}
