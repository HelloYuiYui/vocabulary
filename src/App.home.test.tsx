import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App.tsx'
import { LANGUAGE_KEY } from './storage/storage.ts'

beforeEach(() => localStorage.clear())

const setup = (hash = '') => {
  if (hash) history.replaceState(null, '', hash)
  const user = userEvent.setup()
  render(<App />)
  return user
}
const saveLanguage = (code: string) =>
  localStorage.setItem(LANGUAGE_KEY, JSON.stringify(code))
const homeShown = () =>
  expect(
    screen.getByText('A vocabulary notebook for French, Bulgarian and Polish.'),
  ).toBeInTheDocument()
const language = (name: RegExp) => screen.getByRole('button', { name })

describe('the homepage', () => {
  it('greets a first visit, in English', () => {
    setup()
    homeShown()
    expect(location.hash).toBe('#/')
    expect(document.documentElement.lang).toBe('en')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Cahier de vocabulaire' }),
    ).toBeInTheDocument()
  })

  it('explains how the notebook works, and what it is not', () => {
    setup()
    for (const name of [
      'How it works',
      'What it isn’t',
      'What to expect',
      'Choose a language',
    ])
      expect(screen.getByRole('heading', { name })).toBeInTheDocument()
    expect(screen.getByText(/1, 3, 7, 14 and 30 days/)).toBeInTheDocument()
    expect(screen.getByText(/not a course/i)).toBeInTheDocument()
  })

  it('states what each language holds, and which await review', () => {
    setup()
    const french = language(/Français/)
    expect(french).toHaveTextContent('19 themes, A1, A2 (DELF)')
    expect(french).not.toHaveTextContent(/review/)
    for (const name of [/Български/, /Polski/]) {
      expect(language(name)).toHaveTextContent('4 themes, A1')
      expect(language(name)).toHaveTextContent(
        'Drafted with AI help, awaiting review by a native speaker.',
      )
    }
  })

  it('opens the chosen language’s path, remembers it, and Back returns home', async () => {
    const user = setup()
    await user.click(language(/Български/))
    expect(location.hash).toBe('#/bg')
    expect(
      screen.getByRole('heading', { name: 'Тетрадка с думи' }),
    ).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(LANGUAGE_KEY) ?? 'null')).toBe('bg')

    act(() => history.back())
    await waitFor(() => homeShown())
    expect(location.hash).toBe('#/')
  })

  it('sends a returning visitor straight to their path', () => {
    saveLanguage('pl')
    setup()
    expect(location.hash).toBe('#/pl')
    expect(
      screen.getByRole('heading', { name: 'Zeszyt słówek' }),
    ).toBeInTheDocument()
  })

  it('stays reachable for a returning visitor at its own address', () => {
    saveLanguage('fr')
    setup('#/')
    homeShown()
  })

  it('greets a visitor whose saved language is unknown', () => {
    saveLanguage('xx')
    setup()
    homeShown()
  })

  it('takes an unknown address home when no language is saved', () => {
    setup('#/xx/nowhere')
    homeShown()
    expect(location.hash).toBe('#/')
  })

  it('is linked from the title of the path', async () => {
    saveLanguage('fr')
    const user = setup()
    const title = screen.getByRole('heading', { level: 1 })
    await user.click(within(title).getByRole('link'))
    homeShown()
    expect(location.hash).toBe('#/')
  })

  it('is not linked during a sitting, where leaving asks first', async () => {
    saveLanguage('fr')
    const user = setup()
    await user.click(screen.getByRole('button', { name: /L'identité/ }))
    await user.click(screen.getByRole('button', { name: 'Continuer' }))
    const title = screen.getByRole('heading', { level: 1 })
    expect(within(title).queryByRole('link')).toBeNull()
  })
})
