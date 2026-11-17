import { render, screen, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PathProgress } from '../domain/path.ts'
import { fixtureLanguage, PATH_KEY } from '../test/pathFixture.ts'
import { LanguageContext } from './languageContext.ts'
import { PathCahier } from './PathCahier.tsx'

// A random of 0.999 makes shuffled() keep the order of the cards.
beforeEach(() => {
  localStorage.clear()
  vi.spyOn(Math, 'random').mockReturnValue(0.999)
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

const setup = () => {
  const user = userEvent.setup()
  const view = render(
    <LanguageContext value={fixtureLanguage}>
      <PathCahier language={fixtureLanguage} onLanguageChange={() => {}} />
    </LanguageContext>,
  )
  return { user, ...view }
}

const saved = (): Partial<PathProgress> =>
  JSON.parse(localStorage.getItem(PATH_KEY) ?? '{}') as Partial<PathProgress>
const seed = (progress: Partial<PathProgress>) =>
  localStorage.setItem(
    PATH_KEY,
    JSON.stringify({
      version: 1,
      done: [],
      cards: {},
      notesSeen: [],
      ...progress,
    }),
  )
/** Sets today's date without faking the timers user-event relies on. */
const today = (year: number, month: number, day: number) => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(year, month - 1, day, 9, 0))
}

const theme = (name: string) => within(screen.getByRole('region', { name }))
const open = (user: UserEvent, themeName: string, sub: RegExp) =>
  user.click(theme(themeName).getByRole('button', { name: sub }))
const answer = async (user: UserEvent, text: string) => {
  await user.type(screen.getByRole('textbox'), `${text}{Enter}`)
  await user.keyboard('{Enter}')
}
const back = (user: UserEvent) =>
  user.click(screen.getByRole('button', { name: 'Retour au parcours' }))
const QUIZ = 'Je connais déjà ce thème'
const NOTE_TITLE = 'Mon, ma, mes'

