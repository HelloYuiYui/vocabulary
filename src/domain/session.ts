import type { GradeResult } from './grade.ts'
import type { Gender, Item } from './types.ts'

/** A card in a sitting: an item and the theme it belongs to. */
export interface Entry {
  themeId: string
  item: Item
}

/** What the learner has typed, before it is checked. */
export interface Draft {
  input: string
  gender: Gender | null
}

export interface Response extends Draft {
  entry: Entry
  result: GradeResult
  overridden: boolean // "En fait, ma réponse était juste"
}

export function shuffled<T>(
  items: T[],
  random: () => number = Math.random,
): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j] as T, out[i] as T]
  }
  return out
}
