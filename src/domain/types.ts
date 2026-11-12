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

export interface Item {
  type: ItemType
  en: string // English prompt, unique within its theme
  answers: [Answer, ...Answer[]] // first entry is the preferred answer
  note?: string
}

export interface Theme {
  id: string // stable slug, used in storage keys
  name: string
  level: Level
  desc: string
  items: Item[]
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