describe('learning a sub-theme', () => {
  it('shows the note first, then the cards, then marks it done', async () => {
    today(2026, 11, 12)
    const { user } = setup()
    await open(user, 'Thème un', /Premier/)
    expect(
      screen.getByRole('heading', { name: NOTE_TITLE }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continuer' }))

    expect(screen.getByTestId('cloze-sentence')).toBeInTheDocument()
    await answer(user, 'la mère')
    await answer(user, 'le père')
    expect(screen.getByText('Séance terminée')).toBeInTheDocument()
    await back(user)

    expect(
      theme('Thème un').getByRole('button', { name: /Premier/ }),
    ).toHaveTextContent('fait')
    expect(saved()).toEqual({
      version: 1,
      done: ['t1/s1'],
      cards: {
        't1/mere': { box: 1, due: '2026-11-13', seen: 0, right: 0 },
        't1/pere': { box: 1, due: '2026-11-13', seen: 0, right: 0 },
      },
      notesSeen: ['t1'],
      skipped: [],
      openPath: false,
    })
  })

  it('shows the note only the first time', async () => {
    seed({ notesSeen: ['t1'] })
    const { user } = setup()
    await open(user, 'Thème un', /Second/)
    expect(screen.queryByRole('heading', { name: NOTE_TITLE })).toBeNull()
    expect(screen.getByText('the brother')).toBeInTheDocument()
  })

  it('opens the note again from the path and comes back to it', async () => {
    seed({ notesSeen: ['t1'] })
    const { user } = setup()
    await user.click(
      theme('Thème un').getByRole('button', { name: 'Note de grammaire' }),
    )
    expect(
      screen.getByRole('heading', { name: NOTE_TITLE }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continuer' }))
    expect(screen.getByRole('region', { name: 'Thème un' })).toBeInTheDocument()
  })

  it('goes straight to the cards of a theme without a note', async () => {
    seed({ done: ['t1/s1', 't1/s2'] })
    const { user } = setup()
    await open(user, 'Thème deux', /Animaux/)
    expect(screen.getByText('the cat')).toBeInTheDocument()
  })

  it('records nothing when a sitting is left early', async () => {
    seed({ notesSeen: ['t1'] })
    const { user } = setup()
    await open(user, 'Thème un', /Second/)
    await answer(user, 'le frère')
    await user.click(screen.getByRole('button', { name: 'Arrêter' }))
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Arrêter',
      }),
    )
    expect(
      theme('Thème un').getByRole('button', { name: /Second/ }),
    ).not.toHaveTextContent('fait')
    expect(saved().done).toEqual([])
    expect(saved().cards).toEqual({})
  })

  it('does not change saved card states when a finished sub-theme is redone', async () => {
    today(2026, 11, 20)
    const cards = {
      't1/frere': { box: 3, due: '2026-11-25', seen: 2, right: 2 },
      't1/soeur': { box: 2, due: '2026-11-22', seen: 1, right: 1 },
    }
    seed({ done: ['t1/s2'], cards, notesSeen: ['t1'] })
    const { user } = setup()
    await open(user, 'Thème un', /Second/)
    await answer(user, 'faux')
    await answer(user, 'la sœur')
    await answer(user, 'le frère')
    await back(user)
    expect(saved().cards).toEqual(cards)
    expect(saved().done).toEqual(['t1/s2'])
  })
})

describe('review', () => {
  it('offers the cards that are due and reschedules them by first answer', async () => {
    today(2026, 11, 13)
    seed({
      done: ['t1/s1', 't1/s2'],
      notesSeen: ['t1'],
      cards: {
        't1/mere': { box: 1, due: '2026-11-13', seen: 0, right: 0 },
        't1/pere': { box: 2, due: '2026-11-12', seen: 1, right: 1 },
        't1/frere': { box: 1, due: '2026-11-14', seen: 0, right: 0 },
        't1/soeur': { box: 5, due: '2026-12-01', seen: 9, right: 9 },
      },
    })
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '2 cartes à revoir' }))
    // Longest overdue first: the father, then the mother.
    await answer(user, 'faux')
    await answer(user, 'la mère')
    await answer(user, 'le père')
    await back(user)

    expect(saved().cards).toEqual({
      't1/mere': { box: 2, due: '2026-11-16', seen: 1, right: 1 },
      't1/pere': { box: 1, due: '2026-11-14', seen: 2, right: 1 },
      't1/frere': { box: 1, due: '2026-11-14', seen: 0, right: 0 },
      't1/soeur': { box: 5, due: '2026-12-01', seen: 9, right: 9 },
    })
    expect(screen.queryByRole('button', { name: /à revoir/ })).toBeNull()
  })

  it('offers nothing on the day a sub-theme was learnt', () => {
    today(2026, 11, 12)
    seed({
      done: ['t1/s1'],
      cards: { 't1/mere': { box: 1, due: '2026-11-13', seen: 0, right: 0 } },
    })
    setup()
    expect(screen.queryByRole('button', { name: /à revoir/ })).toBeNull()
  })
})

describe('the skip quiz', () => {
  it('finishes the open theme when passed, opening the next one only', async () => {
    const { user } = setup()
    await user.click(theme('Thème un').getByRole('button', { name: QUIZ }))
    // The quiz draws one card from each sub-theme in turn.
    for (const text of ['la mère', 'le frère', 'le père', 'la sœur'])
      await answer(user, text)
    expect(screen.getByText('4/4 : thème passé.')).toBeInTheDocument()
    await back(user)

    expect(
      theme('Thème deux').getByRole('button', { name: /Animaux/ }),
    ).toBeInTheDocument()
    expect(theme('Thème trois').queryAllByRole('button')).toEqual([])
    expect(saved().done).toEqual(['t1/s1', 't1/s2'])
    expect(Object.keys(saved().cards ?? {})).toHaveLength(4)
  })

  it('changes nothing when failed', async () => {
    const { user } = setup()
    await user.click(theme('Thème un').getByRole('button', { name: QUIZ }))
    for (const text of ['la mère', 'le frère', 'faux', 'faux'])
      await answer(user, text)
    expect(
      screen.getByText('2/4 : le thème reste à faire.'),
    ).toBeInTheDocument()
    await back(user)

    expect(theme('Thème deux').queryAllByRole('button')).toEqual([])
    expect(saved().done).toEqual([])
    expect(saved().cards).toEqual({})
  })
})

