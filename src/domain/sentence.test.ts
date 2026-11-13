import { describe, expect, it } from 'vitest'
import { parseSentence, sentenceAnswer } from './sentence.ts'

describe('parseSentence', () => {
  it('splits a sentence around its blank', () => {
    expect(parseSentence("C'est {la mère} de Paul.")).toEqual({
      before: "C'est ",
      blank: 'la mère',
      after: ' de Paul.',
    })
  })

  it('handles a blank at the start', () => {
    expect(parseSentence('{Le père} travaille.')).toEqual({
      before: '',
      blank: 'Le père',
      after: ' travaille.',
    })
  })

  it.each(['No blank.', 'Two {a} and {b}.', 'Empty {} here.', 'Open {only.'])(
    'rejects %s',
    (text) => {
      expect(parseSentence(text)).toBeUndefined()
    },
  )
})

describe('sentenceAnswer', () => {
  it('builds the sentence answer with its gender', () => {
    expect(
      sentenceAnswer({ text: "Voici {l'oncle} de Léa.", en: 'x', gender: 'm' }),
    ).toEqual({ text: "l'oncle", gender: 'm' })
  })

  it('leaves the gender out when the sentence has none', () => {
    expect(sentenceAnswer({ text: "C'est {la mère}.", en: 'x' })).toEqual({
      text: 'la mère',
    })
  })
})
