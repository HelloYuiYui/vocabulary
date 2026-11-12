import { bare, hidesGender, norm, stripArticle } from './normalise.ts'
import type { Answer, Gender, Item } from './types.ts'

export type Verdict =
  | 'ok'
  | 'accent'
  | 'elision' // count as correct
  | 'gender-missing'
  | 'gender'
  | 'article' // shown as "presque"
  | 'bad'
  | 'dunno'
  | 'empty' // wrong

export interface GradeResult {
  verdict: Verdict
  answer: Answer // the matched answer, or the preferred one
}

export type Tone = 'ok' | 'near' | 'bad'

export const isCorrect = (v: Verdict): boolean =>
  v === 'ok' || v === 'accent' || v === 'elision'

export const tone = (v: Verdict): Tone =>
  isCorrect(v)
    ? 'ok'
    : v === 'gender-missing' || v === 'gender' || v === 'article'
      ? 'near'
      : 'bad'

/** A wrong answer can be overridden, unless the learner gave none. */
export const canOverride = (v: Verdict): boolean =>
  !isCorrect(v) && v !== 'dunno' && v !== 'empty'

export function grade(
  input: string,
  gender: Gender | null,
  item: Item,
): GradeResult {
  const { answers } = item
  const n = norm(input)
  if (!n) return { verdict: 'empty', answer: answers[0] }

  const withGender = (answer: Answer, base: Verdict): GradeResult => {
    if (!answer.gender || !hidesGender(input)) return { verdict: base, answer }
    if (!gender) return { verdict: 'gender-missing', answer }
    if (gender !== answer.gender) return { verdict: 'gender', answer }
    return { verdict: base, answer }
  }

  for (const a of answers) if (norm(a.text) === n) return withGender(a, 'ok')
  const nb = bare(n)
  for (const a of answers)
    if (bare(norm(a.text)) === nb) return withGender(a, 'accent')

  // "un escalier" for "l'escalier": the indefinite article shows the gender
  const [, article, noun] = /^(un|une) (.+)$/.exec(nb) ?? []
  if (noun) {
    const typed: Gender = article === 'un' ? 'm' : 'f'
    for (const a of answers)
      if (a.gender && stripArticle(bare(norm(a.text))) === noun)
        return { verdict: typed === a.gender ? 'elision' : 'gender', answer: a }
  }

  const stripped = stripArticle(nb)
  for (const a of answers)
    if (stripArticle(bare(norm(a.text))) === stripped)
      return { verdict: 'article', answer: a }

  return { verdict: 'bad', answer: answers[0] }
}
