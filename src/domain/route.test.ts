import { describe, expect, it } from 'vitest'
import { formatRoute, parseRoute, type Route } from './route.ts'

const routes: [string, Route][] = [
  ['#/fr', { lang: 'fr', page: { name: 'path' } }],
  [
    '#/bg/note/semeystvo',
    { lang: 'bg', page: { name: 'note', themeId: 'semeystvo' } },
  ],
  [
    '#/fr/note/famille/membres',
    { lang: 'fr', page: { name: 'note', themeId: 'famille', then: 'membres' } },
  ],
  ['#/pl/sitting', { lang: 'pl', page: { name: 'sitting' } }],
  ['#/fr/sitting/end', { lang: 'fr', page: { name: 'end' } }],
]

describe('routes', () => {
  it.each(routes)('reads %s', (hash, route) => {
    expect(parseRoute(hash)).toEqual(route)
  })

  it.each(routes)('writes %s', (hash, route) => {
    expect(formatRoute(route)).toBe(hash)
  })

  it('ignores a trailing slash', () => {
    expect(parseRoute('#/fr/')).toEqual({ lang: 'fr', page: { name: 'path' } })
  })

  it.each([
    '',
    '#',
    '#/',
    '#fr',
    '#/fr/nowhere',
    '#/fr/note',
    '#/fr/sitting/x',
  ])('reads nothing from %j', (hash) => {
    expect(parseRoute(hash)).toBeUndefined()
  })
})
