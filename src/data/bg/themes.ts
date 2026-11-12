import type { Theme } from '../../domain/types.ts'
import { chisla } from './a1/chisla.ts'
import { opisanie } from './a1/opisanie.ts'
import { predstavyane } from './a1/predstavyane.ts'
import { semeystvo } from './a1/semeystvo.ts'

/** Every theme, in the same order as the French ones. */
export const THEMES: Theme[] = [predstavyane, semeystvo, chisla, opisanie]
