import {
  cardKey,
  EMPTY_PROGRESS,
  subKey,
  type PathProgress,
} from '../domain/path.ts'
import type { CardState } from '../domain/schedule.ts'
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
 */
export function loadPath(key: string, themes: Theme[]): PathProgress {
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

  return {
    done: known(raw.done, subKeys),
    cards,
    notesSeen: known(raw.notesSeen, themeIds),
  }
}

export const savePath = (key: string, progress: PathProgress): void =>
  write(key, { version: 1, ...progress })

/** Whether this browser shows the themes that are not on the path yet. */
export const LEGACY_FLAG_KEY = 'cahier-vocab-legacy'

/**
 * Reads the flag. `?legacy=1` in the address switches it on for this browser
 * and `?legacy=0` switches it off; otherwise the saved choice stands.
 */
export function loadLegacyFlag(
  search: string = typeof location === 'undefined' ? '' : location.search,
): boolean {
  const param = new URLSearchParams(search).get('legacy')
  if (param === '1' || param === '0') {
    write(LEGACY_FLAG_KEY, param === '1')
    return param === '1'
  }
  return read(LEGACY_FLAG_KEY) === true
}
