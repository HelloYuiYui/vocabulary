import { describe, expect, it } from 'vitest'
import { a, cloze, word } from '../data/helpers.ts'
import { gradeCloze, gradeItem } from './cloze.ts'
import { grade, type Verdict } from './grade.ts'
import type { Gender, Item } from './types.ts'

const items = {
  mere: cloze(
    'mere',
    'the mother',
    [a('la mère'), a('la maman')],
    "C'est {une mère} formidable.",
    'She is a wonderful mother.',
  ),
  pere: cloze(
    'pere',
    'the father',
    [a('le père')],
    '{Le père} de Paul travaille.',
    "Paul's father works.",
  ),
  // The sentence is written with a curly apostrophe; learners type a straight one.
  oncle: cloze(
    'oncle',
    'the uncle',
    [a("l'oncle", 'm')],
    'Voici {l’oncle} de Léa.',
    "Here is Léa's uncle.",
    { gender: 'm' },
  ),
  enfants: cloze(
    'enfants',
    'the children',
    [a('les enfants', 'm')],
    'Ils ont {des enfants}.',
    'They have children.',
  ),
  habiter: cloze(
    'habiter',
    'to live',
    [a('habiter')],
    "J'{habite} à Lyon.",
    'I live in Lyon.',
  ),
  // Dictionary forms elide; the sentence uses an article that does not.
  ami: cloze('ami', 'the friend', [a("l'ami", 'm')], "J'ai {un ami}.", 'x'),
  ecole: cloze(
    'ecole',
    'the school',
    [a("l'école", 'f')],
    "C'est {une école}.",
    'x',
  ),
} satisfies Record<string, Item>

type Row = [keyof typeof items, string, Gender | null, Verdict, string?]

const rows: Row[] = [
  ['mere', 'une mère', null, 'ok'],
  ['mere', 'la mère', null, 'ok', 'une mère'],
  ['mere', 'la maman', null, 'ok', 'une mère'],
  ['mere', 'une mere', null, 'accent'],
  ['mere', 'un mère', null, 'gender'],
  ['mere', 'le mère', null, 'gender'],
  ['mere', 'mère', null, 'article'],
  ['pere', 'le père', null, 'ok'],
  ['pere', 'Le père', null, 'ok'],
  ['pere', 'un père', null, 'ok', 'Le père'],
  ['oncle', "l'oncle", 'm', 'ok'],
  ['oncle', 'l’oncle', 'm', 'ok'],
  ['oncle', "l'oncle", null, 'gender-missing'],
  ['oncle', "l'oncle", 'f', 'gender'],
  ['oncle', 'un oncle', null, 'elision', 'l’oncle'],
  ['oncle', 'le oncle', null, 'article'],
  ['ami', 'un ami', null, 'ok'],
  ['ami', "l'ami", 'm', 'ok', 'un ami'],
  ['ami', 'le ami', null, 'article'],
  ['ami', 'la ami', null, 'article'],
  ['ami', 'une ami', null, 'gender'],
  ['ecole', 'une école', null, 'ok'],
  ['ecole', 'la école', null, 'article'],
  ['ecole', 'la ecole', null, 'article'],
  ['ecole', 'le école', null, 'article'],
  ['enfants', 'les enfants', 'm', 'ok', 'des enfants'],
  ['enfants', 'des enfants', null, 'ok'],
  ['habiter', 'habite', null, 'ok'],
  ['habiter', 'habiter', null, 'ok', 'habite'],
  ['habiter', 'habites', null, 'bad'],
  ['habiter', '', null, 'empty'],
]

describe('gradeCloze', () => {
  it.each(rows)('%s: "%s" (%s) is %s', (key, input, gender, verdict, form) => {
    const result = gradeCloze(input, gender, items[key])
    expect(result.verdict).toBe(verdict)
    expect(result.form?.text).toBe(form)
  })

  it('swaps les and des freely when the gender does not show', () => {
    const amis = cloze(
      'amis',
      'friends',
      [a('des amis')],
      'Voici {les amis} de Léa.',
      "Here are Léa's friends.",
      { gender: 'm' },
    )
    const result = gradeCloze('des amis', null, amis)
    expect(result.verdict).toBe('ok')
    expect(result.form).toEqual({ text: 'les amis', gender: 'm' })
  })

  it('carries the gender of the form the sentence needed', () => {
    expect(gradeCloze('un oncle', null, items.oncle).form).toEqual({
      text: 'l’oncle',
      gender: 'm',
    })
  })
})

describe('gradeItem', () => {
  const salon = word('the living room', [a('le salon')])

  it.each(['le salon', 'salon', 'la salon', 'x', ''])(
    'grades an item without a sentence as before: "%s"',
    (input) => {
      expect(gradeItem(input, null, salon)).toEqual(grade(input, null, salon))
    },
  )

  it('grades an item with a sentence as a cloze card', () => {
    expect(gradeItem('la mère', null, items.mere).form?.text).toBe('une mère')
  })
})