describe('saved progress', () => {
  it('is kept after the app is closed and opened again', async () => {
    seed({ notesSeen: ['t1'] })
    const first = setup()
    await open(first.user, 'Thème un', /Second/)
    await answer(first.user, 'le frère')
    await answer(first.user, 'la sœur')
    first.unmount()

    setup()
    expect(
      theme('Thème un').getByRole('button', { name: /Second/ }),
    ).toHaveTextContent('fait')
  })

  it('is not needed for a sitting to work', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const { user } = setup()
    await open(user, 'Thème un', /Second/)
    await user.click(screen.getByRole('button', { name: 'Continuer' }))
    await answer(user, 'le frère')
    await answer(user, 'la sœur')
    await back(user)
    expect(
      theme('Thème un').getByRole('button', { name: /Second/ }),
    ).toHaveTextContent('fait')
  })

  it('leaves the old picker’s saved data alone', async () => {
    const v2 = JSON.stringify({ version: 2, mode: 'list', review: [] })
    localStorage.setItem('cahier-vocab-v2', v2)
    seed({ notesSeen: ['t1'] })
    const { user } = setup()
    await open(user, 'Thème un', /Second/)
    await answer(user, 'le frère')
    await answer(user, 'la sœur')
    expect(localStorage.getItem('cahier-vocab-v2')).toBe(v2)
  })
})

describe('themes that are not on the path', () => {
  it('are not shown', () => {
    setup()
    expect(screen.queryByText('Ancien thème')).toBeNull()
    expect(screen.getAllByRole('region')).toHaveLength(3)
  })
})

describe('the language switcher', () => {
  it('is offered on the path but not during a sitting', async () => {
    seed({ notesSeen: ['t1'] })
    const { user } = setup()
    expect(screen.getByRole('group', { name: /langue/i })).toBeInTheDocument()
    await open(user, 'Thème un', /Second/)
    expect(screen.queryByRole('group', { name: /langue/i })).toBeNull()
  })
})

