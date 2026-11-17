import type { Theme } from '../../domain/types.ts'
import { chisla } from './a1/chisla.ts'
import { ezhednevie } from './a1/ezhednevie.ts'
import { kafene } from './a1/kafene.ts'
import { opisanie } from './a1/opisanie.ts'
import { pazaruvane } from './a1/pazaruvane.ts'
import { predstavyane } from './a1/predstavyane.ts'
import { semeystvo } from './a1/semeystvo.ts'

/** Every theme, in the path's order. */
export const THEMES: Theme[] = [
  predstavyane,
  semeystvo,
  kafene,
  opisanie,
  ezhednevie,
  chisla,
  pazaruvane,
]
