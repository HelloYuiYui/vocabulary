import { describe, expect, it } from 'vitest'
import { THEMES } from './themes.ts'

const answers = THEMES.flatMap((t) =>
  t.items.flatMap((item) => item.fr.map((answer) => ({ theme: t.id, answer }))),
)

// Case-sensitive on purpose: sentences start with a capital ("L'appartement
// est…") and never carry a gender.
describe('answer genders', () => {
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

// Storage keys are built from theme ids and English prompts.
describe('storage keys', () => {
  it('has unique theme ids', () => {
    const ids = THEMES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(THEMES)('has unique prompts in $id', (theme) => {
    const prompts = theme.items.map((item) => item.en)
    expect(new Set(prompts).size).toBe(prompts.length)
  })
})
