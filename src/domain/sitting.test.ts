import { describe, expect, it } from 'vitest'
import { a, pathTheme, plain, sub } from '../data/helpers.ts'
import type { Entry } from './session.ts'
import {
  initialSitting,
  QUIZ_PASS,
  QUIZ_SIZE,
  quizCards,
  quizPassed,
  rightFirstTime,
  sittingReducer,
  type SittingAction,
  type SittingKind,
  type SittingState,
} from './sitting.ts'

const entry = (id: string, answer: string): Entry => ({
  themeId: 't',
  item: plain(id, id, [a(answer)]),
})
const A = entry('a', 'alpha')
const B = entry('b', 'bravo')
const C = entry('c', 'la chambre')

const run = (state: SittingState, ...actions: SittingAction[]) =>
  actions.reduce(sittingReducer, state)
const begin = (cards: Entry[], kind: SittingKind = 'learn') =>
  run(initialSitting, { type: 'start', kind, cards, themeId: 't' })
const say = (input: string): SittingAction => ({
  type: 'answer',
  input,
  gender: null,
})
const next: SittingAction = { type: 'next' }

describe('sittingReducer', () => {
  it('starts with every card queued in order', () => {
    const state = begin([A, B, C])
    expect(state.queue).toEqual([0, 1, 2])
    expect(state.finished).toBe(false)
    expect(state.themeId).toBe('t')
  })

  it('finishes when every card has been answered right once', () => {
    const state = run(
      begin([A, B, C]),
      say('alpha'),
      next,
      say('bravo'),
      next,
      say('la chambre'),
    )
    expect(state.finished).toBe(false)
    const done = run(state, next)
    expect(done.finished).toBe(true)
    expect(done.queue).toEqual([])
    expect(rightFirstTime(done)).toBe(3)
  })

  it('sends a missed card to the back and asks it again', () => {
    const missed = run(begin([A, B, C]), say('wrong'), next)
    expect(missed.queue).toEqual([1, 2, 0])
    expect(missed.response).toBeUndefined()
    const done = run(
      missed,
      say('bravo'),
      next,
      say('la chambre'),
      next,
      say('alpha'),
      next,
    )
    expect(done.finished).toBe(true)
    expect(done.tries[0]).toBe(2)
    expect(done.firstRight[0]).toBe(false)
    expect(rightFirstTime(done)).toBe(2)
  })

  it('treats "je ne sais pas" like a miss, and shows the answer', () => {
    const shown = run(begin([A, B]), { type: 'dunno' })
    expect(shown.response?.result).toEqual({
      verdict: 'dunno',
      answer: { text: 'alpha' },
    })
    expect(run(shown, next).queue).toEqual([1, 0])
  })

  it('keeps asking the last card until it is right', () => {
    let state = begin([A])
    for (let i = 0; i < 3; i++) state = run(state, say('wrong'), next)
    expect(state.queue).toEqual([0])
    expect(state.finished).toBe(false)
    expect(run(state, say('alpha'), next).finished).toBe(true)
  })

  it('ignores a second answer to the same card', () => {
    const state = run(begin([A, B]), say('wrong'), say('alpha'), {
      type: 'dunno',
    })
    expect(state.tries[0]).toBe(1)
    expect(state.response?.input).toBe('wrong')
  })

  it('ignores next before an answer', () => {
    const state = begin([A, B])
    expect(run(state, next)).toBe(state)
  })

  it('lets an override make a first try right', () => {
    const state = run(begin([A, B]), say('alfa'), { type: 'override' })
    expect(state.firstRight[0]).toBe(true)
    expect(state.response?.overridden).toBe(true)
    expect(run(state, next).queue).toEqual([1])
  })

  it('does not rewrite the first try when a later one is overridden', () => {
    const state = run(
      begin([A]),
      say('wrong'),
      next,
      say('alfa'),
      { type: 'override' },
      next,
    )
    expect(state.finished).toBe(true)
    expect(state.firstRight[0]).toBe(false)
  })

  it('does not let "je ne sais pas" or a right answer be overridden', () => {
    const dunno = run(begin([A]), { type: 'dunno' })
    expect(run(dunno, { type: 'override' })).toBe(dunno)
    const right = run(begin([A]), say('alpha'))
    expect(run(right, { type: 'override' })).toBe(right)
  })

  it('does not let "presque" count as right', () => {
    const state = run(begin([C, A]), say('chambre'))
    expect(state.response?.result.verdict).toBe('article')
    expect(state.firstRight[0]).toBe(false)
    expect(run(state, next).queue).toEqual([1, 0])
  })

  it('never repeats a card in a quiz', () => {
    const state = run(begin([A, B], 'quiz'), say('wrong'), next)
    expect(state.queue).toEqual([1])
    expect(run(state, { type: 'dunno' }, next).finished).toBe(true)
  })

  it('finishes an empty sitting at once', () => {
    const state = begin([])
    expect(state.finished).toBe(true)
    expect(run(state, next, say('x'), { type: 'dunno' })).toBe(state)
  })

  it('forgets the previous sitting on start', () => {
    const state = run(begin([A]), say('wrong'), next, {
      type: 'start',
      kind: 'review',
      cards: [B],
    })
    expect(state.tries).toEqual({})
    expect(state.kind).toBe('review')
    expect(state.themeId).toBeUndefined()
  })
})

