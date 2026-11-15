import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LANGUAGE_KEY, loadLanguageCode, saveLanguageCode } from './storage.ts'

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('the language chosen last', () => {
  it('is unknown when nothing is saved', () => {
    expect(loadLanguageCode()).toBeUndefined()
  })

  it('round-trips', () => {
    saveLanguageCode('pl')
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe('"pl"')
    expect(loadLanguageCode()).toBe('pl')
  })

  it.each(['not json', '42', 'null', '{"code":"bg"}'])(
    'is unknown when the saved value is %s',
    (raw) => {
      localStorage.setItem(LANGUAGE_KEY, raw)
      expect(loadLanguageCode()).toBeUndefined()
    },
  )

  it('works without storage', () => {
    const blocked = () => {
      throw new DOMException('blocked', 'SecurityError')
    }
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked)
    expect(() => saveLanguageCode('bg')).not.toThrow()
    expect(loadLanguageCode()).toBeUndefined()
  })
})
