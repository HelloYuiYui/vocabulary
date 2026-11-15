import type { Language } from '../types.ts'
import { copy } from './copy.ts'
import { pathCopy } from './pathCopy.ts'
import { THEMES } from './themes.ts'

export const bg: Language = {
  code: 'bg',
  name: 'Български',
  themes: THEMES,
  copy,
  // Every theme is on the path.
  path: {
    themes: ['predstavyane', 'semeystvo', 'chisla-dati', 'opisanie'],
    storageKey: 'cahier-vocab-bg-path-v1',
    copy: pathCopy,
  },
}
