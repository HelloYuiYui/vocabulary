import { describe, expect, it } from 'vitest'
import { a, pathTheme, plain, sub } from '../data/helpers.ts'
import {
  cardKey,
  dueEntries,
  EMPTY_PROGRESS,
  isSubDone,
  recordSitting,
  subKey,
  themeStatuses,
  type PathProgress,
} from './path.ts'
import type { Entry } from './session.ts'
import {
  initialSitting,
  sittingReducer,
  type SittingKind,
  type SittingState,
} from './sitting.ts'
import type { Theme } from './types.ts'

const NOW = new Date(2026, 10, 12, 9, 0)
const TOMORROW = '2026-11-13'

const themeOf = (id: string): Theme =>
  pathTheme({
    id,
    name: id,
    level: 'A1',
    desc: 'd',
    subThemes: ['s1', 's2'].map((s) =>
      sub(s, s, [
        plain(`${s}-a`, `${id} ${s} a`, [a('alpha')]),
        plain(`${s}-b`, `${id} ${s} b`, [a('bravo')]),
      ]),
    ),
  })
const T = [themeOf('t1'), themeOf('t2'), themeOf('t3')]

const cardsOf = (themeId: string, subId?: string): Entry[] => {
  const theme = T.find((t) => t.id === themeId)
  const subs = theme?.subThemes?.filter((s) => !subId || s.id === subId) ?? []
  return subs.flatMap((s) => s.items.map((item) => ({ themeId, item })))
}

/** A finished sitting; `wrong` lists the card indices missed on the first try. */
function sitting(
  kind: SittingKind,
  cards: Entry[],
  ids: { themeId?: string; subThemeId?: string } = {},
  wrong: number[] = [],
): SittingState {
  let state = sittingReducer(initialSitting, {
    type: 'start',
    kind,
    cards,
    ...ids,
  })
  const missed = new Set(wrong)
  while (!state.finished) {
    const index = state.queue[0] ?? 0
    const right = state.cards[index]?.item.answers[0].text ?? ''
    const input = missed.delete(index) ? 'wrong' : right
    state = sittingReducer(state, { type: 'answer', input, gender: null })
    state = sittingReducer(state, { type: 'next' })
  }
  return state
}

const doneWith = (...keys: string[]): PathProgress => ({
  ...EMPTY_PROGRESS,
  done: keys,
})
const learn = (themeId: string, subThemeId: string) =>
  sitting('learn', cardsOf(themeId, subThemeId), { themeId, subThemeId })

describe('keys', () => {
  it('joins theme and sub-theme or item ids', () => {
    expect(subKey('famille', 'parents')).toBe('famille/parents')
    expect(cardKey('famille', 'mere')).toBe('famille/mere')
  })
})

describe('themeStatuses', () => {
  it('opens only the first theme at the start', () => {
    expect(themeStatuses(T, EMPTY_PROGRESS)).toEqual([
      'open',
      'locked',
      'locked',
    ])
  })

  it('opens the next theme when every sub-theme is done', () => {
    expect(themeStatuses(T, doneWith('t1/s1', 't1/s2'))).toEqual([
      'done',
      'open',
      'locked',
    ])
  })

  it('keeps the next theme locked while one sub-theme is left', () => {
    expect(themeStatuses(T, doneWith('t1/s1'))).toEqual([
      'open',
      'locked',
      'locked',
    ])
  })

  it('keeps a theme open when an earlier one gains a sub-theme later', () => {
    expect(themeStatuses(T, doneWith('t1/s1', 't2/s1'))).toEqual([
      'open',
      'open',
      'locked',
    ])
  })

  it('never calls a theme without sub-themes done', () => {
    const bare = { ...themeOf('t0'), subThemes: [] }
    expect(themeStatuses([bare, ...T], EMPTY_PROGRESS)).toEqual([
      'open',
      'locked',
      'locked',
      'locked',
    ])
  })

  it('is empty for an empty path', () => {
    expect(themeStatuses([], EMPTY_PROGRESS)).toEqual([])
  })
})

