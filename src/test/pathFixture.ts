import { fr } from '../data/fr/index.ts'
import { pathCopy } from '../data/fr/pathCopy.ts'
import { a, cloze, pathTheme, plain, sub, word } from '../data/helpers.ts'
import type { Language, PathConfig } from '../data/types.ts'
import type { Theme } from '../domain/types.ts'

export const PATH_KEY = 'test-path'
export const V2_TEST_KEY = 'test-v2'

const t1 = pathTheme({
  id: 't1',
  name: 'Thème un',
  level: 'A1',
  desc: 'Le premier thème.',
  note: {
    title: 'Mon, ma, mes',
    rule: 'The possessive agrees with the thing owned.',
    table: {
      head: ['', 'masc.', 'fém.'],
      rows: [['my', 'mon', 'ma']],
    },
    exceptions: ['Before a vowel, ma becomes mon: mon amie.'],
  },
  subThemes: [
    sub('s1', 'Premier', [
      cloze(
        'mere',
        'the mother',
        [a('la mère')],
        "C'est {la mère} de Paul.",
        "This is Paul's mother.",
      ),
      plain('pere', 'the father', [a('le père')]),
    ]),
    sub('s2', 'Second', [
      plain('frere', 'the brother', [a('le frère')]),
      plain('soeur', 'the sister', [a('la sœur')]),
    ]),
  ],
})

const t2 = pathTheme({
  id: 't2',
  name: 'Thème deux',
  level: 'A1',
  desc: 'Le deuxième thème.',
  subThemes: [
    sub('a', 'Animaux', [
      plain('chat', 'the cat', [a('le chat')]),
      plain('chien', 'the dog', [a('le chien')]),
    ]),
    sub('b', 'Ferme', [plain('vache', 'the cow', [a('la vache')])]),
  ],
})

const t3 = pathTheme({
  id: 't3',
  name: 'Thème trois',
  level: 'A2',
  desc: 'Le troisième thème.',
  subThemes: [sub('x', 'Pain', [plain('pain', 'the bread', [a('le pain')])])],
})

const old: Theme = {
  id: 'old',
  name: 'Ancien thème',
  level: 'A1',
  desc: 'Un thème hors du parcours.',
  items: [word('the stairs', [a("l'escalier", 'm')])],
}

export const PATH_THEMES = [t1, t2, t3]

/** French interface text over a tiny path of three themes and one old theme. */
export const fixtureLanguage: Language & { path: PathConfig } = {
  code: 'fr',
  name: 'Français',
  storage: { v2: V2_TEST_KEY },
  themes: [t1, t2, t3, old],
  copy: fr.copy,
  path: { themes: ['t1', 't2', 't3'], storageKey: PATH_KEY, copy: pathCopy },
}
