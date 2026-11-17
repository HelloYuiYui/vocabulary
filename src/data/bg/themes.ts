import type { Theme } from '../../domain/types.ts'
import { chisla } from './a1/chisla.ts'
import { drehi } from './a1/drehi.ts'
import { ezhednevie } from './a1/ezhednevie.ts'
import { grad } from './a1/grad.ts'
import { kafene } from './a1/kafene.ts'
import { opisanie } from './a1/opisanie.ts'
import { pazaruvane } from './a1/pazaruvane.ts'
import { pisma } from './a1/pisma.ts'
import { pochivka } from './a1/pochivka.ts'
import { predstavyane } from './a1/predstavyane.ts'
import { priroda } from './a1/priroda.ts'
import { semeystvo } from './a1/semeystvo.ts'
import { svobodnoVreme } from './a1/svobodnoVreme.ts'
import { transport } from './a1/transport.ts'
import { vkashti } from './a1/vkashti.ts'
import { vreme } from './a1/vreme.ts'

/** Every theme, in the path's order. */
export const THEMES: Theme[] = [
  predstavyane,
  semeystvo,
  kafene,
  opisanie,
  ezhednevie,
  chisla,
  pazaruvane,
  grad,
  transport,
  vreme,
  priroda,
  svobodnoVreme,
  drehi,
  vkashti,
  pochivka,
  pisma,
]
