import { grade, isCorrect, type GradeResult } from './grade.ts'
import { bare, norm } from './normalise.ts'
import { sentenceAnswer } from './sentence.ts'
import type { Answer, Gender, Item } from './types.ts'

const fold = (s: string): string => bare(norm(s))

const leadingArticle = (folded: string): string | undefined =>
  /^(l'|le |la |les |un |une |des )/.exec(folded)?.[1]?.trim()

const SHOWN: Record<string, Gender> = { le: 'm', un: 'm', la: 'f', une: 'f' }
const isPlural = (article: string) => article === 'les' || article === 'des'

/**
 * An answer that differs from an accepted one only by its article. The right
 * gender with the wrong kind of article (la for une, des for les) still shows
 * the learner knows the word; the wrong gender does not.
 */
function articleVerdict(input: string, answer: Answer): GradeResult['verdict'] {
  const typed = leadingArticle(fold(input))
  const wanted = leadingArticle(fold(answer.text))
  if (!typed || !wanted || wanted === "l'") return 'article'
  if (isPlural(typed) && isPlural(wanted)) return 'ok'
  const typedGender = SHOWN[typed]
  const nounGender = answer.gender ?? SHOWN[wanted]
  if (!typedGender || !nounGender) return 'article'
  return typedGender === nounGender ? 'ok' : 'gender'
}

/**
 * Grades a cloze card. The form in the sentence and every dictionary form
 * are accepted; when the answer is right but is not the sentence's own form,
 * that form is returned so it can be shown.
 */
export function gradeCloze(
  input: string,
  gender: Gender | null,
  item: Item,
): GradeResult {
  if (!item.sentence) return grade(input, gender, item)
  const form = sentenceAnswer(item.sentence)
  const result = grade(input, gender, {
    ...item,
    answers: [form, ...item.answers],
  })
  const verdict =
    result.verdict === 'article'
      ? articleVerdict(input, result.answer)
      : result.verdict
  const graded: GradeResult = { verdict, answer: result.answer }
  if (isCorrect(verdict) && fold(input) !== fold(form.text)) graded.form = form
  return graded
}

/** Grades any item: as a cloze card when it has a sentence, as before otherwise. */
export const gradeItem = (
  input: string,
  gender: Gender | null,
  item: Item,
): GradeResult =>
  item.sentence ? gradeCloze(input, gender, item) : grade(input, gender, item)
