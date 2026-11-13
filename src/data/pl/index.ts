import type { Language } from '../types.ts'
import { copy } from './copy.tsx'
import { pathCopy } from './pathCopy.ts'
import { THEMES } from './themes.ts'

export const pl: Language = {
  code: 'pl',
  name: 'Polski',
  storage: { v2: 'cahier-vocab-pl-v2' },
  themes: THEMES,
  copy,
  // Every theme is on the path. Progress from the old theme picker stays
  // under the v2 key, untouched and no longer shown.
  path: {
    themes: ['przedstawianie', 'rodzina', 'liczby-daty', 'opis'],
    storageKey: 'cahier-vocab-pl-path-v1',
    copy: pathCopy,
  },
}