describe('exporting cards as CSV', () => {
  /** Catches the file a download would save, instead of saving it. */
  const catchDownloads = () => {
    const files: { name: string; blob: Blob }[] = []
    let last: Blob | undefined
    URL.createObjectURL = vi.fn((blob: Blob) => {
      last = blob
      return 'blob:test'
    })
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      if (last) files.push({ name: this.download, blob: last })
    })
    return files
  }

  const MARKED_MERE =
    '"C\'est [[la mère:the mother]] de Paul.","This is Paul\'s mother."\r\n'
  const MARKED_PERE =
    '"[[Le père:the father]] de Julie travaille.","Julie\'s father works."\r\n'
  const ALL = 'Exporter toutes les cartes (CSV)'
  const MISSED = 'Exporter les cartes ratées (CSV)'

  it('offers no export on the path, only at the end of a sitting', () => {
    seed({
      done: ['t1/s1'],
      cards: { 't1/mere': { box: 2, due: '2026-11-20', seen: 1, right: 1 } },
    })
    setup()
    expect(screen.queryByRole('button', { name: /Exporter/ })).toBeNull()
  })

  it('exports every card of a finished sitting, marked as [[word:hint]]', async () => {
    today(2026, 11, 14)
    const files = catchDownloads()
    seed({ notesSeen: ['t1'] })
    const { user } = setup()
    await open(user, 'Thème un', /Premier/)
    await answer(user, 'la mère')
    await answer(user, 'le père')
    await user.click(screen.getByRole('button', { name: ALL }))
    expect(files).toHaveLength(1)
    expect(files[0]?.name).toBe('cahier-fr-t1-2026-11-14.csv')
    expect(files[0]?.blob.type).toBe('text/csv;charset=utf-8')
    expect(await files[0]?.blob.text()).toBe(MARKED_MERE + MARKED_PERE)
  })

  it('leaves the words set aside out of both exports', async () => {
    today(2026, 11, 14)
    const files = catchDownloads()
    seed({ notesSeen: ['t1'] })
    const { user } = setup()
    await open(user, 'Thème un', /Premier/)
    await user.type(screen.getByRole('textbox'), 'faux{Enter}')
    await user.click(screen.getByRole('button', { name: 'Je connais ce mot' }))
    await user.type(screen.getByRole('textbox'), 'faux{Enter}')
    await user.keyboard('{Enter}')
    await answer(user, 'le père')
    await user.click(screen.getByRole('button', { name: ALL }))
    await user.click(screen.getByRole('button', { name: MISSED }))
    expect(await files[0]?.blob.text()).toBe(MARKED_PERE)
    expect(await files[1]?.blob.text()).toBe(MARKED_PERE)
  })

  it('exports only the cards missed at the first try', async () => {
    today(2026, 11, 14)
    const files = catchDownloads()
    seed({ notesSeen: ['t1'] })
    const { user } = setup()
    await open(user, 'Thème un', /Premier/)
    await answer(user, 'la mère')
    await answer(user, 'faux')
    await answer(user, 'le père')
    await user.click(screen.getByRole('button', { name: MISSED }))
    expect(files[0]?.name).toBe('cahier-fr-t1-ratees-2026-11-14.csv')
    expect(await files[0]?.blob.text()).toBe(MARKED_PERE)
  })

  it('counts "je ne sais pas" as missed', async () => {
    const files = catchDownloads()
    seed({ notesSeen: ['t1'] })
    const { user } = setup()
    await open(user, 'Thème un', /Premier/)
    await user.click(screen.getByRole('button', { name: 'Je ne sais pas' }))
    await user.keyboard('{Enter}')
    await answer(user, 'le père')
    await answer(user, 'la mère')
    await user.click(screen.getByRole('button', { name: MISSED }))
    expect(await files[0]?.blob.text()).toBe(MARKED_MERE)
  })

  it('offers no "missed" export when every card was right at the first try', async () => {
    seed({ notesSeen: ['t1'] })
    const { user } = setup()
    await open(user, 'Thème un', /Premier/)
    await answer(user, 'la mère')
    await answer(user, 'le père')
    expect(screen.getByRole('button', { name: ALL })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: MISSED })).toBeNull()
  })

  it('offers no export at the end of a sitting with no sentence to write', async () => {
    seed({ notesSeen: ['t1'] })
    const { user } = setup()
    await open(user, 'Thème un', /Second/)
    await answer(user, 'faux')
    await answer(user, 'la sœur')
    await answer(user, 'le frère')
    expect(screen.queryByRole('button', { name: /Exporter/ })).toBeNull()
  })

  it('exports after a review sitting too, named for the review', async () => {
    today(2026, 11, 14)
    const files = catchDownloads()
    seed({
      done: ['t1/s1'],
      cards: { 't1/mere': { box: 1, due: '2026-11-13', seen: 0, right: 0 } },
    })
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '1 carte à revoir' }))
    await answer(user, 'la mère')
    await user.click(screen.getByRole('button', { name: ALL }))
    expect(files[0]?.name).toBe('cahier-fr-revision-2026-11-14.csv')
  })
})

const SKIP = 'Je connais ce mot'
const settings = (user: UserEvent) =>
  user.click(screen.getByRole('link', { name: 'Réglages' }))

