import type {
  ItemFilter,
  ItemKey,
  Mode,
  Score,
  Theme,
} from '../domain/types.ts'

export interface StoredV2 {
  version: 2
  mode: Mode
  review: ItemKey[]
  scores: Record<string, Score>
  sessionLimit: number | null // null = unlimited, else 15/30/50
  themeProgress: Record<string, number> // progressKey() -> item offset
  itemFilter: ItemFilter
}

/** A language's entries in localStorage. Only French has v1 data to migrate. */
export interface StorageKeys {
  v1?: string
  v2: string
}

// French keeps the keys it had before other languages were added.
export const V1_KEY = 'cahier-vocab-v1'
export const V2_KEY = 'cahier-vocab-v2'

export const DEFAULTS: StoredV2 = {
  version: 2,
  mode: 'cards',
  review: [],
  scores: {},
  sessionLimit: null,
  themeProgress: {},
  itemFilter: 'all',
}

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
const isMode = (v: unknown): v is Mode => v === 'cards' || v === 'list'
const isItemFilter = (v: unknown): v is ItemFilter =>
  v === 'all' || v === 'word' || v === 'sentence'
const isCount = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0

const isPositiveInt = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v > 0

const isSessionLimit = (v: unknown): v is number | null =>
  v === null || isPositiveInt(v)

const isItemKey = (v: unknown): v is ItemKey =>
  isObject(v) && typeof v.themeId === 'string' && typeof v.en === 'string'

const isScore = (v: unknown): v is Score =>
  isObject(v) &&
  isCount(v.right) &&
  isCount(v.total) &&
  v.right <= v.total &&
  typeof v.at === 'string'

function recordOf<T>(v: unknown, isValue: (x: unknown) => x is T) {
  if (!isObject(v)) return {}
  return Object.fromEntries(
    Object.entries(v).filter((e): e is [string, T] => isValue(e[1])),
  )
}

/** Reads v2 data, keeping each valid field and defaulting the rest. */
function parseV2(raw: unknown): StoredV2 | undefined {
  if (!isObject(raw) || raw.version !== 2) return undefined
  return {
    version: 2,
    mode: isMode(raw.mode) ? raw.mode : DEFAULTS.mode,
    review: Array.isArray(raw.review) ? raw.review.filter(isItemKey) : [],
    scores: recordOf(raw.scores, isScore),
    sessionLimit: isSessionLimit(raw.sessionLimit)
      ? raw.sessionLimit
      : DEFAULTS.sessionLimit,
    themeProgress: recordOf(raw.themeProgress, isCount),
    itemFilter: isItemFilter(raw.itemFilter)
      ? raw.itemFilter
      : DEFAULTS.itemFilter,
  }
}

/** v1: { review: ["themeId|English prompt"], scores: { id: "9/13" }, mode } */
export function migrateV1(raw: unknown, now: Date): StoredV2 {
  if (!isObject(raw)) return DEFAULTS
  const keys: unknown[] = Array.isArray(raw.review) ? raw.review : []
  const review = keys.flatMap((key) => {
    const cut = typeof key === 'string' ? key.indexOf('|') : -1
    if (typeof key !== 'string' || cut < 0) return []
    return [{ themeId: key.slice(0, cut), en: key.slice(cut + 1) }]
  })
  const scores: Record<string, Score> = {}
  if (isObject(raw.scores)) {
    for (const [id, value] of Object.entries(raw.scores)) {
      const m = typeof value === 'string' ? /^(\d+)\/(\d+)$/.exec(value) : null
      if (!m) continue
      const right = Number(m[1])
      const total = Number(m[2])
      // v1 kept no date, so the migration date stands in for it.
      if (right <= total) scores[id] = { right, total, at: now.toISOString() }
    }
  }
  return {
    version: 2,
    mode: isMode(raw.mode) ? raw.mode : DEFAULTS.mode,
    review,
    scores,
    sessionLimit: DEFAULTS.sessionLimit,
    themeProgress: DEFAULTS.themeProgress,
    itemFilter: DEFAULTS.itemFilter,
  }
}

/** Drops duplicate review entries and those whose theme or item is gone. */
function prune(stored: StoredV2, themes: Theme[]): StoredV2 {
  const seen = new Set<string>()
  const review = stored.review.filter(({ themeId, en }) => {
    const key = `${themeId}|${en}`
    if (seen.has(key)) return false
    seen.add(key)
    const theme = themes.find((t) => t.id === themeId)
    return theme?.items.some((it) => it.en === en) ?? false
  })
  return { ...stored, review }
}

/**
 * Loads saved progress. When only v1 data exists it is migrated and written
 * as v2; the v1 entry is left in place so the old site still works.
 */
export function loadStored(
  themes: Theme[],
  keys: StorageKeys,
  now: Date = new Date(),
): StoredV2 {
  const v2 = parseV2(read(keys.v2))
  if (v2) return prune(v2, themes)
  const v1 = keys.v1 === undefined ? undefined : read(keys.v1)
  if (v1 === undefined) return DEFAULTS
  const migrated = prune(migrateV1(v1, now), themes)
  write(keys.v2, migrated)
  return migrated
}

export const saveStored = (stored: StoredV2, keys: StorageKeys): void =>
  write(keys.v2, stored)

/** The code of the language last chosen, shared by every language. */
export const LANGUAGE_KEY = 'cahier-vocab-language'

export function loadLanguageCode(): string | undefined {
  const code = read(LANGUAGE_KEY)
  return typeof code === 'string' ? code : undefined
}

export const saveLanguageCode = (code: string): void =>
  write(LANGUAGE_KEY, code)
