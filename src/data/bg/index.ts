import type { Language } from '../types.ts'
import { copy } from './copy.tsx'
import { pathCopy } from './pathCopy.ts'
import { THEMES } from './themes.ts'

export const bg: Language = {
  code: 'bg',
  name: 'Български',
  storage: { v2: 'cahier-vocab-bg-v2' },
  themes: THEMES,
  copy,
  // Every theme is on the path. Progress from the old theme picker stays
  // under the v2 key, untouched and no longer shown.
  path: {
    themes: ['predstavyane', 'semeystvo', 'chisla-dati', 'opisanie'],
    storageKey: 'cahier-vocab-bg-path-v1',
    copy: pathCopy,
  },
}
