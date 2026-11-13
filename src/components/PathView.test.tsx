import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { pathCopy } from '../data/fr/pathCopy.ts'
import { EMPTY_PROGRESS, type PathProgress } from '../domain/path.ts'
import { fixtureLanguage, PATH_THEMES } from '../test/pathFixture.ts'
import { LanguageContext } from './languageContext.ts'
import { PathView } from './PathView.tsx'

const handlers = () => ({
  onReview: vi.fn(),
  onSubTheme: vi.fn(),
  onQuiz: vi.fn(),
  onNote: vi.fn(),
  onLegacy: vi.fn(),
})

const show = (
  progress: PathProgress = EMPTY_PROGRESS,
  extra: { dueCount?: number; showLegacy?: boolean } = {},
) => {
  const on = handlers()
  render(
    <LanguageContext value={fixtureLanguage}>
      <PathView
        themes={PATH_THEMES}
        progress={progress}
        dueCount={extra.dueCount ?? 0}
        showLegacy={extra.showLegacy ?? false}
        copy={pathCopy}
        {...on}
      />
    </LanguageContext>,
  )
  return on
}

const theme = (name: string) => within(screen.getByRole('region', { name }))
const done = (...keys: string[]): PathProgress => ({
  ...EMPTY_PROGRESS,
  done: keys,
})
const QUIZ = 'Je connais déjà ce thème'

describe('PathView', () => {
  it('shows every theme in path order', () => {
    show()
    expect(
      screen.getAllByRole('region').map((r) => r.getAttribute('aria-label')),
    ).toEqual(['Thème un', 'Thème deux', 'Thème trois'])
  })

  it('lists sub-themes for the open theme only', () => {
    show()
    expect(
      theme('Thème un').getByRole('button', { name: /Premier/ }),
    ).toBeInTheDocument()
    expect(
      theme('Thème un').getByRole('button', { name: /Second/ }),
    ).toBeInTheDocument()
    expect(theme('Thème deux').queryAllByRole('button')).toEqual([])
    expect(theme('Thème deux').getByText('À venir')).toBeInTheDocument()
    expect(theme('Thème trois').queryAllByRole('button')).toEqual([])
  })

  it('says how many cards a sub-theme has', () => {
    show()
    expect(
      theme('Thème un').getByRole('button', { name: /Premier/ }),
    ).toHaveTextContent('2 cartes')
  })

  it('counts a single card in the singular', () => {
    show(done('t1/s1', 't1/s2', 't2/a'))
    expect(
      theme('Thème deux').getByRole('button', { name: /Ferme/ }),
    ).toHaveTextContent('1 carte')
  })

  it('offers the skip quiz on open themes only', () => {
    show(done('t1/s1', 't1/s2'))
    expect(theme('Thème un').queryByRole('button', { name: QUIZ })).toBeNull()
    expect(
      theme('Thème deux').getByRole('button', { name: QUIZ }),
    ).toBeInTheDocument()
    expect(
      theme('Thème trois').queryByRole('button', { name: QUIZ }),
    ).toBeNull()
  })

  it('starts the quiz of the theme whose button is pressed', async () => {
    const on = show()
    await userEvent.click(theme('Thème un').getByRole('button', { name: QUIZ }))
    expect(on.onQuiz).toHaveBeenCalledWith(PATH_THEMES[0])
  })

  it('marks finished sub-themes and keeps them clickable', async () => {
    const on = show(done('t1/s1'))
    const first = theme('Thème un').getByRole('button', { name: /Premier/ })
    expect(first).toHaveTextContent('fait')
    expect(
      theme('Thème un').getByRole('button', { name: /Second/ }),
    ).not.toHaveTextContent('fait')
    await userEvent.click(first)
    expect(on.onSubTheme).toHaveBeenCalledWith(
      PATH_THEMES[0],
      PATH_THEMES[0]?.subThemes?.[0],
    )
  })

  it('shows finished sub-themes in the done colour, and only those', () => {
    show(done('t1/s1'))
    const first = theme('Thème un').getByRole('button', { name: /Premier/ })
    const second = theme('Thème un').getByRole('button', { name: /Second/ })
    expect(first).toHaveAttribute('data-done', 'true')
    expect(first).toHaveClass('border-ok', 'text-ok')
    expect(first).not.toHaveClass('border-ink', 'text-ink')
    expect(second).not.toHaveAttribute('data-done')
    expect(second).toHaveClass('border-ink', 'text-ink')
    expect(second).not.toHaveClass('border-ok', 'text-ok')
  })

  it('keeps a finished theme open for practice', () => {
    show(done('t1/s1', 't1/s2'))
    expect(
      theme('Thème un').getByRole('button', { name: /Premier/ }),
    ).toBeEnabled()
  })

  it('shows the note button only for a reachable theme with a note', async () => {
    const on = show(done('t1/s1', 't1/s2'))
    const note = theme('Thème un').getByRole('button', {
      name: 'Note de grammaire',
    })
    expect(
      theme('Thème deux').queryByRole('button', { name: 'Note de grammaire' }),
    ).toBeNull()
    await userEvent.click(note)
    expect(on.onNote).toHaveBeenCalledWith(PATH_THEMES[0])
  })

  it('hides the review button when nothing is due', () => {
    show()
    expect(screen.queryByRole('button', { name: /à revoir/ })).toBeNull()
  })

  it.each([
    [1, '1 carte à revoir'],
    [3, '3 cartes à revoir'],
  ])('offers %i due cards for review', async (dueCount, name) => {
    const on = show(EMPTY_PROGRESS, { dueCount })
    await userEvent.click(screen.getByRole('button', { name }))
    expect(on.onReview).toHaveBeenCalledOnce()
  })

  it('shows the legacy button only when asked', async () => {
    show()
    expect(screen.queryByRole('button', { name: 'Autres thèmes' })).toBeNull()
    const on = show(EMPTY_PROGRESS, { showLegacy: true })
    await userEvent.click(screen.getByRole('button', { name: 'Autres thèmes' }))
    expect(on.onLegacy).toHaveBeenCalledOnce()
  })

  it('never shows a streak, a percentage or a mastery label', () => {
    show(done('t1/s1', 't1/s2', 't2/a'), { dueCount: 4 })
    // The quiz rule states its pass mark; nothing else may show a percentage.
    const text = document.body.textContent.replaceAll(pathCopy.quizHelp, '')
    expect(text).not.toMatch(/%|maîtris|série|bravo/i)
  })
})
