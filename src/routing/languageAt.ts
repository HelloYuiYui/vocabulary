import { LANGUAGES, languageFor } from '../data/language.ts'
import type { Language } from '../data/types.ts'
import { parseRoute } from '../domain/route.ts'
import { loadLanguageCode } from '../storage/storage.ts'

/** The language an address names, or else the one chosen last time. */
export function languageAt(hash: string): Language {
  const lang = parseRoute(hash)?.lang
  return (
    LANGUAGES.find((l) => l.code === lang) ?? languageFor(loadLanguageCode())
  )
}
