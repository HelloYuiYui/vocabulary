import { parseSentence } from '../domain/sentence.ts'
import type { Answer, Gender, Theme } from '../domain/types.ts'

const ID = /^[a-z0-9-]+$/
const HIDES_GENDER = /^(l['’]|les )/i
const NOT_IN_BLANK =
  /^((mon|ma|mes|ton|ta|tes|son|sa|ses|notre|nos|votre|vos|leur|leurs|du|de la) |de l['’])/i

/** The gender an answer carries, or the one its article shows. */
const genderOf = ({ text, gender }: Answer): Gender | undefined =>
  gender ??
  (/^(le|un) /i.test(text) ? 'm' : /^(la|une) /i.test(text) ? 'f' : undefined)

const repeated = (values: string[]): string[] => [
  ...new Set(values.filter((v, i) => values.indexOf(v) !== i)),
]

/**
 * What is wrong with a theme's sub-themes and cloze sentences, one line per
 * problem; empty for a theme without sub-themes. Used by the data tests.
 */
export function pathProblems(theme: Theme, french: boolean): string[] {
  const { subThemes } = theme
  if (!subThemes) return []
  const problems: string[] = []
  const say = (text: string) => problems.push(`${theme.id}: ${text}`)

  for (const id of repeated(subThemes.map((s) => s.id)))
    say(`sub-theme id "${id}" is used twice`)
  const items = subThemes.flatMap((s) => s.items)
  if (
    items.length !== theme.items.length ||
    items.some((it, i) => it !== theme.items[i])
  )
    say('items are not the sub-themes flattened')
  for (const id of repeated(items.flatMap((it) => it.id ?? [])))
    say(`item id "${id}" is used twice`)

  for (const s of subThemes) {
    if (!ID.test(s.id)) say(`sub-theme id "${s.id}" is not a slug`)
    if (s.items.length < 1 || s.items.length > 12)
      say(`sub-theme "${s.id}" has ${s.items.length} items, not 1 to 12`)
    for (const item of s.items) {
      const name = item.id ?? item.en
      if (!item.id || !ID.test(item.id)) say(`"${name}" has no slug id`)
      if (item.type === 'sentence') say(`"${name}" is a whole-sentence item`)
      if (!item.sentence) continue
      const parts = parseSentence(item.sentence.text)
      if (!parts) {
        say(`"${name}" needs exactly one {blank}`)
        continue
      }
      if (!item.sentence.en.trim()) say(`"${name}" has no translation`)
      const hidden = HIDES_GENDER.test(parts.blank)
      if (french && hidden && !item.sentence.gender)
        say(`"${name}" needs a gender for its blank`)
      if (!(french && hidden) && item.sentence.gender)
        say(`"${name}" has a gender its blank does not need`)
      // The blank's gender: stated when its article hides it, shown otherwise.
      const gender = item.sentence.gender ?? genderOf({ text: parts.blank })
      // Only answers that carry or show a gender can contradict the blank.
      const genders = item.answers.flatMap((a) => genderOf(a) ?? [])
      if (french && gender && genders.length > 0 && !genders.includes(gender))
        say(`"${name}" has a blank whose gender matches no answer`)
      if (french && NOT_IN_BLANK.test(parts.blank))
        say(`"${name}" has a possessive or partitive in its blank`)
    }
  }
  return problems
}
