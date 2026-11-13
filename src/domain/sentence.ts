import type { Answer, Sentence } from './types.ts'

export interface SentenceParts {
  before: string
  blank: string
  after: string
}

/** Splits a sentence around its {blank}; undefined unless it has exactly one. */
export function parseSentence(text: string): SentenceParts | undefined {
  const m = /^([^{}]*)\{([^{}]+)\}([^{}]*)$/.exec(text)
  if (!m) return undefined
  return { before: m[1] ?? '', blank: m[2] ?? '', after: m[3] ?? '' }
}

/** The form that fills the blank, as an answer. */
export const sentenceAnswer = (sentence: Sentence): Answer => {
  const text = parseSentence(sentence.text)?.blank ?? ''
  return sentence.gender ? { text, gender: sentence.gender } : { text }
}
