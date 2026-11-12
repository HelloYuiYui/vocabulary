/** What the app remembers about one card. */
export interface CardState {
  box: number // Leitner box, 1 to 5
  due: string // local calendar day it is next asked, "YYYY-MM-DD"
  seen: number // times answered in review
  right: number // times answered right in review
}

/** Days until a card is asked again, by box. */
export const INTERVALS = [1, 3, 7, 14, 30] as const
const LAST_BOX = INTERVALS.length

/** The most cards one review sitting takes. */
export const REVIEW_LIMIT = 30

const pad = (n: number): string => String(n).padStart(2, '0')

/** The learner's calendar day, in their own timezone. */
export const localDay = (now: Date): string =>
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

/** Moves a day by whole calendar days, whatever the clocks do in between. */
export function addDays(day: string, days: number): string {
  const [y = 0, m = 1, d = 1] = day.split('-').map(Number)
  // Noon keeps the date clear of the hour lost or gained at a clock change.
  return localDay(new Date(y, m - 1, d + days, 12))
}

const intervalOf = (box: number): number => INTERVALS[box - 1] ?? 1

/** Keeps a box read from storage or arithmetic inside 1 to 5. */
const clampBox = (box: number): number =>
  Number.isFinite(box) ? Math.min(LAST_BOX, Math.max(1, Math.trunc(box))) : 1

/** A card's state when its sub-theme is finished: box 1, asked tomorrow. */
export const enrol = (now: Date): CardState => ({
  box: 1,
  due: addDays(localDay(now), intervalOf(1)),
  seen: 0,
  right: 0,
})

/** The state after a review: up one box when right, back to box 1 when not. */
export function schedule(
  state: CardState,
  wasRight: boolean,
  now: Date,
): CardState {
  const box = wasRight ? clampBox(clampBox(state.box) + 1) : 1
  return {
    box,
    due: addDays(localDay(now), intervalOf(box)),
    seen: state.seen + 1,
    right: state.right + (wasRight ? 1 : 0),
  }
}

/** Keys of the cards due today or earlier: longest overdue first, at most the limit. */
export function dueKeys(cards: Record<string, CardState>, now: Date): string[] {
  const today = localDay(now)
  return Object.entries(cards)
    .filter(([, state]) => state.due <= today)
    .sort(
      ([ka, a], [kb, b]) =>
        a.due.localeCompare(b.due) || (ka < kb ? -1 : ka > kb ? 1 : 0),
    )
    .slice(0, REVIEW_LIMIT)
    .map(([key]) => key)
}
