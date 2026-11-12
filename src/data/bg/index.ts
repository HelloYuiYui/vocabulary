import type { Language } from '../types.ts'
import { copy } from './copy.tsx'
import { THEMES } from './themes.ts'

export const bg: Language = {
  code: 'bg',
  name: 'Български',
  storage: { v2: 'cahier-vocab-bg-v2' },
  themes: THEMES,
  copy,
}
