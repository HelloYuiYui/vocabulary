import type { Language } from '../types.ts'
import { copy } from './copy.ts'
import { pathCopy } from './pathCopy.ts'
import { THEMES } from './themes.ts'

export const bg: Language = {
  code: 'bg',
  name: 'Български',
  awaitingReview: true,
  themes: THEMES,
  copy,
  // Every theme is on the path.
  path: {
    themes: [
      'predstavyane',
      'semeystvo',
      'kafene',
      'opisanie',
      'ezhednevie',
      'chisla-dati',
      'pazaruvane',
      'grad',
      'transport',
      'vreme',
    ],
    storageKey: 'cahier-vocab-bg-path-v1',
    copy: pathCopy,
  },
}
