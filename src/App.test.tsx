import { render, screen, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { V1_KEY, V2_KEY } from './storage/storage.ts'

// A random of 0.999 makes shuffled() keep the theme order.
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

const startTheme = async (user: UserEvent, name: RegExp) => {
  await user.click(screen.getByRole('checkbox', { name }))
  await user.click(screen.getByRole('button', { name: 'Commencer' }))
}

const reviewOnly = (en: string) =>
  localStorage.setItem(
    V2_KEY,
    JSON.stringify({
      version: 2,
      mode: 'cards',
      review: [{ themeId: 'chez-soi', en }],
      scores: {},
    }),
  )

const stored = (): unknown => JSON.parse(localStorage.getItem(V2_KEY) ?? '{}')

describe('cards mode', () => {
  it('checks with Enter, moves on with a second Enter, and records misses', async () => {
    const user = setup()
    await startTheme(user, /Chez soi/)

    expect(screen.getByText('1 / 16')).toBeInTheDocument()
    expect(screen.getByText('the living room')).toBeInTheDocument()
    const input = screen.getByLabelText("Ta réponse, avec l'article")
    expect(input).toHaveFocus()

    await user.type(input, 'le salon{Enter}')
    expect(screen.getAllByText('Juste !')[0]).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Suivant ↵' })).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(screen.getByText('the bedroom')).toBeInTheDocument()
    expect(screen.getByText('2 / 16')).toBeInTheDocument()

    await user.type(screen.getByRole('textbox'), 'chambre{Enter}')
    expect(
      screen.getAllByText("Presque : vérifie l'article ou le genre.")[0],
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'En fait, ma réponse était juste' }),
    )

    expect(screen.getByText('the kitchen')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Je ne sais pas' }))
    expect(screen.getAllByText('Voici la réponse.')[0]).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /ma réponse était juste/ }),
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Arrêter et voir le bilan' }),
    )
    expect(screen.getByText('Bilan')).toBeInTheDocument()
    expect(screen.getByText('/ 3')).toBeInTheDocument()
    expect(stored()).toMatchObject({
      review: [{ themeId: 'chez-soi', en: 'the kitchen' }],
      scores: {},
    })

    await user.click(screen.getByRole('button', { name: 'Retour aux thèmes' }))
    expect(screen.getByText(/mots à revoir/)).toHaveTextContent(
      'Tu as 1 mots à revoir',
    )
  })

  it('activates the override with Enter instead of skipping', async () => {
    reviewOnly('the sofa')
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Réviser ces mots' }))
    await user.type(screen.getByRole('textbox'), 'canapé{Enter}')
    screen.getByRole('button', { name: /ma réponse était juste/ }).focus()
    await user.keyboard('{Enter}')
    expect(screen.getByText('Bilan')).toBeInTheDocument()
    expect(
      screen.getByText('Sans faute.', { exact: false }),
    ).toBeInTheDocument()
    expect(stored()).toMatchObject({ review: [] })
  })

  it('asks for the gender when the article hides it', async () => {
    reviewOnly('the stairs')
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Réviser ces mots' }))

    const input = screen.getByRole('textbox')
    await user.type(input, 'escalier')
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()

    await user.clear(input)
    await user.type(input, "l'escalier")
    const picker = screen.getByRole('radiogroup', { name: 'Genre' })
    await user.click(within(picker).getByRole('radio', { name: 'masc.' }))
    await user.click(screen.getByRole('button', { name: 'Vérifier' }))

    expect(screen.getAllByText('Juste !')[0]).toBeInTheDocument()
    expect(screen.getAllByTitle('masculin').length).toBeGreaterThan(0)
  })

  it('reports a missing gender as presque', async () => {
    reviewOnly('the stairs')
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Réviser ces mots' }))
    await user.type(screen.getByRole('textbox'), "l'escalier{Enter}")
    expect(
      screen.getAllByText(/l'article ne montre pas le genre/)[0],
    ).toBeInTheDocument()
  })
})

