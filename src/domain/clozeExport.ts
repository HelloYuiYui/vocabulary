import { parseSentence } from './sentence.ts'
import type { Entry } from './session.ts'
import type { Item } from './types.ts'

/**
 * A card's sentence with its blank written as [[word:hint]], the format the
 * owner's own flashcard tooling reads. The word is the form in the sentence.
 */
export function clozeMarkup(item: Item): string | undefined {
  const parts = item.sentence && parseSentence(item.sentence.text)
  if (!parts) return undefined
  return `${parts.before}[[${parts.blank}:${item.en}]]${parts.after}`
}

const field = (text: string): string => `"${text.replace(/"/g, '""')}"`

/**
 * Cards as CSV, one row per card: the marked sentence, then its translation.
 * No header row. Cards without a sentence are left out, and a card asked
 * more than once is written once.
 */
export function clozeCsv(entries: Entry[]): string {
  const seen = new Set<string>()
  let csv = ''
  for (const { themeId, item } of entries) {
    const marked = clozeMarkup(item)
    const key = `${themeId}/${item.id ?? item.en}`
    if (!marked || !item.sentence || seen.has(key)) continue
    seen.add(key)
    csv += `${field(marked)},${field(item.sentence.en)}\r\n`
  }
  return csv
}
