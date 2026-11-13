import { render, screen, within } from '@testing-library/react'
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

const BG_PATH_KEY = 'cahier-vocab-bg-path-v1'
const PL_KEY = 'cahier-vocab-pl-v2'
const PL_PATH_KEY = 'cahier-vocab-pl-path-v1'
const FR_PATH_KEY = 'cahier-vocab-path-v1'

const theme = (name: string) => within(screen.getByRole('region', { name }))
const regions = () =>
  screen.getAllByRole('region').map((r) => r.getAttribute('aria-label'))

describe('language switcher', () => {
  it('switches to Bulgarian on its own path, grades Cyrillic and keeps progress apart', async () => {
    const frV2 = JSON.stringify({
      version: 2,
      mode: 'list',
      review: [{ themeId: 'chez-soi', en: 'the stairs' }],
      scores: {},
    })
    const bgV2 = JSON.stringify({
      version: 2,
      mode: 'cards',
      review: [{ themeId: 'semeystvo', en: 'mother' }],
      scores: {},
    })
    localStorage.setItem(V2_KEY, frV2)
    localStorage.setItem(BG_KEY, bgV2)
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Български' }))

    expect(
      screen.getByRole('heading', { name: 'Тетрадка с думи' }),
    ).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('bg')
    expect(regions()).toEqual([
      'Представяне',
      'Семейство и близки',
      'Числа, дати, час',
      'Описание',
    ])
    // Every Bulgarian theme is on the path, so there is no old picker to open.
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Други теми' })).toBeNull()
    expect(theme('Семейство и близки').queryAllByRole('button')).toEqual([])

    await user.click(
      theme('Представяне').getByRole('button', { name: /Лични данни/ }),
    )
    expect(
      screen.getByRole('heading', { name: 'Съм и имам' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Продължи' }))

    expect(
      screen.queryByRole('button', { name: 'Français' }),
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('cloze-sentence')).toHaveTextContent(
      'Моето first name е Мария.',
    )
    await user.type(screen.getByRole('textbox'), 'име{Enter}')
    expect(screen.getAllByText('Вярно!')[0]).toBeInTheDocument()
    await user.keyboard('{Enter}')
    await user.click(screen.getByRole('button', { name: 'Спри' }))

    // Leaving early records nothing but the note having been shown.
    expect(stored(BG_PATH_KEY)).toEqual({
      version: 1,
      done: [],
      cards: {},
      notesSeen: ['predstavyane'],
    })
    // The old picker's saved data, Bulgarian and French, is left alone.
    expect(localStorage.getItem(BG_KEY)).toBe(bgV2)
    expect(localStorage.getItem(V2_KEY)).toBe(frV2)

    await user.click(screen.getByRole('button', { name: 'Français' }))
    expect(regions()[0]).toBe('Se présenter')
    expect(stored(FR_PATH_KEY)).toMatchObject({ done: [], notesSeen: [] })
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

  it('introduces each language’s path in that language', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByText(/Suis le parcours/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Български' }))
    expect(screen.getByText(/Следвай пътя/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Polski' }))
    expect(screen.getByText(/Idź ścieżką/)).toBeInTheDocument()
  })
})

describe('Polish', () => {
  const openFirstSubTheme = async () => {
    localStorage.setItem(LANGUAGE_KEY, JSON.stringify('pl'))
    localStorage.setItem(
      PL_PATH_KEY,
      JSON.stringify({
        version: 1,
        done: [],
        cards: {},
        notesSeen: ['przedstawianie'],
      }),
    )
    const user = userEvent.setup()
    render(<App />)
    await user.click(
      theme('Przedstawianie się').getByRole('button', { name: /Dane osobowe/ }),
    )
    return user
  }

  it('switches to Polish and sizes the sub-themes with Polish plurals', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Polski' }))
    expect(
      screen.getByRole('heading', { name: 'Zeszyt słówek' }),
    ).toBeInTheDocument()
    expect(regions()).toEqual([
      'Przedstawianie się',
      'Rodzina i bliscy',
      'Liczby, daty, godziny',
      'Opis osoby',
    ])
    const first = theme('Przedstawianie się')
    expect(
      first.getByRole('button', { name: /Dane osobowe/ }),
    ).toHaveTextContent('10 kart')
    expect(first.getByRole('button', { name: /Zawody/ })).toHaveTextContent(
      '8 kart',
    )
    expect(screen.queryByRole('checkbox')).toBeNull()
  })

  it('accepts an answer without Polish letters, with a warning', async () => {
    const user = await openFirstSubTheme()
    expect(screen.getByTestId('cloze-sentence')).toHaveTextContent(
      'Mam na first name Jan.',
    )
    await user.type(screen.getByRole('textbox'), 'imie{Enter}')
    expect(
      screen.getAllByText('Dobrze, ale uważaj na polskie znaki.')[0],
    ).toBeInTheDocument()
  })

  it('accepts the dictionary form and shows the form the sentence needed', async () => {
    const user = await openFirstSubTheme()
    for (const text of ['imię', 'nazwisko', 'wiek']) {
      await user.type(screen.getByRole('textbox'), `${text}{Enter}`)
      await user.keyboard('{Enter}')
    }
    expect(screen.getByTestId('cloze-sentence')).toHaveTextContent(
      'Ile masz years (of age)?',
    )
    await user.type(screen.getByRole('textbox'), 'rok{Enter}')
    expect(screen.getAllByText('Dobrze!')[0]).toBeInTheDocument()
    expect(screen.getByText('W zdaniu:')).toBeInTheDocument()
    expect(screen.getByTestId('needed-form')).toHaveTextContent('lat')
  })

  it('never holds back a check for a gender, a rule only French has', async () => {
    const user = await openFirstSubTheme()
    // "les" is Polish for forest; in French it would hide a gender.
    await user.type(screen.getByRole('textbox'), 'les brzozowy{Enter}')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByRole('button', { name: /Dalej/ })).toBeInTheDocument()
  })

  it('leaves the old picker’s saved Polish data alone', async () => {
    const plV2 = JSON.stringify({
      version: 2,
      mode: 'cards',
      review: [{ themeId: 'rodzina', en: 'brothers and sisters' }],
      scores: {},
    })
    localStorage.setItem(PL_KEY, plV2)
    const user = await openFirstSubTheme()
    await user.type(screen.getByRole('textbox'), 'imię{Enter}')
    expect(localStorage.getItem(PL_KEY)).toBe(plV2)
  })
})
