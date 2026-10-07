import type { ComponentProps } from 'react'
import { cx } from '@/shared/lib/cx'

type Place = 'edge' | 'above-bar'

const places: Record<Place, string> = {
  edge: 'bottom-[calc(env(safe-area-inset-bottom)+12px)]',
  // The save bar's height and its gap: two bars can show at once without covering each other.
  'above-bar': 'bottom-[calc(env(safe-area-inset-bottom)+84px)]',
}

type FloatingBarProps = ComponentProps<'section'> & {
  /** Where it sticks: at the bottom edge (the save bar), or above the save bar's place. */
  place?: Place
}

/**
 * A glass bar stuck to the bottom of its container, above the phone's gesture area (the save
 * bar, the apply bar). Text on it stays `ink` or `accent`.
 */
export function FloatingBar({ place = 'edge', className, ...props }: FloatingBarProps) {
  return (
    <section
      className={cx(
        'sticky z-10 flex flex-wrap items-center gap-2.5 rounded-md border glass px-3 py-2.5 text-sm text-ink',
        places[place],
        className,
      )}
      {...props}
    />
  )
}
