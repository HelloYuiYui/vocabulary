import type { Verdict } from '../domain/grade.ts'
import type { Gender, Theme } from '../domain/types.ts'

/** The interface text shared by every screen, in the language being learnt. */
export interface Copy {
  header: { eyebrow: string; title: string }
  card: {
    prompt: string // above an English prompt, for a card without a sentence
    /** The label above the answer, given the English prompt. */
    answerLabel: (en: string) => string
    placeholder: string
    check: string
    dunno: string
    next: string
  }
  verdicts: Record<Verdict, string>
  alsoAccepted: string
  override: string
  gender: { label: string } & Record<Gender, { short: string; long: string }>
  languageLabel: string // accessible name of the language switcher
}

/** The text of the path and of its sittings, in the language being learnt. */
export interface PathCopy {
  intro: string // under the title
  sentencePrompt: string // above a cloze sentence
  formNeeded: string // before the form the sentence needed
  /**
   * Shown when l' or les is typed and no gender is picked yet. Only a
   * language with that rule sets it; without it, checking is never held back.
   */
  pickGender?: string
  listen: string // accessible name of the audio button
  review: (count: number) => string
  cards: (count: number) => string // the size of a sub-theme
  left: (count: number) => string // cards still to answer right in a sitting
  leave: string // leaves a sitting without recording it
  subThemeDone: string
  locked: string
  quiz: string
  quizHelp: string
  note: string
  noteContinue: string
  backToPath: string
  exportSitting: string // downloads the cards of the sitting just finished
  exportLearnt: string // downloads every card learnt so far
  end: {
    title: string
    allFirstTry: string
    retried: (count: number) => string
    quizPassed: (right: number, total: number) => string
    quizFailed: (right: number, total: number) => string
  }
}

/** A language's path: which themes it runs through and where progress is kept. */
export interface PathConfig {
  themes: string[] // theme ids, in path order
  storageKey: string
  copy: PathCopy
}

/** A language the site teaches: its vocabulary and its interface. */
export interface Language {
  code: string // BCP 47 tag, set on <html lang>
  name: string // in the language itself, for the switcher
  /** Every theme of the language; only those named by the path are shown. */
  themes: Theme[]
  copy: Copy
  path: PathConfig
}
