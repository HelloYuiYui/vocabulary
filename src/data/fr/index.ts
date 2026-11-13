import { V1_KEY, V2_KEY } from '../../storage/storage.ts'
import type { Language } from '../types.ts'
import { copy } from './copy.tsx'
import { pathCopy } from './pathCopy.ts'
import { THEMES } from './themes.ts'

export const fr: Language = {
  code: 'fr',
  name: 'Français',
  storage: { v1: V1_KEY, v2: V2_KEY },
  themes: THEMES,
  copy,
  // The themes that have sub-themes and sentences; the others stay on the
  // old picker, behind the legacy flag, until they are converted.
  path: {
    themes: ['presentation', 'famille', 'chiffres-dates', 'description'],
    storageKey: 'cahier-vocab-path-v1',
    copy: pathCopy,
  },
}
