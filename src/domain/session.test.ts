import { describe, expect, it } from 'vitest'
import { a, sentence, word } from '../data/helpers.ts'
import { ankiText } from './anki.ts'
import {
  entriesFor,
  entriesFromKeys,
  entriesWithProgress,
  groupedByTheme,
  initialSession,
  recordSession,
  responsesOf,
  sessionReducer,
  shuffled,
  type Entry,
  type Progress,
  type SessionAction,
  type SessionState,
} from './session.ts'
import type { Item, Theme } from './types.ts'

const stairs = word('the stairs', [a("l'escalier", 'm')])
const kitchen = word('the kitchen', [a('la cuisine')])
const sofa = word('the sofa', [a('le canapé')])
const home: Theme = {
  id: 'chez-soi',
  name: 'Chez soi',
  level: 'A1',
  desc: '',
  items: [stairs, kitchen, sofa],
}
const entries = entriesFor([home])

const run = (...actions: SessionAction[]): SessionState =>
  actions.reduce(sessionReducer, initialSession)

const start = (
  mode: 'cards' | 'list',
  label = 'Chez soi',
  es: Entry[] = entries,
): SessionAction => ({ type: 'start', mode, label, entries: es })

describe('sessionReducer', () => {
  it('starts a fresh session', () => {
    const s = run(start('cards'), { type: 'next' }, start('list'))
    expect(s).toMatchObject({ mode: 'list', cursor: 0, finished: false })
    expect(s.entries).toBe(entries)
    expect(s.responses).toEqual({})
  })

  it('grades an answer once', () => {
    const s = run(
      start('cards'),
      { type: 'answer', index: 0, input: "l'escalier", gender: 'm' },
      { type: 'answer', index: 0, input: 'nope', gender: null },
    )
    expect(s.responses[0]).toMatchObject({
      input: "l'escalier",
      gender: 'm',
      overridden: false,
      result: { verdict: 'ok' },
    })
  })

  it('reveals the preferred answer on dunno', () => {
    const s = run(start('cards'), { type: 'dunno', index: 1 })
    expect(s.responses[1]).toMatchObject({
      input: '',
      gender: null,
      result: { verdict: 'dunno', answer: a('la cuisine') },
    })
  })

  it('overrides a wrong answer but not a dunno', () => {
    const s = run(
      start('cards'),
      { type: 'answer', index: 0, input: 'escalier', gender: null },
      { type: 'override', index: 0 },
      { type: 'dunno', index: 1 },
      { type: 'override', index: 1 },
    )
    expect(s.responses[0]).toMatchObject({
      overridden: true,
      result: { verdict: 'ok', answer: a("l'escalier", 'm') },
    })
    expect(s.responses[1]?.result.verdict).toBe('dunno')
  })

  it('finishes cards after the last next', () => {
    const s = run(start('cards'), { type: 'next' }, { type: 'next' })
    expect(s).toMatchObject({ cursor: 2, finished: false })
    expect(sessionReducer(s, { type: 'next' }).finished).toBe(true)
  })

  it('finishes a worksheet once every row is checked', () => {
    const s = run(
      start('list'),
      { type: 'answer', index: 2, input: 'le canapé', gender: null },
      { type: 'answer', index: 0, input: 'x', gender: null },
    )
    expect(s.finished).toBe(false)
    const done = sessionReducer(s, {
      type: 'answer',
      index: 1,
      input: '',
      gender: null,
    })
    expect(done.finished).toBe(true)
    expect(done.responses[1]?.result.verdict).toBe('empty')
  })

  it('checks every remaining row from its draft', () => {
    const s = run(
      start('list'),
      { type: 'answer', index: 0, input: "l'escalier", gender: 'f' },
      {
        type: 'checkAll',
        drafts: {
          0: { input: 'x', gender: null },
          1: { input: 'cuisine', gender: null },
        },
      },
    )
    expect(s.finished).toBe(true)
    expect(responsesOf(s).map((r) => r.result.verdict)).toEqual([
      'gender',
      'article',
      'empty',
    ])
  })

  it('finishes early on quit', () => {
    expect(run(start('cards'), { type: 'finish' }).finished).toBe(true)
  })
})

describe('recordSession', () => {
  const blank = (): Progress => ({ review: [], scores: {} })
  const now = new Date('2026-10-28T12:00:00Z')
  const answered = (label: string, es = entries) =>
    run(
      start('list', label, es),
      { type: 'answer', index: 0, input: "l'escalier", gender: 'm' },
      { type: 'answer', index: 1, input: 'cuisine', gender: null },
      ...es
        .slice(2)
        .map((_, i): SessionAction => ({ type: 'dunno', index: i + 2 })),
    )

  it('adds misses to the review list and removes right answers', () => {
    const progress = {
      review: [
        { themeId: 'chez-soi', en: 'the stairs' },
        { themeId: 'other', en: 'kept' },
      ],
      scores: {},
    }
    const { review } = recordSession(progress, answered('mix'), now)
    expect(review).toEqual([
      { themeId: 'other', en: 'kept' },
      { themeId: 'chez-soi', en: 'the kitchen' },
      { themeId: 'chez-soi', en: 'the sofa' },
    ])
  })

  it('scores a fully answered single theme', () => {
    const { scores } = recordSession(blank(), answered('Chez soi'), now)
    expect(scores).toEqual({
      'chez-soi': { right: 1, total: 3, at: '2026-10-28T12:00:00.000Z' },
    })
  })

  it('counts overridden answers as right', () => {
    const s = sessionReducer(answered('Chez soi'), {
      type: 'override',
      index: 1,
    })
    const { scores, review } = recordSession(blank(), s, now)
    expect(scores['chez-soi']?.right).toBe(2)
    expect(review).toEqual([{ themeId: 'chez-soi', en: 'the sofa' }])
  })

  it('keeps no score for a mix or an unfinished theme', () => {
    const empty = blank()
    expect(recordSession(empty, answered('mix'), now).scores).toEqual({})
    const partial = run(
      start('cards'),
      { type: 'dunno', index: 0 },
      { type: 'finish' },
    )
    expect(recordSession(empty, partial, now).scores).toEqual({})
  })
})

