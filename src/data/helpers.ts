import type { Answer, Gender, Item, ItemType } from '../domain/types.ts'

type Answers = [Answer, ...Answer[]]

/** Builds an answer; pass a gender only when the article hides it (l', les). */
export const a = (text: string, gender?: Gender): Answer =>
  gender ? { text, gender } : { text }

const item = (
  type: ItemType,
  en: string,
  answers: Answers,
  note?: string,
): Item => (note ? { type, en, answers, note } : { type, en, answers })

export const word = (en: string, answers: Answers, note?: string): Item =>
  item('word', en, answers, note)

export const sentence = (en: string, answers: Answers, note?: string): Item =>
  item('sentence', en, answers, note)
