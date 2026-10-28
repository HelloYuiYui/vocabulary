import type { Theme } from '../domain/types.ts'
import { chezSoi } from './a1/chezSoi.ts'
import { chiffres } from './a1/chiffres.ts'
import { corps } from './a1/corps.ts'
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
import { logement } from './a2/logement.ts'
import { sante } from './a2/sante.ts'

/** Every theme, in the order of docs/delf-checklist.md. */
export const THEMES: Theme[] = [
  presentation,
  famille,
  chiffres,
  description,
  chezSoi,
  routine,
  courses,
  ville,
  transports,
  meteo,
  loisirs,
  vetements,
  corps,
  ecritsCourts,
  sante,
  logement,
]

export const THEME_BY_ID: ReadonlyMap<string, Theme> = new Map(
  THEMES.map((t) => [t.id, t]),
)
