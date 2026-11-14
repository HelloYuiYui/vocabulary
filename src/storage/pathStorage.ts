import {
  cardKey,
  EMPTY_PROGRESS,
  subKey,
  type PathProgress,
} from '../domain/path.ts'
import { enrol, type CardState } from '../domain/schedule.ts'
import type { Theme } from '../domain/types.ts'

// Storage can be missing or blocked, so every access is guarded.
function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? undefined : (JSON.parse(raw) as unknown)
  } catch {
    return undefined
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // The app works without storage; progress just isn't kept.
  }
}

type Json = Record<string, unknown>
const isObject = (v: unknown): v is Json =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const isCount = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0
const DAY = /^\d{4}-\d{2}-\d{2}$/

/** A valid card state, with its box brought inside 1 to 5. */
function parseCard(v: unknown): CardState | undefined {
  if (!isObject(v)) return undefined
  const { box, due, seen, right } = v
  if (typeof box !== 'number' || !Number.isInteger(box)) return undefined
  if (typeof due !== 'string' || !DAY.test(due)) return undefined
  if (!isCount(seen) || !isCount(right)) return undefined
  return { box: Math.min(5, Math.max(1, box)), due, seen, right }
}

/** The strings of a stored list that are still known, without repeats. */
const known = (v: unknown, valid: ReadonlySet<string>): string[] =>
  Array.isArray(v)
    ? [
        ...new Set(
          v.filter((x): x is string => typeof x === 'string' && valid.has(x)),
        ),
      ]
    : []

/**
 * Loads a language's path progress. Each field is validated on its own, and
 * anything that points at a theme, sub-theme or card no longer on the path
 * is dropped. Missing, corrupt or unreadable data gives empty progress.
 *
 * A card added to a sub-theme the learner has already finished would never
 * be asked, so it enters review here, due tomorrow.
 */
export function loadPath(
  key: string,
  themes: Theme[],
  now: Date = new Date(),
): PathProgress {
  const raw = read(key)
  if (!isObject(raw) || raw.version !== 1) return EMPTY_PROGRESS

  const themeIds = new Set(themes.map((t) => t.id))
  const subKeys = new Set(
    themes.flatMap((t) => (t.subThemes ?? []).map((s) => subKey(t.id, s.id))),
  )
  const cardKeys = new Set(
    themes.flatMap((t) =>
      t.items.flatMap((item) => (item.id ? cardKey(t.id, item.id) : [])),
    ),
  )

  const cards: Record<string, CardState> = {}
  if (isObject(raw.cards))
    for (const [k, v] of Object.entries(raw.cards)) {
      const card = cardKeys.has(k) ? parseCard(v) : undefined
      if (card) cards[k] = card
    }

  const done = known(raw.done, subKeys)
  const finished = new Set(done)
  for (const theme of themes)
    for (const sub of theme.subThemes ?? []) {
      if (!finished.has(subKey(theme.id, sub.id))) continue
      for (const item of sub.items)
        if (item.id) cards[cardKey(theme.id, item.id)] ??= enrol(now)
    }

  return { done, cards, notesSeen: known(raw.notesSeen, themeIds) }
}

export const savePath = (key: string, progress: PathProgress): void =>
  write(key, { version: 1, ...progress })
