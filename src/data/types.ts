import type { ReactNode } from 'react'
import type { Verdict } from '../domain/grade.ts'
import type { Gender, ItemFilter, Mode, Theme } from '../domain/types.ts'
import type { StorageKeys } from '../storage/storage.ts'

/** Every piece of interface text, written in the language being learnt. */
export interface Copy {
  header: { eyebrow: string; title: string; intro: ReactNode }
  home: {
    chooseThemes: string
    start: string
    noTheme: string
    /** "2 thèmes · 15/40 questions"; total is set when the limit cuts it. */
    selection: (themes: number, questions: number, total?: number) => string
    mode: Record<Mode, string> & { label: string }
    itemFilter: Record<ItemFilter, string> & { label: string }
    sessionLimit: { label: string; all: string }
  }
  review: {
    /** The count arrives already highlighted; the number is for plurals. */
    summary: (highlighted: ReactNode, count: number) => ReactNode
    start: string
    clear: string
  }
  themeCard: {
    stats: (words: number, sentences: number) => string
    lastScore: (right: number, total: number) => string
    show: string
    hide: string
  }
  card: {
    prompt: string
    /** The label above the answer, given the English prompt. */
    answerLabel: (en: string) => string
    placeholder: string
    check: string
    dunno: string
    next: string
    stop: string
  }
  list: {
    eyebrow: string
    help: string
    progress: (answered: number, total: number, right: number) => string
    checkAll: string
  }
  verdicts: Record<Verdict, string>
  alsoAccepted: string
  override: string
  gender: { label: string } & Record<Gender, { short: string; long: string }>
  results: {
    title: string
    scoreLine: (right: number, done: number) => string
    yourAnswers: string
    retry: string
    copyForAnki: string
    copied: string
    copyBox: string
  }
  backToThemes: string
  languageLabel: string // accessible name of the language switcher
}

/** A language the site teaches: its vocabulary and its interface. */
export interface Language {
  code: string // BCP 47 tag, set on <html lang>
  name: string // in the language itself, for the switcher
  storage: StorageKeys // separate per language, so progress never mixes
  themes: Theme[]
  copy: Copy
}
