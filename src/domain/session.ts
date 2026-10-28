import { canOverride, grade, isCorrect, type GradeResult } from './grade.ts'
import type { Gender, Item, ItemKey, Mode, Score, Theme } from './types.ts'

export interface Entry {
  themeId: string
  item: Item
}

export interface Draft {
  input: string
  gender: Gender | null
}

export interface Response extends Draft {
  entry: Entry
  result: GradeResult
  overridden: boolean // "En fait, ma réponse était juste"
}

export interface SessionState {
  mode: Mode
  label: string // a theme name, or 'mix' for several themes
  entries: Entry[] // shuffled in cards mode, theme order in list mode
  responses: Record<number, Response> // keyed by entry index
  cursor: number // cards mode only
  finished: boolean
}

export type SessionAction =
  | { type: 'start'; mode: Mode; label: string; entries: Entry[] }
  | ({ type: 'answer'; index: number } & Draft)
  | { type: 'dunno'; index: number }
  | { type: 'override'; index: number }
  | { type: 'next' }
  | { type: 'checkAll'; drafts: Record<number, Draft> }
  | { type: 'finish' }

export const initialSession: SessionState = {
  mode: 'cards',
  label: 'mix',
  entries: [],
  responses: {},
  cursor: 0,
  finished: false,
}

const EMPTY_DRAFT: Draft = { input: '', gender: null }

function respond(
  state: SessionState,
  index: number,
  draft: Draft,
  result: (item: Item) => GradeResult,
): SessionState {
  const entry = state.entries[index]
  if (!entry || state.responses[index]) return state
  const responses = {
    ...state.responses,
    [index]: { ...draft, entry, result: result(entry.item), overridden: false },
  }
  // A worksheet is finished once every row is checked.
  const finished =
    state.finished ||
    (state.mode === 'list' &&
      Object.keys(responses).length === state.entries.length)
  return { ...state, responses, finished }
}

export function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  switch (action.type) {
    case 'start':
      return {
        ...initialSession,
        mode: action.mode,
        label: action.label,
        entries: action.entries,
      }
    case 'answer':
      return respond(state, action.index, action, (item) =>
        grade(action.input, action.gender, item),
      )
    case 'dunno':
      return respond(state, action.index, EMPTY_DRAFT, (item) => ({
        verdict: 'dunno',
        answer: item.fr[0],
      }))
    case 'override': {
      const response = state.responses[action.index]
      if (!response || !canOverride(response.result.verdict)) return state
      const overridden: Response = {
        ...response,
        result: { ...response.result, verdict: 'ok' },
        overridden: true,
      }
      return {
        ...state,
        responses: { ...state.responses, [action.index]: overridden },
      }
    }
    case 'next': {
      const cursor = state.cursor + 1
      return { ...state, cursor, finished: cursor >= state.entries.length }
    }
    case 'checkAll': {
      const responses = { ...state.responses }
      state.entries.forEach((entry, index) => {
        if (responses[index]) return
        const draft = action.drafts[index] ?? EMPTY_DRAFT
        const result = grade(draft.input, draft.gender, entry.item)
        responses[index] = { ...draft, entry, result, overridden: false }
      })
      return { ...state, responses, finished: true }
    }
    case 'finish':
      return { ...state, finished: true }
  }
}

/** Responses in entry order. */
export const responsesOf = (state: SessionState): Response[] =>
  state.entries.flatMap((_, i) => state.responses[i] ?? [])

export const isRight = (response: Response): boolean =>
  isCorrect(response.result.verdict)

export function entriesFor(themes: Theme[]): Entry[] {
  return themes.flatMap((t) => t.items.map((item) => ({ themeId: t.id, item })))
}

export function entriesFromKeys(
  keys: ItemKey[],
  themeById: ReadonlyMap<string, Theme>,
): Entry[] {
  return keys.flatMap(({ themeId, en }) => {
    const item = themeById.get(themeId)?.items.find((it) => it.en === en)
    return item ? [{ themeId, item }] : []
  })
}

/** Groups entries by theme, in order of each theme's first entry. */
export function groupedByTheme(entries: Entry[]): Entry[] {
  const themeIds = [...new Set(entries.map((e) => e.themeId))]
  return themeIds.flatMap((id) => entries.filter((e) => e.themeId === id))
}

export function shuffled<T>(
  items: T[],
  random: () => number = Math.random,
): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j] as T, out[i] as T]
  }
  return out
}

export interface Progress {
  review: ItemKey[]
  scores: Record<string, Score>
}

const keyString = (k: ItemKey) => `${k.themeId}|${k.en}`

/**
 * Updates the review list and theme scores from a finished session: wrong
 * answers join the review list, right ones leave it. A theme's score is kept
 * only when the whole theme was answered on its own.
 */
export function recordSession<T extends Progress>(
  progress: T,
  state: SessionState,
  now: Date = new Date(),
): T {
  const responses = responsesOf(state)
  const review = new Map(progress.review.map((k) => [keyString(k), k]))
  for (const r of responses) {
    const key = { themeId: r.entry.themeId, en: r.entry.item.en }
    if (isRight(r)) review.delete(keyString(key))
    else review.set(keyString(key), key)
  }

  let scores = progress.scores
  const first = responses[0]
  const total = state.entries.length
  if (state.label !== 'mix' && first && responses.length === total) {
    const right = responses.filter(isRight).length
    scores = {
      ...scores,
      [first.entry.themeId]: { right, total, at: now.toISOString() },
    }
  }
  return { ...progress, review: [...review.values()], scores }
}
