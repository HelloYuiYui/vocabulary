import type { Language } from '../types.ts'
import { copy } from './copy.ts'
import { pathCopy } from './pathCopy.ts'
import { THEMES } from './themes.ts'

export const pl: Language = {
  code: 'pl',
  name: 'Polski',
  themes: THEMES,
  copy,
  // Every theme is on the path.
  path: {
    themes: ['przedstawianie', 'rodzina', 'liczby-daty', 'opis'],
    storageKey: 'cahier-vocab-pl-path-v1',
    copy: pathCopy,
  },
}
