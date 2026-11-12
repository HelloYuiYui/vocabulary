import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { THEMES } from '../data/fr/themes.ts'
import {
  DEFAULTS,
  V1_KEY,
  V2_KEY,
  loadStored,
  saveStored,
  type StoredV2,
} from './storage.ts'

const keys = { v1: V1_KEY, v2: V2_KEY }

const now = new Date('2026-10-28T12:00:00Z')
const at = now.toISOString()
const put = (key: string, value: unknown) =>
  localStorage.setItem(key, JSON.stringify(value))
const get = (key: string): unknown =>
  JSON.parse(localStorage.getItem(key) ?? 'null')

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('loadStored', () => {
  it('returns defaults when nothing is saved', () => {
    expect(loadStored(THEMES, keys, now)).toEqual(DEFAULTS)
    expect(localStorage.getItem(V2_KEY)).toBeNull()
  })

  it('migrates v1 data and keeps the v1 entry', () => {
    const v1 = {
      review: [
        'chez-soi|the stairs',
        'ville|the church',
        'gone|x',
        'chez-soi|gone',
        'junk',
      ],
      scores: { 'chez-soi': '9/13', ville: 'nope', sante: '3/2' },
      mode: 'list',
    }
    put(V1_KEY, v1)
    const expected: StoredV2 = {
      version: 2,
      mode: 'list',
      review: [
        { themeId: 'chez-soi', en: 'the stairs' },
        { themeId: 'ville', en: 'the church' },
      ],
      scores: { 'chez-soi': { right: 9, total: 13, at } },
      sessionLimit: null,
      themeProgress: {},
      itemFilter: 'all',
    }
    expect(loadStored(THEMES, keys, now)).toEqual(expected)
    expect(get(V2_KEY)).toEqual(expected)
    expect(get(V1_KEY)).toEqual(v1)
  })

  it('splits v1 keys at the first bar only', () => {
    put(V1_KEY, { review: ['routine|to wake up'] })
    expect(loadStored(THEMES, keys, now).review).toEqual([
      { themeId: 'routine', en: 'to wake up' },
    ])
  })

  it('prefers v2 over v1', () => {
    put(V1_KEY, { mode: 'list' })
    put(V2_KEY, { ...DEFAULTS, mode: 'cards' })
    expect(loadStored(THEMES, keys, now).mode).toBe('cards')
  })

  it('drops review entries for removed items and duplicates', () => {
    const key = { themeId: 'chez-soi', en: 'the sofa' }
    put(V2_KEY, {
      ...DEFAULTS,
      review: [key, key, { themeId: 'chez-soi', en: 'gone' }],
    })
    expect(loadStored(THEMES, keys, now).review).toEqual([key])
  })

  it('keeps valid fields of partly corrupt v2 data', () => {
    put(V2_KEY, {
      version: 2,
      mode: 'grid',
      review: [{ themeId: 'chez-soi', en: 'the sofa' }, 42, { themeId: 1 }],
      scores: {
        ok: { right: 1, total: 2, at },
        bad: { right: 'x' },
        worse: { right: 3, total: 2, at },
      },
    })
    expect(loadStored(THEMES, keys, now)).toEqual({
      version: 2,
      mode: 'cards',
      review: [{ themeId: 'chez-soi', en: 'the sofa' }],
      scores: { ok: { right: 1, total: 2, at } },
      sessionLimit: null,
      themeProgress: {},
      itemFilter: 'all',
    })
  })

  it('loads sessionLimit and themeProgress', () => {
    put(V2_KEY, {
      ...DEFAULTS,
      sessionLimit: 30,
      themeProgress: { 'chez-soi': 5, ville: 10 },
    })
    const result = loadStored(THEMES, keys, now)
    expect(result.sessionLimit).toBe(30)
    expect(result.themeProgress).toEqual({ 'chez-soi': 5, ville: 10 })
  })

  it('defaults invalid sessionLimit and filters invalid themeProgress', () => {
    put(V2_KEY, {
      ...DEFAULTS,
      sessionLimit: 'invalid',
      themeProgress: { valid: 5, zero: 0, negative: -1, float: 1.5 },
    })
    const result = loadStored(THEMES, keys, now)
    expect(result.sessionLimit).toBe(null)
    // 0 is valid (start of theme), but negative and float are not
    expect(result.themeProgress).toEqual({ valid: 5, zero: 0 })
  })

  it('defaults an unknown item filter to all', () => {
    put(V2_KEY, { ...DEFAULTS, itemFilter: 'phrases' })
    expect(loadStored(THEMES, keys, now).itemFilter).toBe('all')
  })

  it.each([
    ['invalid JSON', '{nope'],
    ['an array', '[]'],
    ['a string', '"hello"'],
    ['null', 'null'],
  ])('falls back to defaults for %s', (_, raw) => {
    localStorage.setItem(V1_KEY, raw)
    localStorage.setItem(V2_KEY, raw)
    expect(loadStored(THEMES, keys, now)).toEqual(DEFAULTS)
  })
})

describe('without storage', () => {
  it('loads defaults and saves silently', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(loadStored(THEMES, keys, now)).toEqual(DEFAULTS)
    expect(() => saveStored(DEFAULTS, keys)).not.toThrow()
  })

  it('survives localStorage itself throwing', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(loadStored(THEMES, keys, now)).toEqual(DEFAULTS)
    expect(() => saveStored(DEFAULTS, keys)).not.toThrow()
  })
})

describe('saveStored', () => {
  it('round-trips through loadStored', () => {
    const stored: StoredV2 = {
      version: 2,
      mode: 'list',
      review: [{ themeId: 'sante', en: 'to cough' }],
      scores: { sante: { right: 10, total: 14, at } },
      sessionLimit: 30,
      themeProgress: { sante: 5, 'sante:sentence': 3 },
      itemFilter: 'sentence',
    }
    saveStored(stored, keys)
    expect(loadStored(THEMES, keys, now)).toEqual(stored)
  })
})