describe('recordSitting', () => {
  it('marks a finished sub-theme done and enrols its cards for tomorrow', () => {
    const progress = recordSitting(EMPTY_PROGRESS, learn('t1', 's1'), T, NOW)
    expect(isSubDone(progress, 't1', 's1')).toBe(true)
    expect(isSubDone(progress, 't1', 's2')).toBe(false)
    expect(progress.cards).toEqual({
      't1/s1-a': { box: 1, due: TOMORROW, seen: 0, right: 0 },
      't1/s1-b': { box: 1, due: TOMORROW, seen: 0, right: 0 },
    })
  })

  it('records the same sitting twice without changing anything more', () => {
    const once = recordSitting(EMPTY_PROGRESS, learn('t1', 's1'), T, NOW)
    expect(recordSitting(once, learn('t1', 's1'), T, NOW)).toEqual(once)
  })

  it('does not re-enrol a card that already has a state', () => {
    const state = { box: 4, due: '2026-12-01', seen: 6, right: 5 }
    const before = { ...EMPTY_PROGRESS, cards: { 't1/s1-a': state } }
    const after = recordSitting(before, learn('t1', 's1'), T, NOW)
    expect(after.cards['t1/s1-a']).toEqual(state)
    expect(after.cards['t1/s1-b']?.box).toBe(1)
  })

  it('records nothing for an unfinished sitting', () => {
    const started = sittingReducer(initialSitting, {
      type: 'start',
      kind: 'learn',
      cards: cardsOf('t1', 's1'),
      themeId: 't1',
      subThemeId: 's1',
    })
    expect(recordSitting(EMPTY_PROGRESS, started, T, NOW)).toBe(EMPTY_PROGRESS)
  })

  it('leaves the schedule untouched when a sub-theme is redone', () => {
    const before = recordSitting(EMPTY_PROGRESS, learn('t1', 's1'), T, NOW)
    const again = sitting(
      'practice',
      cardsOf('t1', 's1'),
      { themeId: 't1', subThemeId: 's1' },
      [0],
    )
    const later = new Date(2026, 10, 20, 9, 0)
    expect(recordSitting(before, again, T, later)).toBe(before)
  })

  it('moves each reviewed card by its first answer', () => {
    const before: PathProgress = {
      ...EMPTY_PROGRESS,
      cards: {
        't1/s1-a': { box: 2, due: '2026-11-12', seen: 1, right: 1 },
        't1/s1-b': { box: 3, due: '2026-11-10', seen: 2, right: 2 },
        't1/s2-a': { box: 1, due: '2026-11-30', seen: 0, right: 0 },
      },
    }
    const review = sitting('review', cardsOf('t1', 's1'), {}, [1])
    const after = recordSitting(before, review, T, NOW)
    expect(after.cards).toEqual({
      't1/s1-a': { box: 3, due: '2026-11-19', seen: 2, right: 2 },
      't1/s1-b': { box: 1, due: TOMORROW, seen: 3, right: 2 },
      't1/s2-a': { box: 1, due: '2026-11-30', seen: 0, right: 0 },
    })
    expect(after.done).toEqual(before.done)
  })

  it('skips a reviewed card that has no saved state', () => {
    const review = sitting('review', cardsOf('t1', 's1'))
    expect(recordSitting(EMPTY_PROGRESS, review, T, NOW).cards).toEqual({})
  })

  it('finishes the theme after a passed quiz and enrols all its cards', () => {
    const quiz = sitting('quiz', cardsOf('t1', 's1'), { themeId: 't1' })
    const after = recordSitting(EMPTY_PROGRESS, quiz, T, NOW)
    expect(after.done).toEqual(['t1/s1', 't1/s2'])
    expect(Object.keys(after.cards).sort()).toEqual([
      't1/s1-a',
      't1/s1-b',
      't1/s2-a',
      't1/s2-b',
    ])
    expect(after.cards['t1/s2-b']).toEqual({
      box: 1,
      due: TOMORROW,
      seen: 0,
      right: 0,
    })
  })

  it('opens the second theme, and only it, after a quiz on the first', () => {
    const quiz = sitting('quiz', cardsOf('t1'), { themeId: 't1' })
    const after = recordSitting(EMPTY_PROGRESS, quiz, T, NOW)
    expect(themeStatuses(T, after)).toEqual(['done', 'open', 'locked'])
  })

  it('changes nothing after a failed quiz', () => {
    const quiz = sitting('quiz', cardsOf('t1'), { themeId: 't1' }, [0, 1])
    expect(recordSitting(EMPTY_PROGRESS, quiz, T, NOW)).toBe(EMPTY_PROGRESS)
  })

  it('changes nothing after a passed quiz on a locked theme', () => {
    const quiz = sitting('quiz', cardsOf('t2'), { themeId: 't2' })
    expect(recordSitting(EMPTY_PROGRESS, quiz, T, NOW)).toBe(EMPTY_PROGRESS)
  })

  it('changes nothing for a sitting whose theme or sub-theme is unknown', () => {
    const cards = cardsOf('t1', 's1')
    const lost = sitting('learn', cards, { themeId: 'gone', subThemeId: 's1' })
    expect(recordSitting(EMPTY_PROGRESS, lost, T, NOW)).toBe(EMPTY_PROGRESS)
    const quiz = sitting('quiz', cards, { themeId: 'gone' })
    expect(recordSitting(EMPTY_PROGRESS, quiz, T, NOW)).toBe(EMPTY_PROGRESS)
  })
})

describe('dueEntries', () => {
  it('lists due cards as entries, longest overdue first', () => {
    const progress: PathProgress = {
      ...EMPTY_PROGRESS,
      cards: {
        't1/s1-a': { box: 1, due: '2026-11-12', seen: 0, right: 0 },
        't2/s2-b': { box: 1, due: '2026-11-01', seen: 0, right: 0 },
        't1/s1-b': { box: 1, due: '2026-11-13', seen: 0, right: 0 },
      },
    }
    expect(
      dueEntries(T, progress, NOW).map((e) => cardKey(e.themeId, e.item.id!)),
    ).toEqual(['t2/s2-b', 't1/s1-a'])
  })

  it('skips keys whose item no longer exists', () => {
    const progress: PathProgress = {
      ...EMPTY_PROGRESS,
      cards: {
        't1/removed': { box: 1, due: '2026-11-01', seen: 0, right: 0 },
        'gone/s1-a': { box: 1, due: '2026-11-01', seen: 0, right: 0 },
      },
    }
    expect(dueEntries(T, progress, NOW)).toEqual([])
  })
})
