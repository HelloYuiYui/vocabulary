import { gradeItem } from './cloze.ts'
import { canOverride, isCorrect, type GradeResult } from './grade.ts'
import { shuffled, type Draft, type Entry, type Response } from './session.ts'
import type { Theme } from './types.ts'

/**
 * learn: a sub-theme taken for the first time. practice: one taken again.
 * review: cards that are due. quiz: the test that skips a theme.
 */
export type SittingKind = 'learn' | 'practice' | 'review' | 'quiz'

/** One sitting: its cards are asked until each has been answered right once. */
export interface SittingState {
  kind: SittingKind
  themeId?: string // learn, practice and quiz
  subThemeId?: string // learn and practice
  cards: Entry[]
  queue: number[] // card indices still to answer right; queue[0] is on screen
  response: Response | undefined // the answer to queue[0], once given
  firstRight: Record<number, boolean> // card index -> was its first answer right
  tries: Record<number, number> // card index -> answers given so far
  finished: boolean
}

export type SittingAction =
  | {
      type: 'start'
      kind: SittingKind
      cards: Entry[]
      themeId?: string
      subThemeId?: string
    }
  | ({ type: 'answer' } & Draft)
  | { type: 'dunno' }
  | { type: 'override' }
  | { type: 'next' }

export const initialSitting: SittingState = {
  kind: 'learn',
  cards: [],
  queue: [],
  response: undefined,
  firstRight: {},
  tries: {},
  finished: false,
}

const EMPTY_DRAFT: Draft = { input: '', gender: null }

function respond(
  state: SittingState,
  draft: Draft,
  result: (entry: Entry) => GradeResult,
): SittingState {
  const index = state.queue[0]
  const entry = index === undefined ? undefined : state.cards[index]
  if (index === undefined || !entry || state.response) return state
  const response: Response = {
    ...draft,
    entry,
    result: result(entry),
    overridden: false,
  }
  const tries = (state.tries[index] ?? 0) + 1
  return {
    ...state,
    response,
    tries: { ...state.tries, [index]: tries },
    firstRight:
      tries === 1
        ? { ...state.firstRight, [index]: isCorrect(response.result.verdict) }
        : state.firstRight,
  }
}

export function sittingReducer(
  state: SittingState,
  action: SittingAction,
): SittingState {
  switch (action.type) {
    case 'start': {
      const started: SittingState = {
        ...initialSitting,
        kind: action.kind,
        cards: action.cards,
        queue: action.cards.map((_, i) => i),
        finished: action.cards.length === 0,
      }
      if (action.themeId !== undefined) started.themeId = action.themeId
      if (action.subThemeId !== undefined)
        started.subThemeId = action.subThemeId
      return started
    }
    case 'answer':
      return respond(
        state,
        { input: action.input, gender: action.gender },
        (entry) => gradeItem(action.input, action.gender, entry.item),
      )
    case 'dunno':
      return respond(state, EMPTY_DRAFT, (entry) => ({
        verdict: 'dunno',
        answer: entry.item.answers[0],
      }))
    case 'override': {
      const { response } = state
      const index = state.queue[0]
      if (!response || index === undefined) return state
      if (!canOverride(response.result.verdict)) return state
      return {
        ...state,
        response: {
          ...response,
          result: { ...response.result, verdict: 'ok' },
          overridden: true,
        },
        firstRight:
          state.tries[index] === 1
            ? { ...state.firstRight, [index]: true }
            : state.firstRight,
      }
    }
    case 'next': {
      const { response } = state
      const [index, ...rest] = state.queue
      if (!response || index === undefined) return state
      const leaves = state.kind === 'quiz' || isCorrect(response.result.verdict)
      const queue = leaves ? rest : [...rest, index]
      return {
        ...state,
        queue,
        response: undefined,
        finished: queue.length === 0,
      }
    }
  }
}

/** How many cards were answered right on their first try. */
export const rightFirstTime = (state: SittingState): number =>
  Object.values(state.firstRight).filter(Boolean).length

/** The most cards a skip quiz asks, and the share that passes it. */
export const QUIZ_SIZE = 20
export const QUIZ_PASS = 0.8

export const quizPassed = (state: SittingState): boolean =>
  state.kind === 'quiz' &&
  state.finished &&
  state.cards.length > 0 &&
  rightFirstTime(state) / state.cards.length >= QUIZ_PASS

/** A fresh draw for a theme's skip quiz: one card from each sub-theme in turn. */
export function quizCards(
  theme: Theme,
  random: () => number = Math.random,
): Entry[] {
  const piles = (theme.subThemes ?? []).map((s) => shuffled(s.items, random))
  const cards: Entry[] = []
  for (let round = 0; cards.length < QUIZ_SIZE; round++) {
    const drawn = piles.flatMap((pile) => pile[round] ?? [])
    if (drawn.length === 0) break
    for (const item of drawn.slice(0, QUIZ_SIZE - cards.length))
      cards.push({ themeId: theme.id, item })
  }
  return cards
}
