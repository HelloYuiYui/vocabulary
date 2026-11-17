import type { Theme } from '../../domain/types.ts'
import { cafe } from './a1/cafe.ts'
import { chezSoi } from './a1/chezSoi.ts'
import { chiffres } from './a1/chiffres.ts'
import { courses } from './a1/courses.ts'
import { description } from './a1/description.ts'
import { ecritsCourts } from './a1/ecritsCourts.ts'
import { famille } from './a1/famille.ts'
import { loisirs } from './a1/loisirs.ts'
import { meteo } from './a1/meteo.ts'
import { presentation } from './a1/presentation.ts'
import { routine } from './a1/routine.ts'
import { transports } from './a1/transports.ts'
import { vetements } from './a1/vetements.ts'
import { ville } from './a1/ville.ts'
import { corps } from './a2/corps.ts'
import { logement } from './a2/logement.ts'
import { portrait } from './a2/portrait.ts'
import { sante } from './a2/sante.ts'

/** Every theme: the path's themes in path order, then the themes not on it yet. */
export const THEMES: Theme[] = [
  presentation,
  famille,
  cafe,
  description,
  routine,
  chiffres,
  courses,
  ville,
  transports,
  meteo,
  loisirs,
  vetements,
  chezSoi,
  ecritsCourts,
  corps,
  portrait,
  logement,
  sante,
]
