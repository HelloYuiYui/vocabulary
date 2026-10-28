import { describe, expect, it } from 'vitest'
import { a } from '../data/helpers.ts'
import { canOverride, grade, isCorrect, tone } from './grade.ts'
import type { Answer, Gender, Item } from './types.ts'

const item = (...fr: [Answer, ...Answer[]]): Item => ({
  type: 'word',
  en: 'prompt',
  fr,
})

const stairs = item(a("l'escalier", 'm'), a('les escaliers', 'm'))
const wardrobe = item(a("l'armoire", 'f'))
const shelf = item(a("l'étagère", 'f'))
const bedroom = item(a('la chambre'))
const townHall = item(a('la mairie'), a("l'hôtel de ville", 'm'))
const howMuch = item(a("C'est combien ?"))

describe('grade', () => {
  it.each<[string, Gender | null, Item, string]>([
    ["l'escalier", null, stairs, 'gender-missing'],
    ["l'escalier", 'f', item(a("l'escalier", 'm')), 'gender'],
    ['l’escalier', 'm', item(a("l'escalier", 'm')), 'ok'],
    ['un escalier', null, item(a("l'escalier", 'm')), 'elision'],
    ['une armoire', null, wardrobe, 'elision'],
    ['le escalier', null, item(a("l'escalier", 'm')), 'article'],
    ['chambre', null, bedroom, 'article'],
    ['la mairie', null, townHall, 'ok'],
    ["l'etagere", 'f', shelf, 'accent'],
    ["c'est combien", null, howMuch, 'ok'],
    ['', null, stairs, 'empty'],
  ])('grades %j with gender %s as %s', (input, gender, target, verdict) => {
    expect(grade(input, gender, target).verdict).toBe(verdict)
  })

  it('returns the matched answer', () => {
    expect(grade('les escaliers', 'm', stairs).answer).toEqual(
      a('les escaliers', 'm'),
    )
    expect(grade("l'hôtel de ville", 'm', townHall).answer.text).toBe(
      "l'hôtel de ville",
    )
  })

  it('falls back to the preferred answer when wrong', () => {
    expect(grade('la porte', null, bedroom)).toEqual({
      verdict: 'bad',
      answer: a('la chambre'),
    })
  })

  it('flags the wrong gender from an indefinite article', () => {
    expect(grade('un armoire', null, wardrobe).verdict).toBe('gender')
  })

  it('ignores case, hyphens and punctuation', () => {
    const groundFloor = item(a('le rez-de-chaussée'))
    expect(grade('Le rez de chaussée !', null, groundFloor).verdict).toBe('ok')
  })

  it('accepts oe for œ as an accent slip', () => {
    expect(grade('le coeur', null, item(a('le cœur'))).verdict).toBe('accent')
    expect(grade("l'oeil", 'm', item(a("l'œil", 'm'))).verdict).toBe('accent')
  })

  it('treats whitespace-only input as empty', () => {
    expect(grade('   ', null, bedroom).verdict).toBe('empty')
  })
})

describe('verdict helpers', () => {
  it('counts ok, accent and elision as correct', () => {
    expect(isCorrect('ok')).toBe(true)
    expect(isCorrect('accent')).toBe(true)
    expect(isCorrect('elision')).toBe(true)
    expect(isCorrect('article')).toBe(false)
  })

  it('maps verdicts to tones', () => {
    expect(tone('elision')).toBe('ok')
    expect(tone('gender-missing')).toBe('near')
    expect(tone('dunno')).toBe('bad')
  })

  it('only allows overriding an attempted wrong answer', () => {
    expect(canOverride('bad')).toBe(true)
    expect(canOverride('article')).toBe(true)
    expect(canOverride('dunno')).toBe(false)
    expect(canOverride('empty')).toBe(false)
    expect(canOverride('ok')).toBe(false)
  })
})
