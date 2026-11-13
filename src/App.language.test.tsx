import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { LEGACY_FLAG_KEY } from './storage/pathStorage.ts'
import { LANGUAGE_KEY, V2_KEY } from './storage/storage.ts'

const BG_KEY = 'cahier-vocab-bg-v2'

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem(LEGACY_FLAG_KEY, 'true')
  vi.spyOn(Math, 'random').mockReturnValue(0.999)
})
afterEach(() => vi.restoreAllMocks())

const stored = (key: string): unknown =>
  JSON.parse(localStorage.getItem(key) ?? 'null')

describe('language switcher', () => {
  it('switches to Bulgarian, grades Cyrillic and keeps progress apart', async () => {
    localStorage.setItem(
      V2_KEY,
      JSON.stringify({
        version: 2,
        mode: 'list',
        review: [{ themeId: 'chez-soi', en: 'the stairs' }],
        scores: {},
      }),
    )
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Български' }))

    expect(
      screen.getByRole('heading', { name: 'Тетрадка с думи' }),
    ).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('bg')
    expect(screen.queryByText(/за преговор от/)).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Една по една' }),
    ).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('checkbox', { name: /Семейство/ }))
    await user.click(screen.getByRole('button', { name: 'Започни' }))
    expect(
      screen.queryByRole('button', { name: 'Français' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('family')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Твоят отговор'), 'семейство{Enter}')
    expect(screen.getAllByText('Вярно!')[0]).toBeInTheDocument()

    await user.keyboard('{Enter}')
    await user.click(screen.getByRole('button', { name: 'Не знам' }))
    await user.click(
      screen.getByRole('button', { name: 'Спри и виж резултата' }),
    )
    expect(stored(BG_KEY)).toMatchObject({
      review: [{ themeId: 'semeystvo', en: 'mother' }],
    })
    expect(stored(V2_KEY)).toMatchObject({
      mode: 'list',
      review: [{ themeId: 'chez-soi', en: 'the stairs' }],
    })

    await user.click(screen.getByRole('button', { name: 'Обратно към темите' }))
    await user.click(screen.getByRole('button', { name: 'Français' }))
    // French opens on the path; its old review list is in the old picker.
    await user.click(screen.getByRole('button', { name: 'Autres thèmes' }))
    expect(screen.getByText(/mots à revoir/)).toHaveTextContent('Tu as 1 mots')
    expect(stored(LANGUAGE_KEY)).toBe('fr')
  })

  it('opens in the language chosen last time', () => {
    localStorage.setItem(LANGUAGE_KEY, JSON.stringify('bg'))
    render(<App />)
    expect(
      screen.getByRole('heading', { name: 'Тетрадка с думи' }),
    ).toBeInTheDocument()
  })

  it('falls back to French for an unknown saved language', () => {
    localStorage.setItem(LANGUAGE_KEY, JSON.stringify('xx'))
    render(<App />)
    expect(
      screen.getByRole('heading', { name: 'Cahier de vocabulaire' }),
    ).toBeInTheDocument()
  })
})

describe('Polish', () => {
  it('switches to Polish and words the selection with Polish plurals', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Polski' }))
    expect(
      screen.getByRole('heading', { name: 'Zeszyt słówek' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: /Rodzina/ }))
    expect(screen.getByText(/^1 temat · \d+ pytań$/)).toBeInTheDocument()
  })

  it('accepts an answer without Polish letters, with a warning', async () => {
    localStorage.setItem(LANGUAGE_KEY, JSON.stringify('pl'))
    localStorage.setItem(
      'cahier-vocab-pl-v2',
      JSON.stringify({
        version: 2,
        mode: 'cards',
        review: [{ themeId: 'rodzina', en: 'brothers and sisters' }],
        scores: {},
      }),
    )
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByText(/z poprzednich sesji/)).toHaveTextContent(
      'Masz 1 słowo',
    )
    await user.click(screen.getByRole('button', { name: 'Powtórz te słowa' }))
    await user.type(
      screen.getByLabelText('Twoja odpowiedź'),
      'rodzenstwo{Enter}',
    )
    expect(
      screen.getAllByText('Dobrze, ale uważaj na polskie znaki.')[0],
    ).toBeInTheDocument()
  })
})
