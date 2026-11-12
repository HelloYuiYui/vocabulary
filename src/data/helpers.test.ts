import { describe, expect, it } from 'vitest'
import { a, cloze, pathTheme, plain, sub } from './helpers.ts'

const mere = cloze(
  'mere',
  'the mother',
  [a('la mère')],
  "C'est {la mère} de Paul.",
  "This is Paul's mother.",
)

describe('cloze', () => {
  it('builds a cloze item', () => {
    expect(mere).toEqual({
      id: 'mere',
      type: 'word',
      en: 'the mother',
      answers: [{ text: 'la mère' }],
      sentence: {
        text: "C'est {la mère} de Paul.",
        en: "This is Paul's mother.",
      },
    })
  })

  it('omits absent extras and keeps given ones', () => {
    const oncle = cloze(
      'oncle',
      'the uncle',
      [a("l'oncle", 'm')],
      "Voici {l'oncle} de Léa.",
      "Here is Léa's uncle.",
      { gender: 'm', note: 'n' },
    )
    expect(oncle.sentence?.gender).toBe('m')
    expect(oncle.note).toBe('n')
    expect(oncle.sentence && 'audio' in oncle.sentence).toBe(false)
    expect('note' in mere).toBe(false)
  })

  it('keeps an audio file name', () => {
    const item = cloze('x', 'x', [a('x')], '{x}.', 'x.', { audio: 'x.mp3' })
    expect(item.sentence?.audio).toBe('x.mp3')
  })
})

describe('plain', () => {
  it('builds a word with an id and no sentence', () => {
    expect(plain('zero', 'zero', [a('zéro')])).toEqual({
      id: 'zero',
      type: 'word',
      en: 'zero',
      answers: [{ text: 'zéro' }],
    })
  })
})

describe('pathTheme', () => {
  it('flattens sub-themes into items', () => {
    const theme = pathTheme({
      id: 't',
      name: 'T',
      level: 'A1',
      desc: 'd',
      subThemes: [
        sub('s1', 'S1', [mere]),
        sub('s2', 'S2', [plain('zero', 'zero', [a('zéro')])]),
      ],
    })
    expect(theme.items.map((item) => item.id)).toEqual(['mere', 'zero'])
    expect(theme.subThemes?.map((s) => s.id)).toEqual(['s1', 's2'])
  })
})
