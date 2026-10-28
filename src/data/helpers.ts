import type { Answer, Gender, Item, ItemType } from '../domain/types.ts'

type Answers = [Answer, ...Answer[]]

/** Builds an answer; pass a gender only when the article hides it (l', les). */
export const a = (text: string, gender?: Gender): Answer =>
  gender ? { text, gender } : { text }

const item = (type: ItemType, en: string, fr: Answers, note?: string): Item =>
  note ? { type, en, fr, note } : { type, en, fr }

export const word = (en: string, fr: Answers, note?: string): Item =>
  item('word', en, fr, note)

export const sentence = (en: string, fr: Answers, note?: string): Item =>
  item('sentence', en, fr, note)
