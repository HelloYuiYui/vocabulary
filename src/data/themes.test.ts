import { describe, expect, it } from 'vitest'
import type { Theme } from '../domain/types.ts'
import { bg } from './bg/index.ts'
import { fr } from './fr/index.ts'
import { pl } from './pl/index.ts'
import { LANGUAGES } from './language.ts'

const answersOf = (themes: Theme[]) =>
  themes.flatMap((t) =>
    t.items.flatMap((item) =>
      item.answers.map((answer) => ({ theme: t.id, answer })),
    ),
  )

// Case-sensitive on purpose: sentences start with a capital ("L'appartement
// est…") and never carry a gender.
describe('French answer genders', () => {
  const answers = answersOf(fr.themes)

  it("marks every answer starting with l' or les", () => {
    const missing = answers.filter(
      ({ answer }) => /^(l'|les )/.test(answer.text) && !answer.gender,
    )
    expect(missing).toEqual([])
  })

  it('leaves answers whose article shows the gender unmarked', () => {
    const extra = answers.filter(
      ({ answer }) => /^(le|la|un|une) /.test(answer.text) && answer.gender,
    )
    expect(extra).toEqual([])
  })
})

// Latin a, e, o, c, p, x look like Cyrillic letters but never match them.
describe('Bulgarian answers', () => {
  it('are written in Cyrillic only', () => {
    const latin = answersOf(bg.themes).filter(({ answer }) =>
      /[a-z]/i.test(answer.text),
    )
    expect(latin).toEqual([])
  })
})

// Catches letters from other alphabets, and accents Polish doesn't use.
describe('Polish answers', () => {
  it('use only the Polish alphabet', () => {
    const foreign = answersOf(pl.themes).filter(
      ({ answer }) => !/^[a-ząćęłńóśźż0-9 ,.!?„”-]+$/i.test(answer.text),
    )
    expect(foreign).toEqual([])
  })
})

describe.each(LANGUAGES)('$code themes', ({ themes }) => {
  it('marks prompts ending in . ? or ! as sentences, and only those', () => {
    const wrong = themes.flatMap((t) =>
      t.items
        .filter((item) => (item.type === 'sentence') !== /[.?!]$/.test(item.en))
        .map((item) => `${t.id}: ${item.en}`),
    )
    expect(wrong).toEqual([])
  })

  // Storage keys are built from theme ids and English prompts.
  it('has unique theme ids', () => {
    const ids = themes.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(themes)('has unique prompts in $id', (theme) => {
    const prompts = theme.items.map((item) => item.en)
    expect(new Set(prompts).size).toBe(prompts.length)
  })
})
