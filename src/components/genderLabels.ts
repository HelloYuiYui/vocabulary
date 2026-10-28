import type { Gender } from '../domain/types.ts'

export const GENDER_LABELS: Record<Gender, { short: string; long: string }> = {
  m: { short: 'masc.', long: 'masculin' },
  f: { short: 'fém.', long: 'féminin' },
}