describe('entries', () => {
  it('builds entries from review keys, skipping missing items', () => {
    const byId = new Map([[home.id, home]])
    const keys = [
      { themeId: 'chez-soi', en: 'the sofa' },
      { themeId: 'chez-soi', en: 'gone' },
      { themeId: 'gone', en: 'the sofa' },
    ]
    expect(entriesFromKeys(keys, byId)).toEqual([
      { themeId: 'chez-soi', item: sofa },
    ])
  })

  it('groups entries by theme in first-appearance order', () => {
    const e = (themeId: string, item: Item): Entry => ({ themeId, item })
    const mixed = [
      e('b', stairs),
      e('a', kitchen),
      e('b', sofa),
      e('a', stairs),
    ]
    expect(groupedByTheme(mixed)).toEqual([
      e('b', stairs),
      e('b', sofa),
      e('a', kitchen),
      e('a', stairs),
    ])
  })

  it('shuffles deterministically with a seeded random', () => {
    const order = shuffled([1, 2, 3, 4], () => 0)
    expect(order).toEqual([2, 3, 4, 1])
    expect(shuffled([1, 2, 3, 4], () => 0.999)).toEqual([1, 2, 3, 4])
  })
})

describe('entriesWithProgress', () => {
  const bed = word('the bed', [a('le lit')])
  const town: Theme = {
    id: 'ville',
    name: 'En ville',
    level: 'A1',
    desc: '',
    items: [bed, kitchen],
  }

  it('returns all entries when limit is null', () => {
    const { entries, nextProgress } = entriesWithProgress([home], {}, null)
    expect(entries).toHaveLength(3)
    expect(nextProgress).toEqual({})
  })

  it('selects round-robin from multiple themes', () => {
    const { entries, nextProgress } = entriesWithProgress([home, town], {}, 4)
    // Round-robin: home[0], town[0], home[1], town[1]
    expect(entries.map((e) => e.item.en)).toEqual([
      'the stairs',
      'the bed',
      'the kitchen',
      'the kitchen', // town[1] is kitchen
    ])
    // home: took 2 of 3 -> offset 2; town: took 2 of 2 -> wraps to 0
    expect(nextProgress).toEqual({ 'chez-soi': 2, ville: 0 })
  })

  it('starts from saved offsets', () => {
    const { entries, nextProgress } = entriesWithProgress(
      [home],
      { 'chez-soi': 1 },
      2,
    )
    expect(entries.map((e) => e.item.en)).toEqual(['the kitchen', 'the sofa'])
    expect(nextProgress).toEqual({ 'chez-soi': 0 }) // wraps to 0
  })

  it('wraps around when offset exceeds items length', () => {
    const { entries } = entriesWithProgress([home], { 'chez-soi': 100 }, 2)
    // 100 % 3 = 1, so starts at kitchen
    expect(entries.map((e) => e.item.en)).toEqual(['the kitchen', 'the sofa'])
  })

  it('handles limit larger than total items', () => {
    const { entries, nextProgress } = entriesWithProgress([home], {}, 100)
    expect(entries).toHaveLength(3)
    expect(nextProgress).toEqual({ 'chez-soi': 0 }) // full cycle wraps to 0
  })

  it('returns empty for no themes', () => {
    const { entries, nextProgress } = entriesWithProgress([], {}, 10)
    expect(entries).toEqual([])
    expect(nextProgress).toEqual({})
  })

  describe('with an item filter', () => {
    const where = sentence('Where is the kitchen?', [a('Où est la cuisine ?')])
    const big = sentence('The kitchen is big.', [a('La cuisine est grande.')])
    const mixed: Theme = { ...home, items: [stairs, where, kitchen, big, sofa] }
    const prompts = (es: Entry[]) => es.map((e) => e.item.en)

    it('keeps only the chosen type', () => {
      expect(
        prompts(entriesWithProgress([mixed], {}, null, 'sentence').entries),
      ).toEqual(['Where is the kitchen?', 'The kitchen is big.'])
      expect(
        prompts(entriesWithProgress([mixed], {}, null, 'word').entries),
      ).toEqual(['the stairs', 'the kitchen', 'the sofa'])
    })

    it('keeps a separate offset per filter', () => {
      const progress = { 'chez-soi': 4, 'chez-soi:word': 1 }
      const { entries, nextProgress } = entriesWithProgress(
        [mixed],
        progress,
        1,
        'word',
      )
      expect(prompts(entries)).toEqual(['the kitchen'])
      expect(nextProgress).toEqual({ 'chez-soi:word': 2 })
    })

    it('skips themes with nothing of the chosen type', () => {
      const { entries, nextProgress } = entriesWithProgress(
        [home],
        {},
        5,
        'sentence',
      )
      expect(entries).toEqual([])
      expect(nextProgress).toEqual({})
    })
  })
})

describe('ankiText', () => {
  it('writes tab-separated lines with the gender when hidden', () => {
    expect(ankiText([stairs, kitchen])).toBe(
      "the stairs\tl'escalier (m.)\nthe kitchen\tla cuisine",
    )
  })
})