describe('quizPassed', () => {
  const five = [A, B, A, B, A]
  const quiz = (right: number) =>
    five.reduce(
      (state, card, i) =>
        run(state, say(i < right ? card.item.answers[0].text : 'no'), next),
      begin(five, 'quiz'),
    )

  it('passes at 80% and fails below', () => {
    expect(QUIZ_PASS).toBe(0.8)
    expect(quizPassed(quiz(5))).toBe(true)
    expect(quizPassed(quiz(4))).toBe(true)
    expect(quizPassed(quiz(3))).toBe(false)
  })

  it('is false for an unfinished quiz, an empty one, and other sittings', () => {
    expect(quizPassed(run(begin(five, 'quiz'), say('alpha')))).toBe(false)
    expect(quizPassed(begin([], 'quiz'))).toBe(false)
    expect(quizPassed(run(begin([A], 'learn'), say('alpha'), next))).toBe(false)
  })
})

describe('quizCards', () => {
  const themeOf = (sizes: number[]) =>
    pathTheme({
      id: 't',
      name: 'T',
      level: 'A1',
      desc: 'd',
      subThemes: sizes.map((size, s) =>
        sub(
          `s${s}`,
          `S${s}`,
          Array.from({ length: size }, (_, i) =>
            plain(`s${s}-${i}`, `s${s}-${i}`, [a('x')]),
          ),
        ),
      ),
    })
  const perSub = (cards: Entry[], s: number) =>
    cards.filter((c) => c.item.id?.startsWith(`s${s}-`)).length

  it('draws at most 20 cards, spread across sub-themes', () => {
    const cards = quizCards(themeOf([10, 10, 10]))
    expect(QUIZ_SIZE).toBe(20)
    expect(cards).toHaveLength(20)
    for (const s of [0, 1, 2])
      expect(perSub(cards, s)).toBeGreaterThanOrEqual(6)
    expect(new Set(cards.map((c) => c.item.id)).size).toBe(20)
    expect(cards.every((c) => c.themeId === 't')).toBe(true)
  })

  it('takes every card of a small theme', () => {
    expect(quizCards(themeOf([4, 4]))).toHaveLength(8)
  })

  it('keeps drawing from large sub-themes when a small one runs out', () => {
    const cards = quizCards(themeOf([2, 12, 12]))
    expect(cards).toHaveLength(20)
    expect(perSub(cards, 0)).toBe(2)
  })

  it('draws differently with a different random source', () => {
    const theme = themeOf([12, 12])
    const ids = (random: () => number) =>
      quizCards(theme, random).map((c) => c.item.id)
    expect(ids(() => 0)).not.toEqual(ids(() => 0.999))
  })

  it('is empty for a theme without sub-themes', () => {
    const theme = { id: 't', name: 'T', level: 'A1' as const, desc: 'd' }
    expect(quizCards({ ...theme, items: [] })).toEqual([])
  })
})
