import type {
  Answer,
  Gender,
  Item,
  ItemType,
  Sentence,
  SubTheme,
  Theme,
} from '../domain/types.ts'

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

/** A word of a sub-theme that has no sentence yet: asked from its English prompt. */
export const plain = (
  id: string,
  en: string,
  answers: Answers,
  note?: string,
): Item => ({ id, ...word(en, answers, note) })

interface ClozeExtra {
  gender?: Gender // of the blank, when it starts with l' or les
  note?: string
  audio?: string
}

/**
 * A word practised inside a sentence. `text` marks the blank in braces and
 * `en` is the English hint shown in its place.
 */
export const cloze = (
  id: string,
  en: string,
  answers: Answers,
  text: string,
  translation: string,
  { gender, note, audio }: ClozeExtra = {},
): Item => {
  const s: Sentence = { text, en: translation }
  if (gender) s.gender = gender
  if (audio) s.audio = audio
  return { ...plain(id, en, answers, note), sentence: s }
}

export const sub = (id: string, name: string, items: Item[]): SubTheme => ({
  id,
  name,
  items,
})

/** A theme on the path: its items are those of its sub-themes, in order. */
export const pathTheme = (
  theme: Omit<Theme, 'items'> & { subThemes: SubTheme[] },
): Theme => ({ ...theme, items: theme.subThemes.flatMap((s) => s.items) })
