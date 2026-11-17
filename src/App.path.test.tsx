import { render, screen, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { LANGUAGE_KEY } from './storage/storage.ts'
import { bg } from './data/bg/index.ts'
import { fr } from './data/fr/index.ts'
import { pl } from './data/pl/index.ts'

const V2_KEY = 'cahier-vocab-v2' // the old picker's French progress

// A random of 0.999 makes shuffled() keep the order of the cards.
// A returning learner, who has chosen French: the bare address opens the path.
beforeEach(() => {
  localStorage.clear()
  localStorage.setItem(LANGUAGE_KEY, JSON.stringify('fr'))
  vi.spyOn(Math, 'random').mockReturnValue(0.999)
})
afterEach(() => vi.restoreAllMocks())

const setup = () => {
  const user = userEvent.setup()
  render(<App />)
  return user
}
const theme = (name: string) => within(screen.getByRole('region', { name }))
const answer = async (user: UserEvent, text: string) => {
  await user.type(screen.getByRole('textbox'), `${text}{Enter}`)
  await user.keyboard('{Enter}')
}

describe('French on the path', () => {
  it('runs through the converted themes, in order', () => {
    expect(fr.path?.themes).toEqual([
      'presentation',
      'famille',
      'cafe',
      'description',
      'routine',
      'chiffres-dates',
      'courses',
      'ville',
      'transports',
      'meteo',
      'nature',
      'loisirs',
      'vetements',
      'chez-soi',
      'vacances',
      'ecrits-courts',
      'raconter',
      'corps',
      'sante',
    ])
    setup()
    expect(
      screen.getAllByRole('region').map((r) => r.getAttribute('aria-label')),
    ).toEqual([
      'Se présenter',
      'Famille et entourage',
      'Au café',
      'Description simple',
      'Routine quotidienne',
      'Chiffres, dates, heure',
      'Nourriture et courses',
      'La ville et les itinéraires',
      'Transports',
      'Météo et saisons',
      'La nature et les animaux',
      'Goûts et loisirs',
      'Vêtements',
      'Chez soi',
      'Les vacances',
      'Écrits courts',
      'Raconter au passé',
      'Le corps',
      'Santé',
    ])
  })

  it('names only themes that exist and have sub-themes', () => {
    for (const id of fr.path?.themes ?? []) {
      const found = fr.themes.find((t) => t.id === id)
      expect(found?.subThemes?.length, id).toBeGreaterThan(0)
    }
  })

  it('opens with Se présenter open and the rest locked', () => {
    setup()
    expect(
      theme('Se présenter').getByRole('button', { name: /L'identité/ }),
    ).toBeInTheDocument()
    expect(theme('Famille et entourage').queryAllByRole('button')).toEqual([])
    expect(screen.queryByRole('button', { name: 'Commencer' })).toBeNull()
    expect(screen.queryByRole('checkbox')).toBeNull()
  })

  it('explains the path, not the old English-prompt flow', () => {
    setup()
    expect(screen.getByText(/Suis le parcours/)).toBeInTheDocument()
    expect(screen.queryByText(/On te donne le mot en anglais/)).toBeNull()
  })

  it('teaches a real sub-theme from note to done', async () => {
    const user = setup()
    await user.click(
      theme('Se présenter').getByRole('button', { name: /L'identité/ }),
    )
    expect(
      screen.getByRole('heading', { name: 'Être et avoir au présent' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continuer' }))

    expect(screen.getByTestId('cloze-sentence')).toHaveTextContent(
      'the first name de ma sœur est Julie.',
    )
    await answer(user, 'le prénom')
    // The dictionary form is right, and the card shows the sentence's form.
    await user.type(screen.getByRole('textbox'), 'le nom{Enter}')
    expect(screen.getByTestId('needed-form')).toHaveTextContent(
      'le nom de famille',
    )
    await user.keyboard('{Enter}')
    await user.type(screen.getByRole('textbox'), "l'âge")
    await user.click(screen.getByRole('radio', { name: 'M' }))
    await user.keyboard('{Enter}')
    expect(screen.getAllByText('Juste !')[0]).toBeInTheDocument()
    await user.keyboard('{Enter}')
    for (const text of [
      'ans',
      'la nationalité',
      'la date de naissance',
      'le lieu de naissance',
      'né',
      "m'appelle",
      'comment',
    ])
      await answer(user, text)

    expect(screen.getByText('Séance terminée')).toBeInTheDocument()
    expect(
      screen.getByText('Toutes les cartes du premier coup.'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retour au parcours' }))
    expect(
      theme('Se présenter').getByRole('button', { name: /L'identité/ }),
    ).toHaveTextContent('fait')
  })

  it('leaves saved v2 data untouched', async () => {
    const v2 = JSON.stringify({
      version: 2,
      mode: 'list',
      review: [{ themeId: 'chez-soi', en: 'the stairs' }],
      scores: {},
    })
    localStorage.setItem(V2_KEY, v2)
    const user = setup()
    await user.click(
      theme('Se présenter').getByRole('button', { name: /L'identité/ }),
    )
    expect(localStorage.getItem(V2_KEY)).toBe(v2)
  })
})

describe('the French themes not on the path yet', () => {
  it('are not shown, even with the old ?legacy=1 switch', () => {
    window.history.pushState({}, '', '/?legacy=1')
    localStorage.setItem('cahier-vocab-legacy', 'true')
    setup()
    window.history.pushState({}, '', '/')
    expect(screen.queryByText("Décrire quelqu'un")).toBeNull()
    expect(screen.queryByRole('button', { name: 'Autres thèmes' })).toBeNull()
    expect(screen.queryByRole('checkbox')).toBeNull()
  })

  it('are still in the language pack, ready to be converted', () => {
    const offPath = fr.themes.filter((t) => !fr.path.themes.includes(t.id))
    expect(offPath.map((t) => t.id)).toContain('portrait')
    expect(offPath).toHaveLength(2)
  })
})

describe('the other languages', () => {
  it.each([
    ['Български', 'Представяне', bg.path.themes.length],
    ['Polski', 'Przedstawianie się', pl.path.themes.length],
  ])(
    '%s is on the path too, with its first theme open',
    async (name, first, count) => {
      const user = setup()
      await user.click(screen.getByRole('button', { name }))
      expect(screen.getAllByRole('region')).toHaveLength(count)
      expect(theme(first).getAllByRole('button').length).toBeGreaterThan(3)
      expect(screen.queryByRole('checkbox')).toBeNull()
    },
  )
})
