import {
  dueKeys,
  enrol,
  REVIEW_LIMIT,
  schedule,
  type CardState,
} from './schedule.ts'
import type { Entry } from './session.ts'
import { quizPassed, type SittingState } from './sitting.ts'
import type { Theme } from './types.ts'

/** What a learner has done on a language's path. */
export interface PathProgress {
  done: string[] // subKey() of each finished sub-theme
  cards: Record<string, CardState> // review state, by cardKey()
  notesSeen: string[] // ids of the themes whose grammar note has been shown
  skipped: string[] // cardKey() of each card set aside with "je connais ce mot"
  openPath: boolean // every theme open, the order only a suggestion
}

export const EMPTY_PROGRESS: PathProgress = {
  done: [],
  cards: {},
  notesSeen: [],
  skipped: [],
  openPath: false,
}

export const subKey = (themeId: string, subThemeId: string): string =>
  `${themeId}/${subThemeId}`

export const cardKey = (themeId: string, itemId: string): string =>
  `${themeId}/${itemId}`

export const isSubDone = (
  progress: PathProgress,
  themeId: string,
  subThemeId: string,
): boolean => progress.done.includes(subKey(themeId, subThemeId))

/** done: every sub-theme finished. open: can be worked on. locked: not reached. */
export type ThemeStatus = 'done' | 'open' | 'locked'

/**
 * The state of each theme, in path order. A theme opens when the one before
 * it is done. One the learner has already worked in stays open, even if an
 * earlier theme later gains a sub-theme. On an open path, every theme is open.
 */
export function themeStatuses(
  themes: Theme[],
  progress: PathProgress,
): ThemeStatus[] {
  const done = new Set(progress.done)
  let previousDone = true // the first theme is open from the start
  return themes.map((theme) => {
    const subs = theme.subThemes ?? []
    const finished = subs.filter((s) => done.has(subKey(theme.id, s.id)))
    const isDone = subs.length > 0 && finished.length === subs.length
    const status: ThemeStatus = isDone
      ? 'done'
      : progress.openPath || previousDone || finished.length > 0
        ? 'open'
        : 'locked'
    previousDone = isDone
    return status
  })
}

/** Every card of these themes that can be scheduled, by its key. */
function entriesByKey(themes: Theme[]): Map<string, Entry> {
  const entries = new Map<string, Entry>()
  for (const theme of themes)
    for (const item of theme.items)
      if (item.id)
        entries.set(cardKey(theme.id, item.id), { themeId: theme.id, item })
  return entries
}

/**
 * The cards for one review sitting: those due today or earlier, longest
 * overdue first, at most the review limit. Cards whose item is gone are
 * skipped.
 */
export function dueEntries(
  themes: Theme[],
  progress: PathProgress,
  now: Date,
): Entry[] {
  const entries = entriesByKey(themes)
  return dueKeys(progress.cards, now, Infinity)
    .flatMap((key) => entries.get(key) ?? [])
    .slice(0, REVIEW_LIMIT)
}

/** How many cards are due in all, however many one sitting takes. */
export function dueCount(
  themes: Theme[],
  progress: PathProgress,
  now: Date,
): number {
  const entries = entriesByKey(themes)
  return dueKeys(progress.cards, now, Infinity).filter((key) =>
    entries.has(key),
  ).length
}

/**
 * Adds a first review state for each of these items that has none, except
 * the cards set aside.
 */
function enrolled(
  progress: PathProgress,
  theme: Theme,
  itemIds: (string | undefined)[],
  now: Date,
): Record<string, CardState> {
  const next = { ...progress.cards }
  const skipped = new Set(progress.skipped)
  for (const id of itemIds) {
    if (!id) continue
    const key = cardKey(theme.id, id)
    if (!skipped.has(key)) next[key] ??= enrol(now)
  }
  return next
}

/**
 * Sets a card aside ("je connais ce mot"): it leaves review and is never
 * asked again until it is put back. Its sub-theme still counts as done.
 */
export function skipCard(
  progress: PathProgress,
  themeId: string,
  itemId: string,
): PathProgress {
  const key = cardKey(themeId, itemId)
  const cards = { ...progress.cards }
  delete cards[key]
  return { ...progress, cards, skipped: withDone(progress.skipped, [key]) }
}

/**
 * Puts a card set aside back ("remettre"). If its sub-theme is done, it
 * enters review, due tomorrow; otherwise it is learnt with its sub-theme.
 */
export function restoreCard(
  progress: PathProgress,
  themeId: string,
  itemId: string,
  themes: Theme[],
  now: Date,
): PathProgress {
  const key = cardKey(themeId, itemId)
  const back = {
    ...progress,
    skipped: progress.skipped.filter((k) => k !== key),
  }
  const sub = themes
    .find((t) => t.id === themeId)
    ?.subThemes?.find((s) => s.items.some((item) => item.id === itemId))
  if (!sub || !isSubDone(progress, themeId, sub.id)) return back
  return {
    ...back,
    cards: { ...back.cards, [key]: enrol(now) },
  }
}

/** The cards of a sitting to be, without those set aside. */
export const withoutSkipped = (
  entries: Entry[],
  progress: PathProgress,
): Entry[] => {
  const skipped = new Set(progress.skipped)
  return entries.filter(
    ({ themeId, item }) => !item.id || !skipped.has(cardKey(themeId, item.id)),
  )
}

const withDone = (done: string[], keys: string[]): string[] => [
  ...new Set([...done, ...keys]),
]

/**
 * Progress after a finished sitting. A sub-theme taken for the first time is
 * marked done and its cards enter review; a review moves each card by its
 * first answer; a passed quiz on an open theme finishes that theme. Redoing a
 * sub-theme, or leaving any sitting unfinished, changes nothing.
 */
export function recordSitting(
  progress: PathProgress,
  sitting: SittingState,
  themes: Theme[],
  now: Date,
): PathProgress {
  if (!sitting.finished) return progress
  const index = themes.findIndex((t) => t.id === sitting.themeId)
  const theme = themes[index]

  switch (sitting.kind) {
    case 'practice':
      return progress
    case 'learn': {
      const sub = theme?.subThemes?.find((s) => s.id === sitting.subThemeId)
      if (!theme || !sub) return progress
      return {
        ...progress,
        done: withDone(progress.done, [subKey(theme.id, sub.id)]),
        cards: enrolled(
          progress,
          theme,
          sub.items.map((item) => item.id),
          now,
        ),
      }
    }
    case 'quiz': {
      if (!theme || !quizPassed(sitting)) return progress
      if (themeStatuses(themes, progress)[index] !== 'open') return progress
      return {
        ...progress,
        done: withDone(
          progress.done,
          (theme.subThemes ?? []).map((s) => subKey(theme.id, s.id)),
        ),
        cards: enrolled(
          progress,
          theme,
          theme.items.map((item) => item.id),
          now,
        ),
      }
    }
    case 'review': {
      const cards = { ...progress.cards }
      sitting.cards.forEach(({ themeId, item }, i) => {
        if (!item.id) return
        const key = cardKey(themeId, item.id)
        const state = cards[key]
        if (state)
          cards[key] = schedule(state, sitting.firstRight[i] ?? false, now)
      })
      return { ...progress, cards }
    }
  }
}
