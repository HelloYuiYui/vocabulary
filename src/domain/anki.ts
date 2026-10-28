import type { Answer, Item } from './types.ts'

/** "l'escalier (m.)": the answer with its gender when the article hides it. */
export const plainAnswer = (answer: Answer): string =>
  answer.gender ? `${answer.text} (${answer.gender}.)` : answer.text

/** Tab-separated "English\tFrench" lines, one Anki card per item. */
export const ankiText = (items: Item[]): string =>
  items.map((item) => `${item.en}\t${plainAnswer(item.fr[0])}`).join('\n')
