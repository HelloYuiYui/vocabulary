export type Gender = 'm' | 'f'
export type Level = 'A1' | 'A1–A2' | 'A2' | 'B1' | 'B2'

export interface Answer {
  text: string // "l'escalier"
  gender?: Gender // only when the article hides it (l', les)
}

export interface Item {
  en: string // English prompt, unique within its theme
  fr: [Answer, ...Answer[]] // first entry is the preferred answer
  note?: string
}

export interface Theme {
  id: string // stable slug, used in storage keys
  name: string
  level: Level
  desc: string
  items: Item[]
}
