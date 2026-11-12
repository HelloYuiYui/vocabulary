import { describe, expect, it } from 'vitest'
import type { Theme } from '../domain/types.ts'
import { bg } from './bg/index.ts'
import { fr } from './fr/index.ts'
import { pl } from './pl/index.ts'
import { a, cloze, pathTheme, plain, sentence, sub } from './helpers.ts'
import { LANGUAGES } from './language.ts'
import { pathProblems } from './pathChecks.ts'

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

describe.each(LANGUAGES)('$code themes on the path', ({ code, themes }) => {
  it('have sound sub-themes and sentences', () => {
    expect(themes.flatMap((t) => pathProblems(t, code === 'fr'))).toEqual([])
  })
})

describe('pathProblems', () => {
  const mere = cloze(
    'mere',
    'the mother',
    [a('la mère')],
    "C'est {la mère} de Paul.",
    "This is Paul's mother.",
  )
  const themeOf = (...subThemes: ReturnType<typeof sub>[]) =>
    pathTheme({ id: 't', name: 'T', level: 'A1', desc: 'd', subThemes })
  const problemsOf = (...items: Parameters<typeof sub>[2]) =>
    pathProblems(themeOf(sub('s', 'S', items)), true)

  it('finds nothing wrong with a sound theme', () => {
    expect(problemsOf(mere, plain('zero', 'zero', [a('zéro')]))).toEqual([])
  })

  it('ignores a theme without sub-themes', () => {
    const theme = { id: 't', name: 'T', level: 'A1' as const, desc: 'd' }
    expect(pathProblems({ ...theme, items: [mere] }, true)).toEqual([])
  })

  it('reports repeated sub-theme and item ids', () => {
    const theme = themeOf(sub('s', 'S', [mere]), sub('s', 'S', [mere]))
    expect(pathProblems(theme, true)).toEqual([
      't: sub-theme id "s" is used twice',
      't: item id "mere" is used twice',
    ])
  })

  it('reports items that are not the sub-themes flattened', () => {
    const theme = { ...themeOf(sub('s', 'S', [mere])), items: [] }
    expect(pathProblems(theme, true)).toEqual([
      't: items are not the sub-themes flattened',
    ])
  })

  it('reports an empty or oversized sub-theme', () => {
    const many = Array.from({ length: 13 }, (_, i) =>
      plain(`n${i}`, `n${i}`, [a('x')]),
    )
    expect(pathProblems(themeOf(sub('s', 'S', [])), true)).toEqual([
      't: sub-theme "s" has 0 items, not 1 to 12',
    ])
    expect(problemsOf(...many)).toEqual([
      't: sub-theme "s" has 13 items, not 1 to 12',
    ])
  })

  it('reports a missing or malformed id', () => {
    const noId = { ...mere }
    delete noId.id
    expect(problemsOf(noId)).toEqual(['t: "the mother" has no slug id'])
    expect(problemsOf({ ...mere, id: 'La Mère' })).toEqual([
      't: "La Mère" has no slug id',
    ])
  })

  it('reports a whole-sentence item', () => {
    const item = { ...sentence('Hello.', [a('Bonjour.')]), id: 'hello' }
    expect(problemsOf(item)).toEqual(['t: "hello" is a whole-sentence item'])
  })

  it.each(['No blank.', 'Two {a} and {b}.', 'Empty {} here.'])(
    'reports a sentence without exactly one blank: %s',
    (text) => {
      expect(problemsOf(cloze('x', 'x', [a('x')], text, 'x'))).toEqual([
        't: "x" needs exactly one {blank}',
      ])
    },
  )

  it('reports a missing translation', () => {
    expect(problemsOf(cloze('x', 'x', [a('x')], '{x}.', ' '))).toEqual([
      't: "x" has no translation',
    ])
  })

  it("reports a blank starting with l' or les that has no gender", () => {
    const oncle = cloze(
      'o',
      'the uncle',
      [a("l'oncle", 'm')],
      "{L'oncle}.",
      'x',
    )
    const amis = cloze('a', 'friends', [a('les amis', 'm')], '{les amis}.', 'x')
    expect(problemsOf(oncle, amis)).toEqual([
      't: "o" needs a gender for its blank',
      't: "a" needs a gender for its blank',
    ])
  })

  it('reports a gender on a blank that shows it', () => {
    const item = cloze('x', 'x', [a('la mère')], '{la mère}.', 'x', {
      gender: 'f',
    })
    expect(problemsOf(item)).toEqual([
      't: "x" has a gender its blank does not need',
    ])
  })

  it.each(['ma mère', 'du pain', "de l'eau", 'leurs enfants'])(
    'reports a possessive or partitive in the blank: %s',
    (blank) => {
      expect(problemsOf(cloze('x', 'x', [a('x')], `{${blank}}.`, 'x'))).toEqual(
        ['t: "x" has a possessive or partitive in its blank'],
      )
    },
  )

  it('allows words that merely begin like a possessive', () => {
    const item = cloze('x', 'x', [a('x')], '{la maison}.', 'x')
    const montagne = cloze('y', 'y', [a('y')], '{montagne}.', 'y')
    expect(problemsOf(item, montagne)).toEqual([])
  })

  it('reports a blank whose gender no dictionary form has', () => {
    const oncle = cloze('o', 'x', [a("l'oncle", 'm')], "{l'oncle}.", 'x', {
      gender: 'f',
    })
    const amie = cloze('a', 'y', [a('une amie')], "{l'amie}.", 'y', {
      gender: 'm',
    })
    expect(problemsOf(oncle, amie)).toEqual([
      't: "o" has a blank whose gender matches no answer',
      't: "a" has a blank whose gender matches no answer',
    ])
  })

  it('accepts a blank whose gender one of the dictionary forms has', () => {
    const twins = cloze(
      'j',
      'the twins',
      [a('les jumeaux', 'm'), a('les jumelles', 'f')],
      '{les jumelles}.',
      'x',
      { gender: 'f' },
    )
    const amie = cloze('a', 'y', [a('une amie')], "{l'amie}.", 'y', {
      gender: 'f',
    })
    expect(problemsOf(twins, amie)).toEqual([])
  })

  it('applies the French article rules to French only', () => {
    const item = cloze('x', 'x', [a('x')], '{les x}.', 'x')
    expect(pathProblems(themeOf(sub('s', 'S', [item])), false)).toEqual([])
  })
})
