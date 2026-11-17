import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { LANGUAGE_KEY } from './storage/storage.ts'

const FR_PATH_KEY = 'cahier-vocab-path-v1'
const NOTE = 'Être et avoir au présent' // the note of Se présenter
const SUB = /L'identité/

// A random of 0.999 makes shuffled() keep the order of the cards.
// A returning learner, who has chosen French: the bare address opens the path.
beforeEach(() => {
  localStorage.clear()
  localStorage.setItem(LANGUAGE_KEY, JSON.stringify('fr'))
  vi.spyOn(Math, 'random').mockReturnValue(0.999)
})
afterEach(() => vi.restoreAllMocks())

const setup = (hash = '') => {
  if (hash) history.replaceState(null, '', hash)
  const user = userEvent.setup()
  render(<App />)
  return user
}
const theme = (name: string) => within(screen.getByRole('region', { name }))
const pathShown = () =>
  expect(
    screen.getByRole('heading', { name: 'Cahier de vocabulaire' }),
  ).toBeInTheDocument()
const onPath = () =>
  waitFor(() => {
    expect(location.hash).toBe('#/fr')
    expect(screen.getAllByRole('region')[0]).toHaveAccessibleName(
      'Se présenter',
    )
  })
const browserBack = () => act(() => history.back())
const answer = async (user: UserEvent, text: string) => {
  await user.type(screen.getByRole('textbox'), `${text}{Enter}`)
  await user.keyboard('{Enter}')
}
const notesSeen = () => {
  localStorage.setItem(
    FR_PATH_KEY,
    JSON.stringify({
      version: 1,
      done: [],
      cards: {},
      notesSeen: ['presentation'],
    }),
  )
}
const startSitting = async (user: UserEvent) => {
  await user.click(theme('Se présenter').getByRole('button', { name: SUB }))
  expect(location.hash).toBe('#/fr/sitting')
}
const dialog = () => screen.getByRole('dialog', { name: 'Arrêter la séance ?' })

describe('page addresses', () => {
  it('gives the path the address of the saved language', () => {
    localStorage.setItem(LANGUAGE_KEY, JSON.stringify('bg'))
    setup()
    expect(location.hash).toBe('#/bg')
  })

  it('opens the language its address names, and remembers it', () => {
    setup('#/pl')
    expect(
      screen.getByRole('heading', { name: 'Zeszyt słówek' }),
    ).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(LANGUAGE_KEY) ?? 'null')).toBe('pl')
  })

  it('sends an unknown address to the path', () => {
    setup('#/xx/nowhere')
    pathShown()
    expect(location.hash).toBe('#/fr')
  })

  it('goes back from a theme’s note to the path', async () => {
    const user = setup()
    await user.click(theme('Se présenter').getByRole('button', { name: SUB }))
    expect(screen.getByRole('heading', { name: NOTE })).toBeInTheDocument()
    expect(location.hash).toBe('#/fr/note/presentation/identite')

    browserBack()
    await onPath()
    expect(screen.queryByRole('heading', { name: NOTE })).toBeNull()
  })

  it('shows a note again when its address is reloaded', () => {
    setup('#/fr/note/presentation')
    expect(screen.getByRole('heading', { name: NOTE })).toBeInTheDocument()
  })

  it('never opens a locked theme from an address', async () => {
    setup('#/fr/note/famille')
    await onPath()
    expect(screen.queryByRole('button', { name: 'Continuer' })).toBeNull()
  })

  it('replaces the note with the sitting, so Back goes to the path', async () => {
    const user = setup()
    await user.click(theme('Se présenter').getByRole('button', { name: SUB }))
    await user.click(screen.getByRole('button', { name: 'Continuer' }))
    expect(location.hash).toBe('#/fr/sitting')

    // Nothing answered yet, so there is nothing to lose and nothing to ask.
    browserBack()
    await onPath()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('sends a sitting’s address to the path once the sitting is gone', () => {
    setup('#/fr/sitting')
    pathShown()
    expect(location.hash).toBe('#/fr')
  })

  it('moves between languages with Back', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Български' }))
    expect(location.hash).toBe('#/bg')
    browserBack()
    await onPath()
  })
})

describe('leaving a sitting', () => {
  it('asks before Back throws away answers, and stays when told to', async () => {
    notesSeen()
    const user = setup()
    await startSitting(user)
    await answer(user, 'le prénom')
    const asked = screen.getByTestId('cloze-sentence').textContent

    browserBack()
    await waitFor(() => expect(dialog()).toBeInTheDocument())
    expect(location.hash).toBe('#/fr/sitting')
    await user.click(
      within(dialog()).getByRole('button', { name: 'Continuer la séance' }),
    )
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByTestId('cloze-sentence').textContent).toBe(asked)
  })

  it('leaves after Back once the learner agrees, recording nothing', async () => {
    notesSeen()
    const user = setup()
    await startSitting(user)
    await answer(user, 'le prénom')

    browserBack()
    await waitFor(() => expect(dialog()).toBeInTheDocument())
    await user.click(within(dialog()).getByRole('button', { name: 'Arrêter' }))
    await onPath()
    expect(JSON.parse(localStorage.getItem(FR_PATH_KEY) ?? '{}')).toEqual({
      version: 1,
      done: [],
      cards: {},
      notesSeen: ['presentation'],
      skipped: [],
      openPath: false,
    })

    // Forward finds no sitting to come back to.
    act(() => history.forward())
    await onPath()
  })

  it('asks before the Arrêter button throws away answers', async () => {
    notesSeen()
    const user = setup()
    await startSitting(user)
    await answer(user, 'le prénom')
    await user.click(screen.getByRole('button', { name: 'Arrêter' }))
    expect(dialog()).toBeInTheDocument()
    await user.click(within(dialog()).getByRole('button', { name: 'Arrêter' }))
    await onPath()
  })

  it('stays in the sitting when the dialog is dismissed with Escape', async () => {
    notesSeen()
    const user = setup()
    await startSitting(user)
    await answer(user, 'le prénom')
    await user.click(screen.getByRole('button', { name: 'Arrêter' }))
    // What the browser does on Escape; jsdom doesn't.
    fireEvent(dialog(), new Event('cancel', { cancelable: true }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(location.hash).toBe('#/fr/sitting')
    expect(screen.getByTestId('cloze-sentence')).toBeInTheDocument()
  })

  it('leaves at once with Arrêter before any answer', async () => {
    notesSeen()
    const user = setup()
    await startSitting(user)
    await user.click(screen.getByRole('button', { name: 'Arrêter' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    await onPath()
  })

  it('goes back from the end of a sitting to the path, which shows it done', async () => {
    notesSeen()
    const user = setup()
    await startSitting(user)
    await answer(user, 'le prénom')
    await answer(user, 'le nom de famille')
    await user.type(screen.getByRole('textbox'), "l'âge")
    await user.click(screen.getByRole('radio', { name: 'M' }))
    await user.keyboard('{Enter}')
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
    expect(location.hash).toBe('#/fr/sitting/end')

    browserBack()
    await onPath()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(
      theme('Se présenter').getByRole('button', { name: SUB }),
    ).toHaveTextContent('fait')
  })
})
