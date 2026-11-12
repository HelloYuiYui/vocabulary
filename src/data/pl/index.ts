import type { Language } from '../types.ts'
import { copy } from './copy.tsx'
import { THEMES } from './themes.ts'

export const pl: Language = {
  code: 'pl',
  name: 'Polski',
  storage: { v2: 'cahier-vocab-pl-v2' },
  themes: THEMES,
  copy,
}