describe('list mode', () => {
  it('checks rows with Enter, then shows and records results', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Liste' }))
    await startTheme(user, /Chez soi/)

    const first = screen.getByLabelText('the living room')
    expect(first).toHaveFocus()
    await user.type(first, 'le salon{Enter}')
    expect(first).toBeDisabled()
    expect(screen.getByLabelText('the bedroom')).toHaveFocus()
    expect(screen.getByText('1 / 16 corrigées · 1 justes')).toBeInTheDocument()

    await user.type(screen.getByLabelText('the bedroom'), 'la porte')
    await user.click(screen.getByRole('button', { name: 'Tout corriger' }))

    expect(screen.getByText('Bilan')).toBeInTheDocument()
    expect(screen.getByText('/ 16')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tout corriger' })).toBeDisabled()
    expect(screen.getByText('la porte')).toHaveClass('line-through')
    expect(stored()).toMatchObject({
      scores: { 'chez-soi': { right: 1, total: 16 } },
    })

    // Overriding below the results updates the score.
    await user.click(
      screen.getAllByRole('button', {
        name: 'En fait, ma réponse était juste',
      })[0]!,
    )
    expect(stored()).toMatchObject({
      scores: { 'chez-soi': { right: 2, total: 16 } },
    })

    await user.click(
      screen.getAllByRole('button', { name: 'Retour aux thèmes' })[0]!,
    )
    expect(screen.getByText(/dernier score 2\/16/)).toBeInTheDocument()
    expect(screen.getByText(/mots à revoir/)).toHaveTextContent('Tu as 14 mots')
  })
})

describe('results', () => {
  const missOne = async (user: UserEvent) => {
    await startTheme(user, /Chez soi/)
    await user.click(screen.getByRole('button', { name: 'Je ne sais pas' }))
    await user.click(
      screen.getByRole('button', { name: 'Arrêter et voir le bilan' }),
    )
  }

  it('copies missed words for Anki', async () => {
    const user = setup()
    await missOne(user)
    await user.click(screen.getByRole('button', { name: 'Copier pour Anki' }))
    expect(screen.getByText(/Copié/)).toBeInTheDocument()
    expect(await navigator.clipboard.readText()).toBe(
      'the living room\tle salon',
    )
  })

  it('falls back to a selected text box when the clipboard fails', async () => {
    const user = setup()
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
      new Error('no'),
    )
    await missOne(user)
    await user.click(screen.getByRole('button', { name: 'Copier pour Anki' }))
    const box = await screen.findByLabelText('Liste à copier')
    expect(box).toHaveValue('the living room\tle salon')
    expect(box).toHaveFocus()
  })

  it('retries only the missed words', async () => {
    const user = setup()
    await missOne(user)
    await user.click(
      screen.getByRole('button', { name: 'Refaire les mots ratés' }),
    )
    expect(screen.getByText('1 / 1')).toBeInTheDocument()
    expect(screen.getByText('the living room')).toBeInTheDocument()
  })
})

describe('storage', () => {
  it('opens with migrated v1 progress', () => {
    localStorage.setItem(
      V1_KEY,
      JSON.stringify({
        review: ['chez-soi|the stairs', 'ville|the church'],
        scores: { 'chez-soi': '9/13' },
        mode: 'list',
      }),
    )
    render(<App />)
    expect(screen.getByText(/mots à revoir/)).toHaveTextContent('Tu as 2 mots')
    expect(screen.getByText(/dernier score 9\/13/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Liste' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('works with storage blocked', async () => {
    const blocked = () => {
      throw new DOMException('blocked', 'SecurityError')
    }
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked)
    const user = setup()
    await startTheme(user, /Chez soi/)
    await user.type(screen.getByRole('textbox'), 'le salon{Enter}')
    await user.keyboard('{Enter}')
    await user.click(
      screen.getByRole('button', { name: 'Arrêter et voir le bilan' }),
    )
    expect(screen.getByText('Bilan')).toBeInTheDocument()
  })
})
