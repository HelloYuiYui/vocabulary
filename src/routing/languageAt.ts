import { LANGUAGES } from '../data/language.ts'
import type { Language } from '../data/types.ts'
import { HOME, parseRoute } from '../domain/route.ts'
import { loadLanguageCode } from '../storage/storage.ts'

/** The language an address names, if it names a known one. */
export const languageNamedBy = (hash: string): Language | undefined => {
  const lang = parseRoute(hash)?.lang
  return LANGUAGES.find((l) => l.code === lang)
}

/** The language chosen last time, if it is a known one. */
export const savedLanguage = (): Language | undefined => {
  const code = loadLanguageCode()
  return LANGUAGES.find((l) => l.code === code)
}

/**
 * The language a page at this address is in: the one the address names, or
 * the saved one it will be sent to. None for the homepage, nor for a first
 * visit, which is sent there.
 */
export const languageAt = (hash: string): Language | undefined =>
  hash === HOME ? undefined : (languageNamedBy(hash) ?? savedLanguage())