describe('setting a word aside ("je connais ce mot")', () => {
  it('takes it out of the sitting and of review, until it is put back in the settings', async () => {
    today(2026, 11, 12)
    seed({ notesSeen: ['t1'] })
    const { user } = setup()
    await open(user, 'Thème un', /Premier/)
    expect(screen.getByTestId('cloze-sentence')).toHaveTextContent('the mother')
    await user.click(screen.getByRole('button', { name: SKIP }))
    await answer(user, 'le père')
    expect(screen.getByText('Séance terminée')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Un mot mis de côté. Les réglages, depuis le parcours, permettent de le remettre.',
      ),
    ).toBeInTheDocument()
    await back(user)

    expect(
      theme('Thème un').getByRole('button', { name: /Premier/ }),
    ).toHaveTextContent('fait')
    expect(saved().skipped).toEqual(['t1/mere'])
    expect(Object.keys(saved().cards ?? {})).toEqual(['t1/pere'])

    await settings(user)
    const aside = within(
      screen.getByRole('region', { name: 'Mots mis de côté' }),
    )
    expect(aside.getByText('the mother')).toBeInTheDocument()
    await user.click(aside.getByRole('button', { name: 'Remettre' }))
    expect(aside.queryByText('the mother')).toBeNull()
    expect(saved().skipped).toEqual([])
    expect(saved().cards?.['t1/mere']?.due).toBe('2026-11-13')
  })

  it('can be used after answering, and the card does not come back', async () => {
    seed({ notesSeen: ['t1'] })
    const { user } = setup()
    await open(user, 'Thème un', /Premier/)
    await user.type(screen.getByRole('textbox'), 'faux{Enter}')
    await user.click(screen.getByRole('button', { name: SKIP }))
    await answer(user, 'le père')
    expect(screen.getByText('Séance terminée')).toBeInTheDocument()
  })

  it('is not asked again when the sub-theme is taken again', async () => {
    seed({ notesSeen: ['t1'], done: ['t1/s1'], skipped: ['t1/mere'] })
    const { user } = setup()
    await open(user, 'Thème un', /Premier/)
    expect(screen.getByTestId('cloze-sentence')).toHaveTextContent('the father')
    expect(screen.getByText('reste 1 carte')).toBeInTheDocument()
  })

  it('is not offered in the skip quiz', async () => {
    const { user } = setup()
    await user.click(theme('Thème un').getByRole('button', { name: QUIZ }))
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: SKIP })).toBeNull()
  })

  it('leaves the settings list empty, with a word on how to fill it', async () => {
    const { user } = setup()
    await settings(user)
    expect(
      screen.getByRole('heading', { name: 'Réglages' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Aucun mot mis de côté/)).toBeInTheDocument()
  })
})

describe('setting words aside: edge cases', () => {
  it('shows a sub-theme whose words are all set aside as empty, and does not start it', () => {
    seed({ done: ['t1/s1'], skipped: ['t1/mere', 't1/pere'] })
    setup()
    const button = theme('Thème un').getByRole('button', { name: /Premier/ })
    expect(button).toHaveTextContent('0 cartes')
    expect(button).toBeDisabled()
  })

  it('counts only the words left in a sub-theme', () => {
    seed({ skipped: ['t1/mere'] })
    setup()
    expect(
      theme('Thème un').getByRole('button', { name: /Premier/ }),
    ).toHaveTextContent('1 carte')
  })

  it('offers no skip quiz when every word of the theme is set aside', () => {
    seed({ skipped: ['t1/mere', 't1/pere', 't1/frere', 't1/soeur'] })
    setup()
    expect(theme('Thème un').queryByRole('button', { name: QUIZ })).toBeNull()
  })

  it('sets one word aside on a double click, not two', async () => {
    seed({ notesSeen: ['t1'] })
    const { user } = setup()
    await open(user, 'Thème un', /Premier/)
    await user.dblClick(screen.getByRole('button', { name: SKIP }))
    expect(saved().skipped).toEqual(['t1/mere'])
    expect(screen.getByTestId('cloze-sentence')).toHaveTextContent('the father')
  })

  it('says, before leaving, that the words set aside stay aside', async () => {
    seed({ notesSeen: ['t1'] })
    const { user } = setup()
    await open(user, 'Thème un', /Premier/)
    await user.click(screen.getByRole('button', { name: SKIP }))
    await user.type(screen.getByRole('textbox'), 'faux{Enter}')
    await user.click(screen.getByRole('button', { name: 'Arrêter' }))
    expect(
      within(screen.getByRole('dialog')).getByText(
        /Les mots mis de côté le restent/,
      ),
    ).toBeInTheDocument()
  })

  it('names each "Remettre" button by its word', async () => {
    seed({ skipped: ['t1/mere', 't1/pere'] })
    const { user } = setup()
    await settings(user)
    expect(
      screen.getByRole('button', {
        name: 'Remettre',
        description: /the mother/,
      }),
    ).toBeInTheDocument()
  })
})

