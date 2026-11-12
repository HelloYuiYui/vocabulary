import { V1_KEY, V2_KEY } from '../../storage/storage.ts'
import type { Language } from '../types.ts'
import { copy } from './copy.tsx'
import { THEMES } from './themes.ts'

export const fr: Language = {
  code: 'fr',
  name: 'Français',
  storage: { v1: V1_KEY, v2: V2_KEY },
  themes: THEMES,
  copy,
}
