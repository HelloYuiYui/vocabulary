export type Gender = 'm' | 'f'
export type Level = 'A1' | 'A1–A2' | 'A2' | 'B1' | 'B2'

export interface Answer {
  text: string // "l'escalier"
  gender?: Gender // only when the article hides it (l', les)
}

/**
 * A word is a single word or set expression, including verb phrases such as
 * "to have a shower". A sentence is a full utterance ending in . ? or !
 */
export type ItemType = 'word' | 'sentence'

/** Which item types a session asks. */
export type ItemFilter = ItemType | 'all'

/** A sentence in the language learnt, with the word to find marked as a blank. */
export interface Sentence {
  text: string // the blank is in braces: "C'est {la mère} de Paul."
  en: string // English translation of the whole sentence
  gender?: Gender // only when the blank starts with l' or les
  audio?: string // file name; absent until the audio exists
}

export interface Item {
  id?: string // stable slug, unique within its theme; required inside a sub-theme
  type: ItemType
  en: string // English prompt, unique within its theme; the hint of a cloze card
  answers: [Answer, ...Answer[]] // dictionary forms; first entry is the preferred answer
  note?: string
  sentence?: Sentence
}

/** A small set of a theme's items, learnt in one sitting. */
export interface SubTheme {
  id: string // stable slug, unique within its theme
  name: string
  items: Item[]
}

/** A reference card: the rule, a small table, then the exceptions. */
export interface GrammarNote {
  title: string // "Mon, ma, mes"
  rule: string // in English, one or two sentences
  table?: { head: string[]; rows: string[][] }
  exceptions?: string[] // in English, with examples in the language learnt
}

export interface Theme {
  id: string // stable slug, used in storage keys
  name: string
  level: Level
  desc: string
  items: Item[] // every item; for a theme on the path, its sub-themes flattened
  subThemes?: SubTheme[]
  note?: GrammarNote
}

export type Mode = 'cards' | 'list'

/** Identifies an item across sessions: a theme id and an English prompt. */
export interface ItemKey {
  themeId: string
  en: string
}

export interface Score {
  right: number
  total: number
  at: string // ISO date
}