describe('the open path, in the settings', () => {
  it('opens every theme, and closes them again', async () => {
    const { user } = setup()
    expect(theme('Thème deux').queryAllByRole('button')).toEqual([])
    await settings(user)
    const box = screen.getByRole('checkbox', { name: 'Ouvrir tous les thèmes' })
    expect(box).not.toBeChecked()
    await user.click(box)
    expect(saved().openPath).toBe(true)
    await back(user)
    expect(
      theme('Thème deux').getByRole('button', { name: /Animaux/ }),
    ).toBeInTheDocument()

    await settings(user)
    await user.click(
      screen.getByRole('checkbox', { name: 'Ouvrir tous les thèmes' }),
    )
    await back(user)
    expect(theme('Thème deux').queryAllByRole('button')).toEqual([])
  })

  it('is reached from the path but not during a sitting', async () => {
    seed({ notesSeen: ['t1'] })
    const { user } = setup()
    expect(screen.getByRole('link', { name: 'Réglages' })).toBeInTheDocument()
    await open(user, 'Thème un', /Premier/)
    expect(screen.queryByRole('link', { name: 'Réglages' })).toBeNull()
  })
})

const HAND = {
  label: 'Écriture',
  sample: 'Bonjour',
  options: [
    { id: 'cursive', name: 'Attachée' },
    { id: 'print', name: 'Script' },
  ],
}
const withHands: typeof fixtureLanguage = {
  ...fixtureLanguage,
  path: {
    ...fixtureLanguage.path,
    copy: {
      ...fixtureLanguage.path.copy,
      settings: { ...fixtureLanguage.path.copy.settings, hand: HAND },
    },
  },
}
const hand = () => document.documentElement.dataset.hand

describe('the handwriting, in the settings', () => {
  const setupWithHands = () => {
    const user = userEvent.setup()
    const view = render(
      <LanguageContext value={withHands}>
        <PathCahier language={withHands} onLanguageChange={() => {}} />
      </LanguageContext>,
    )
    return { user, ...view }
  }

  it('is not offered by a language that names no handwriting', async () => {
    const { user } = setup()
    await settings(user)
    expect(screen.queryByRole('group', { name: 'Écriture' })).toBeNull()
    expect(hand()).toBeUndefined()
  })

  it('starts with the first one, and keeps the one picked', async () => {
    const { user, unmount } = setupWithHands()
    expect(hand()).toBe('cursive')
    await settings(user)
    const group = within(screen.getByRole('group', { name: 'Écriture' }))
    expect(group.getByRole('radio', { name: 'Attachée' })).toBeChecked()

    await user.click(group.getByRole('radio', { name: 'Script' }))
    expect(hand()).toBe('print')
    expect(saved().hand).toBe('print')

    unmount()
    expect(hand()).toBeUndefined()
  })

  it('shows each one on a sample, in that handwriting', async () => {
    const { user } = setupWithHands()
    await settings(user)
    const samples = screen.getAllByText('Bonjour')
    expect(samples.map((s) => s.dataset.hand)).toEqual(['cursive', 'print'])
  })

  it('falls back to the first one when the saved one is gone', () => {
    seed({ hand: 'gone' })
    setupWithHands()
    expect(hand()).toBe('cursive')
  })
})
