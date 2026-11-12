import type { Theme } from '../domain/types.ts'
import { bg } from './bg/index.ts'
import { fr } from './fr/index.ts'
import { pl } from './pl/index.ts'
import type { Language } from './types.ts'

/** Every language pack, in the order the switcher shows them. */
export const LANGUAGES: Language[] = [fr, bg, pl]

/** The language with this code, or French when there is none. */
export const languageFor = (code: string | undefined): Language =>
  LANGUAGES.find((l) => l.code === code) ?? fr

export const themesById = (themes: Theme[]): ReadonlyMap<string, Theme> =>
  new Map(themes.map((t) => [t.id, t]))
