import { render, screen, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { useReducer } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { pathCopy } from '../data/fr/pathCopy.ts'
import type { Entry } from '../domain/session.ts'
import {
  initialSitting,
  sittingReducer,
  type SittingKind,
} from '../domain/sitting.ts'
import { fixtureLanguage, PATH_THEMES } from '../test/pathFixture.ts'
import { LanguageContext } from './languageContext.ts'
import { SittingEnd } from './SittingEnd.tsx'
import { SittingView } from './SittingView.tsx'

const cardsOf = (themeIndex: number): Entry[] => {
  const theme = PATH_THEMES[themeIndex]
  return (theme?.items ?? []).map((item) => ({ themeId: theme!.id, item }))
}

function Harness({
  kind,
  cards,
  onLeave,
  onHome,
}: {
  kind: SittingKind
  cards: Entry[]
  onLeave: () => void
  onHome: () => void
}) {
  const [sitting, dispatch] = useReducer(
    sittingReducer,
    sittingReducer(initialSitting, {
      type: 'start',
      kind,
      cards,
      themeId: cards[0]?.themeId,
    }),
  )
  return sitting.finished ? (
    <SittingEnd sitting={sitting} copy={pathCopy} onHome={onHome} />
  ) : (
    <SittingView
      sitting={sitting}
      dispatch={dispatch}
      copy={pathCopy}
      onLeave={onLeave}
    />
  )
}

const setup = (kind: SittingKind, cards: Entry[]) => {
  const user = userEvent.setup()
  const onLeave = vi.fn()
  const onHome = vi.fn()
  render(
    <LanguageContext value={fixtureLanguage}>
      <Harness kind={kind} cards={cards} onLeave={onLeave} onHome={onHome} />
    </LanguageContext>,
  )
  return { user, onLeave, onHome }
}

/** Types an answer, checks it with Enter and moves on with a second Enter. */
const answer = async (user: UserEvent, text: string) => {
  await user.type(screen.getByRole('textbox'), `${text}{Enter}`)
  await user.keyboard('{Enter}')
}

// t2 has three cards: the cat, the dog, the cow.
describe('SittingView', () => {
  it('names the theme and counts the cards left', async () => {
    const { user } = setup('learn', cardsOf(1))
    expect(screen.getByText('Thème deux')).toBeInTheDocument()
    expect(screen.getByText('restent 3 cartes')).toBeInTheDocument()
    await answer(user, 'le chat')
    expect(screen.getByText('restent 2 cartes')).toBeInTheDocument()
  })

  it('brings a missed card back and ends when all are right', async () => {
    const { user } = setup('learn', cardsOf(1))
    expect(screen.getByText('the cat')).toBeInTheDocument()
    await answer(user, 'faux')
    expect(screen.getByText('restent 3 cartes')).toBeInTheDocument()
    await answer(user, 'le chien')
    await answer(user, 'la vache')
    expect(screen.getByText('the cat')).toBeInTheDocument()
    expect(screen.getByText('reste 1 carte')).toBeInTheDocument()
    await answer(user, 'le chat')
    expect(screen.getByText('Séance terminée')).toBeInTheDocument()
  })

  it('focuses the answer box on each card, including a returning one', async () => {
    const { user } = setup('learn', cardsOf(2))
    expect(screen.getByRole('textbox')).toHaveFocus()
    await answer(user, 'faux')
    const box = screen.getByRole('textbox')
    expect(box).toHaveFocus()
    expect(box).toHaveValue('')
    expect(box).toBeEnabled()
  })

  it('shows the answer after "je ne sais pas" and asks the card again', async () => {
    const { user } = setup('learn', cardsOf(2))
    await user.click(screen.getByRole('button', { name: 'Je ne sais pas' }))
    expect(screen.getByText('le pain')).toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(screen.getByText('the bread')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveValue('')
  })

  it('lets the learner overrule a wrong verdict and move on', async () => {
    const { user } = setup('learn', cardsOf(2))
    await user.type(screen.getByRole('textbox'), 'du pain{Enter}')
    await user.click(
      screen.getByRole('button', { name: /ma réponse était juste/i }),
    )
    expect(screen.getByText('Séance terminée')).toBeInTheDocument()
    expect(
      screen.getByText('Toutes les cartes du premier coup.'),
    ).toBeInTheDocument()
  })

  it('shows a cloze card as a sentence', () => {
    setup('learn', cardsOf(0))
    expect(screen.getByTestId('cloze-sentence')).toHaveTextContent(
      "C'est the mother de Paul.",
    )
  })

  it('leaves when asked, without finishing', async () => {
    const { user, onLeave } = setup('learn', cardsOf(1))
    await user.click(screen.getByRole('button', { name: 'Arrêter' }))
    expect(onLeave).toHaveBeenCalledOnce()
    expect(screen.queryByText('Séance terminée')).toBeNull()
  })
})

describe('SittingEnd', () => {
  it('lists retried cards first and never shows a percentage', async () => {
    const { user, onHome } = setup('learn', cardsOf(1))
    await answer(user, 'le chat')
    await answer(user, 'faux')
    await answer(user, 'la vache')
    await answer(user, 'le chien')
    expect(
      screen.getByText('1 carte a demandé plus d’un essai.'),
    ).toBeInTheDocument()
    const rows = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(rows[0]).toContain('the dog')
    expect(rows).toHaveLength(3)
    expect(document.body.textContent).not.toMatch(/%/)
    await user.click(screen.getByRole('button', { name: 'Retour au parcours' }))
    expect(onHome).toHaveBeenCalledOnce()
  })

  it('says so when nothing needed a second try', async () => {
    const { user } = setup('review', cardsOf(2))
    await answer(user, 'le pain')
    expect(
      screen.getByText('Toutes les cartes du premier coup.'),
    ).toBeInTheDocument()
  })

  it('reports a passed quiz with counts', async () => {
    const { user } = setup('quiz', cardsOf(2))
    await answer(user, 'le pain')
    expect(screen.getByText('1/1 : thème passé.')).toBeInTheDocument()
  })

  it('reports a failed quiz with counts, and does not ask a card twice', async () => {
    const { user } = setup('quiz', cardsOf(1))
    await answer(user, 'le chat')
    await answer(user, 'faux')
    await answer(user, 'faux')
    expect(
      screen.getByText('1/3 : le thème reste à faire.'),
    ).toBeInTheDocument()
    const first = screen.getAllByRole('listitem')[0]
    expect(within(first!).getByText(/the (dog|cow)/)).toBeInTheDocument()
  })
})
