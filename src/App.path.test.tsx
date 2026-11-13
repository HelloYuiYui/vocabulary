import { render, screen, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { fr } from './data/fr/index.ts'
import { LEGACY_FLAG_KEY } from './storage/pathStorage.ts'
import { V2_KEY } from './storage/storage.ts'

// A random of 0.999 makes shuffled() keep the order of the cards.
beforeEach(() => {
  localStorage.clear()
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
  it('runs through the four converted themes, in order', () => {
    expect(fr.path?.themes).toEqual([
      'presentation',
      'famille',
      'chiffres-dates',
      'description',
    ])
    setup()
    expect(
      screen.getAllByRole('region').map((r) => r.getAttribute('aria-label')),
    ).toEqual([
      'Se présenter',
      'Famille et entourage',
      'Chiffres, dates, heure',
      'Description simple',
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

describe('the other French themes', () => {
  it('are hidden without the flag', () => {
    setup()
    expect(screen.queryByRole('button', { name: 'Autres thèmes' })).toBeNull()
    expect(screen.queryByText('Chez soi')).toBeNull()
  })

  it('open in the old picker with the flag, without the converted themes', async () => {
    localStorage.setItem(LEGACY_FLAG_KEY, 'true')
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Autres thèmes' }))
    expect(
      screen.getByRole('checkbox', { name: /Chez soi/ }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: /Se présenter/ })).toBeNull()
    expect(screen.getAllByRole('checkbox')).toHaveLength(12)
    expect(
      screen.getByText(/On te donne le mot en anglais/),
    ).toBeInTheDocument()
  })
})

describe('the other languages', () => {
  it.each([
    ['Български', 'Представяне'],
    ['Polski', 'Przedstawianie się'],
  ])(
    '%s is on the path too, with its first theme open',
    async (name, first) => {
      const user = setup()
      await user.click(screen.getByRole('button', { name }))
      expect(screen.getAllByRole('region')).toHaveLength(4)
      expect(theme(first).getAllByRole('button').length).toBeGreaterThan(3)
      expect(screen.queryByRole('checkbox')).toBeNull()
    },
  )
})
