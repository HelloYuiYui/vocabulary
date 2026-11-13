import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { a, pathTheme, plain, sub } from '../data/helpers.ts'
import { EMPTY_PROGRESS, type PathProgress } from '../domain/path.ts'
import {
  LEGACY_FLAG_KEY,
  loadLegacyFlag,
  loadPath,
  savePath,
} from './pathStorage.ts'
import { V2_KEY } from './storage.ts'

const KEY = 'test-path'
const THEMES = [
  pathTheme({
    id: 't1',
    name: 'T1',
    level: 'A1',
    desc: 'd',
    subThemes: [
      sub('s1', 'S1', [plain('a', 'a', [a('alpha')])]),
      sub('s2', 'S2', [plain('b', 'b', [a('bravo')])]),
    ],
  }),
]
const CARD = { box: 2, due: '2026-11-15', seen: 3, right: 2 }
const SAVED: PathProgress = {
  done: ['t1/s1'],
  cards: { 't1/a': CARD },
  notesSeen: ['t1'],
}
const put = (value: unknown) => localStorage.setItem(KEY, JSON.stringify(value))

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('loadPath', () => {
  it('returns empty progress when nothing is stored', () => {
    expect(loadPath(KEY, THEMES)).toEqual(EMPTY_PROGRESS)
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('round-trips saved progress', () => {
    savePath(KEY, SAVED)
    expect(JSON.parse(localStorage.getItem(KEY) ?? '{}')).toEqual({
      version: 1,
      ...SAVED,
    })
    expect(loadPath(KEY, THEMES)).toEqual(SAVED)
  })

  it.each(['not json', '[]', '{"version":2}', 'null', '"text"', '{}'])(
    'falls back to empty progress on %s',
    (raw) => {
      localStorage.setItem(KEY, raw)
      expect(loadPath(KEY, THEMES)).toEqual(EMPTY_PROGRESS)
    },
  )

  it('keeps the valid fields of a partly broken object', () => {
    put({ version: 1, done: 'nope', cards: { 't1/a': CARD }, notesSeen: 7 })
    expect(loadPath(KEY, THEMES)).toEqual({
      done: [],
      cards: { 't1/a': CARD },
      notesSeen: [],
    })
  })

  it.each([
    { ...CARD, box: 'x' },
    { ...CARD, due: 'tomorrow' },
    { ...CARD, due: 20261115 },
    { ...CARD, seen: -1 },
    { ...CARD, right: 1.5 },
    { box: 2 },
    null,
    'card',
  ])('drops an invalid card state: %j', (card) => {
    put({ version: 1, done: [], cards: { 't1/a': card, 't1/b': CARD } })
    expect(loadPath(KEY, THEMES).cards).toEqual({ 't1/b': CARD })
  })

  it.each([
    [9, 5],
    [0, 1],
    [-4, 1],
  ])('clamps box %i to %i', (box, clamped) => {
    put({ version: 1, cards: { 't1/a': { ...CARD, box } } })
    expect(loadPath(KEY, THEMES).cards['t1/a']?.box).toBe(clamped)
  })

  it('prunes cards, sub-themes and notes that no longer exist', () => {
    put({
      version: 1,
      done: ['t1/s1', 't1/gone', 'gone/s1', 7, 't1/s1'],
      cards: { 't1/a': CARD, 't1/gone': CARD, 'gone/a': CARD },
      notesSeen: ['t1', 'gone', 't1', null],
    })
    expect(loadPath(KEY, THEMES)).toEqual(SAVED)
  })

  it('enrols a card that was added to a sub-theme already finished', () => {
    put({ version: 1, done: ['t1/s1', 't1/s2'], cards: { 't1/a': CARD } })
    expect(loadPath(KEY, THEMES, new Date(2026, 10, 12, 9, 0)).cards).toEqual({
      't1/a': CARD,
      't1/b': { box: 1, due: '2026-11-13', seen: 0, right: 0 },
    })
  })

  it('does not enrol the cards of a sub-theme that is not finished', () => {
    put({ version: 1, done: ['t1/s1'], cards: { 't1/a': CARD } })
    expect(loadPath(KEY, THEMES).cards).toEqual({ 't1/a': CARD })
  })

  it('returns empty progress when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(loadPath(KEY, THEMES)).toEqual(EMPTY_PROGRESS)
  })
})

describe('savePath', () => {
  it('does not throw when storage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full')
    })
    expect(() => savePath(KEY, SAVED)).not.toThrow()
  })

  it('never touches the v2 entry', () => {
    const v2 = JSON.stringify({ version: 2, mode: 'list', review: [] })
    localStorage.setItem(V2_KEY, v2)
    savePath(KEY, SAVED)
    loadPath(KEY, THEMES)
    expect(localStorage.getItem(V2_KEY)).toBe(v2)
  })
})

describe('loadLegacyFlag', () => {
  it('is off by default', () => {
    expect(loadLegacyFlag('')).toBe(false)
    expect(localStorage.getItem(LEGACY_FLAG_KEY)).toBeNull()
  })

  it('is switched on by ?legacy=1 and stays on afterwards', () => {
    expect(loadLegacyFlag('?legacy=1')).toBe(true)
    expect(loadLegacyFlag('')).toBe(true)
    expect(loadLegacyFlag('?other=1')).toBe(true)
  })

  it('is switched off by ?legacy=0 and stays off afterwards', () => {
    loadLegacyFlag('?legacy=1')
    expect(loadLegacyFlag('?x=1&legacy=0')).toBe(false)
    expect(loadLegacyFlag('')).toBe(false)
  })

  it('ignores other values of the parameter', () => {
    expect(loadLegacyFlag('?legacy=yes')).toBe(false)
  })

  it('ignores a stored value that is not a boolean', () => {
    localStorage.setItem(LEGACY_FLAG_KEY, '"true"')
    expect(loadLegacyFlag('')).toBe(false)
  })

  it('still answers from the query string when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(loadLegacyFlag('?legacy=1')).toBe(true)
    expect(loadLegacyFlag('')).toBe(false)
  })
})
