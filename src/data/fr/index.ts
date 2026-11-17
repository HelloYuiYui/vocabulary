import type { Language } from '../types.ts'
import { copy } from './copy.ts'
import { pathCopy } from './pathCopy.ts'
import { THEMES } from './themes.ts'

export const fr: Language = {
  code: 'fr',
  name: 'Français',
  exam: 'DELF',
  themes: THEMES,
  copy,
  // The themes that have sub-themes and sentences, in order. The other
  // themes stay in the pack, unseen, until they are converted.
  path: {
    themes: [
      'presentation',
      'famille',
      'cafe',
      'description',
      'routine',
      'chiffres-dates',
      'courses',
      'ville',
      'transports',
      'meteo',
      'nature',
      'loisirs',
      'vetements',
      'chez-soi',
      'vacances',
      'ecrits-courts',
      'raconter',
      'corps',
      'sante',
    ],
    storageKey: 'cahier-vocab-path-v1',
    copy: pathCopy,
  },
}
