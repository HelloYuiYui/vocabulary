import { describe, expect, it } from 'vitest'
import { a, cloze, plain } from '../data/helpers.ts'
import { clozeCsv, clozeMarkup } from './clozeExport.ts'
import type { Entry } from './session.ts'

const mere = cloze(
  'mere',
  'the mother',
  [a('la mère'), a('la maman')],
  "C'est {une mère} formidable.",
  'She is a wonderful mother.',
)
const pere = cloze(
  'pere',
  'the father',
  [a('le père')],
  '{Le père} de Paul travaille.',
  "Paul's father works.",
)
const entry = (item: Entry['item'], themeId = 't'): Entry => ({ themeId, item })

describe('clozeMarkup', () => {
  it('puts the word and its hint where the blank is', () => {
    expect(clozeMarkup(mere)).toBe("C'est [[une mère:the mother]] formidable.")
  })

  it('uses the form in the sentence, not the dictionary form', () => {
    expect(clozeMarkup(pere)).toBe('[[Le père:the father]] de Paul travaille.')
  })

  it('has nothing to give for an item without a sentence', () => {
    expect(clozeMarkup(plain('zero', 'zero', [a('zéro')]))).toBeUndefined()
  })
})

describe('clozeCsv', () => {
  it('writes one row per card: the marked sentence, then the translation', () => {
    expect(clozeCsv([entry(mere), entry(pere)])).toBe(
      '"C\'est [[une mère:the mother]] formidable.","She is a wonderful mother."\r\n' +
        '"[[Le père:the father]] de Paul travaille.","Paul\'s father works."\r\n',
    )
  })

  it('has no header row', () => {
    expect(clozeCsv([entry(mere)]).split('\r\n')[0]).toContain('[[une mère')
  })

  it('keeps commas inside a field and doubles quotation marks', () => {
    const item = cloze(
      'x',
      'hello',
      [a('bonjour')],
      'Il dit « {bonjour} », puis "salut".',
      'He says "hello", then "hi".',
    )
    expect(clozeCsv([entry(item)])).toBe(
      '"Il dit « [[bonjour:hello]] », puis ""salut"".","He says ""hello"", then ""hi""."\r\n',
    )
  })

  it('leaves out cards that have no sentence', () => {
    const csv = clozeCsv([
      entry(plain('zero', 'zero', [a('zéro')])),
      entry(mere),
    ])
    expect(csv.trim().split('\r\n')).toHaveLength(1)
  })

  it('writes a card once, however often it was asked', () => {
    expect(
      clozeCsv([entry(mere), entry(pere), entry(mere)])
        .trim()
        .split('\r\n'),
    ).toHaveLength(2)
  })

  it('keeps cards of different themes that share an id', () => {
    expect(
      clozeCsv([entry(mere, 't1'), entry(mere, 't2')])
        .trim()
        .split('\r\n'),
    ).toHaveLength(2)
  })

  it('is empty when there is nothing to export', () => {
    expect(clozeCsv([])).toBe('')
    expect(clozeCsv([entry(plain('zero', 'zero', [a('zéro')]))])).toBe('')
  })
})
