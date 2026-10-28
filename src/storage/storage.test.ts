import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { THEMES } from '../data/themes.ts'
import {
  DEFAULTS,
  V1_KEY,
  V2_KEY,
  loadStored,
  saveStored,
  type StoredV2,
} from './storage.ts'

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
    expect(loadStored(THEMES, now)).toEqual(DEFAULTS)
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
    }
    expect(loadStored(THEMES, now)).toEqual(expected)
    expect(get(V2_KEY)).toEqual(expected)
    expect(get(V1_KEY)).toEqual(v1)
  })

  it('splits v1 keys at the first bar only', () => {
    put(V1_KEY, { review: ['routine|to wake up'] })
    expect(loadStored(THEMES, now).review).toEqual([
      { themeId: 'routine', en: 'to wake up' },
    ])
  })

  it('prefers v2 over v1', () => {
    put(V1_KEY, { mode: 'list' })
    put(V2_KEY, { ...DEFAULTS, mode: 'cards' })
    expect(loadStored(THEMES, now).mode).toBe('cards')
  })

  it('drops review entries for removed items and duplicates', () => {
    const key = { themeId: 'chez-soi', en: 'the sofa' }
    put(V2_KEY, {
      ...DEFAULTS,
      review: [key, key, { themeId: 'chez-soi', en: 'gone' }],
    })
    expect(loadStored(THEMES, now).review).toEqual([key])
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
    expect(loadStored(THEMES, now)).toEqual({
      version: 2,
      mode: 'cards',
      review: [{ themeId: 'chez-soi', en: 'the sofa' }],
      scores: { ok: { right: 1, total: 2, at } },
    })
  })

  it.each([
    ['invalid JSON', '{nope'],
    ['an array', '[]'],
    ['a string', '"hello"'],
    ['null', 'null'],
  ])('falls back to defaults for %s', (_, raw) => {
    localStorage.setItem(V1_KEY, raw)
    localStorage.setItem(V2_KEY, raw)
    expect(loadStored(THEMES, now)).toEqual(DEFAULTS)
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
    expect(loadStored(THEMES, now)).toEqual(DEFAULTS)
    expect(() => saveStored(DEFAULTS)).not.toThrow()
  })

  it('survives localStorage itself throwing', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(loadStored(THEMES, now)).toEqual(DEFAULTS)
    expect(() => saveStored(DEFAULTS)).not.toThrow()
  })
})

describe('saveStored', () => {
  it('round-trips through loadStored', () => {
    const stored: StoredV2 = {
      version: 2,
      mode: 'list',
      review: [{ themeId: 'sante', en: 'to cough' }],
      scores: { sante: { right: 10, total: 14, at } },
    }
    saveStored(stored)
    expect(loadStored(THEMES, now)).toEqual(stored)
  })
})
