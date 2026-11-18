import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { Language } from '../data/types.ts'
import {
  cardKey,
  dueCount,
  dueEntries,
  isSubDone,
  recordSitting,
  restoreCard,
  skipCard,
  themeStatuses,
  withoutSkipped,
  type PathProgress,
} from '../domain/path.ts'
import { formatRoute, HOME, parseRoute, type Page } from '../domain/route.ts'
import { go, useHash, useLeaveGuard } from '../routing/hashHistory.ts'
import { shuffled, type Entry } from '../domain/session.ts'
import {
  initialSitting,
  quizCards,
  sittingReducer,
  type SittingAction,
  type SittingKind,
  type SittingState,
} from '../domain/sitting.ts'
import type { SubTheme, Theme } from '../domain/types.ts'
import { clozeCsv } from '../domain/clozeExport.ts'
import { localDay } from '../domain/schedule.ts'
import { downloadCsv } from './download.ts'
import { usePathProgress } from '../storage/usePathProgress.ts'
import { ConfirmLeave } from './ConfirmLeave.tsx'
import { GrammarNoteCard } from './GrammarNoteCard.tsx'
import { Header } from './Header.tsx'
import { Page as PageFrame } from './Page.tsx'
import { PathView } from './PathView.tsx'
import { SettingsView } from './SettingsView.tsx'
import { SittingEnd } from './SittingEnd.tsx'
import { SittingView } from './SittingView.tsx'

interface PathCahierProps {
  language: Language
  onLanguageChange: (language: Language) => void
}

/** A page as it is shown: a note's theme and sub-theme looked up. */
type View =
  | { name: 'path' }
  | { name: 'note'; theme: Theme; then?: SubTheme }
  | { name: 'sitting' }
  | { name: 'end' }
  | { name: 'settings' }

const PATH: View = { name: 'path' }

/**
 * What a page shows, or undefined when it can't be shown: a note of a theme
 * that is locked, gone or noteless, or a sitting that is not running.
 */
function viewOf(
  page: Page,
  themes: Theme[],
  progress: PathProgress,
  sitting: SittingState,
): View | undefined {
  switch (page.name) {
    case 'path':
      return PATH
    case 'note': {
      const i = themes.findIndex((t) => t.id === page.themeId)
      const theme = themes[i]
      if (!theme?.note || themeStatuses(themes, progress)[i] === 'locked')
        return undefined
      if (page.then === undefined) return { name: 'note', theme }
      const then = theme.subThemes?.find((s) => s.id === page.then)
      return then && { name: 'note', theme, then }
    }
    case 'sitting':
      return sitting.cards.length > 0 && !sitting.finished ? page : undefined
    case 'end':
      return sitting.finished ? page : undefined
    case 'settings':
      return page
  }
}

/** A language on the path: its themes in order, sittings, review and quizzes. */
export function PathCahier({ language, onLanguageChange }: PathCahierProps) {
  const { path, themes } = language
  const copy = path.copy
  const pathThemes = useMemo(
    () => path.themes.flatMap((id) => themes.find((t) => t.id === id) ?? []),
    [path, themes],
  )
  const [progress, setProgress] = usePathProgress(path.storageKey, pathThemes)
  const [sitting, setSitting] = useState(initialSitting)
  const [run, setRun] = useState(0) // remounts the sitting on each start
  const [asking, setAsking] = useState(false) // whether to stop the sitting
  const sittingRef = useRef(sitting)

  // The handwriting picked, or the first one if it is no longer offered.
  const hands = copy.settings.hand?.options ?? []
  const hand = (hands.find((h) => h.id === progress.hand) ?? hands[0])?.id
  // On <html>, so that the font is right before the first paint.
  useLayoutEffect(() => {
    if (!hand) return
    const root = document.documentElement
    root.dataset.hand = hand
    return () => {
      delete root.dataset.hand
    }
  }, [hand])

  // The page comes from the address; another language's address is App's.
  const route = parseRoute(useHash())
  const page: Page =
    route?.lang === language.code ? route.page : { name: 'path' }
  const view = viewOf(page, pathThemes, progress, sitting)
  const goTo = (to: Page, options?: { replace?: boolean }) =>
    go(formatRoute({ lang: language.code, page: to }), options)

  // A page that can't be shown, such as a sitting's after a reload, gives way
  // to the path.
  useEffect(() => {
    if (!view)
      go(formatRoute({ lang: language.code, page: { name: 'path' } }), {
        replace: true,
      })
  }, [view, language.code])

  // A sitting with answers asks before Back or Arrêter throws them away.
  const answered =
    view?.name === 'sitting' && Object.keys(sitting.tries).length > 0
  const ask = useCallback(() => setAsking(true), [])
  useLeaveGuard(answered, ask)

  // Like useReducer's dispatch, but records the sitting, once, as soon as an
  // action finishes it, and moves on to its end.
  const dispatch = (action: SittingAction) => {
    const prev = sittingRef.current
    const next = sittingReducer(prev, action)
    if (next === prev) return
    // A card set aside leaves review at once, whether or not the sitting ends.
    const current = prev.cards[prev.queue[0] ?? -1]
    if (action.type === 'skip' && current?.item.id) {
      const { themeId, item } = current
      setProgress((p) => skipCard(p, themeId, item.id ?? ''))
    }
    sittingRef.current = next
    setSitting(next)
    if (next.finished && !prev.finished) {
      setProgress((p) => recordSitting(p, next, pathThemes, new Date()))
      goTo({ name: 'end' }, { replace: true })
    }
  }

  // Leaves a sitting, recording nothing. Forward will find no sitting.
  const leave = () => {
    setAsking(false)
    sittingRef.current = initialSitting
    setSitting(initialSitting)
    goTo({ name: 'path' })
  }

  const start = (
    kind: SittingKind,
    cards: Entry[],
    ids: { themeId?: string; subThemeId?: string } = {},
  ) => {
    if (cards.length === 0) return
    const started = sittingReducer(initialSitting, {
      type: 'start',
      kind,
      cards,
      ...ids,
    })
    sittingRef.current = started
    setSitting(started)
    setRun((r) => r + 1)
    // A sitting started from a note takes the note's place, so Back from the
    // sitting goes to the path.
    goTo({ name: 'sitting' }, { replace: view?.name === 'note' })
  }

  const startSubTheme = (theme: Theme, sub: SubTheme) =>
    start(
      isSubDone(progress, theme.id, sub.id) ? 'practice' : 'learn',
      shuffled(
        withoutSkipped(
          sub.items.map((item) => ({ themeId: theme.id, item })),
          progress,
        ),
      ),
      { themeId: theme.id, subThemeId: sub.id },
    )

  const goToPath = () => goTo({ name: 'path' })

  const now = new Date()
  const due = dueEntries(pathThemes, progress, now)

  // At the end of a sitting: all its cards, or those missed at the first try
  // (a wrong answer, "presque" or "je ne sais pas").
  // Cards set aside are left out of both.
  const aside = new Set(sitting.skipped)
  const kept = sitting.cards.filter((_, i) => !aside.has(i))
  const allCsv = clozeCsv(kept)
  const missedCsv = clozeCsv(
    sitting.cards.filter(
      (_, i) => !aside.has(i) && sitting.firstRight[i] !== true,
    ),
  )
  const sittingName = sitting.themeId ?? 'revision'
  const fileName = (...parts: string[]) =>
    ['cahier', language.code, ...parts, localDay(now)].join('-') + '.csv'

  const shown = view ?? PATH // until the address catches up

  return (
    <PageFrame>
      <Header
        intro={copy.intro}
        onLanguageChange={shown.name === 'path' ? onLanguageChange : undefined}
        onHome={shown.name === 'sitting' ? undefined : () => go(HOME)}
        settings={
          shown.name === 'path'
            ? {
                label: copy.settings.title,
                href: formatRoute({
                  lang: language.code,
                  page: { name: 'settings' },
                }),
                onOpen: () => goTo({ name: 'settings' }),
              }
            : undefined
        }
      />
      {shown.name === 'path' && (
        <PathView
          themes={pathThemes}
          progress={progress}
          dueCount={dueCount(pathThemes, progress, now)}
          copy={copy}
          onReview={() => start('review', shuffled(due))}
          onSubTheme={(theme, sub) => {
            // A theme's note is shown once, before its first sitting.
            if (theme.note && !progress.notesSeen.includes(theme.id))
              goTo({ name: 'note', themeId: theme.id, then: sub.id })
            else startSubTheme(theme, sub)
          }}
          onQuiz={(theme) =>
            start(
              'quiz',
              quizCards(
                theme,
                Math.random,
                (item) =>
                  !item.id ||
                  !progress.skipped.includes(cardKey(theme.id, item.id)),
              ),
              { themeId: theme.id },
            )
          }
          onNote={(theme) => goTo({ name: 'note', themeId: theme.id })}
        />
      )}
      {shown.name === 'settings' && (
        <SettingsView
          themes={pathThemes}
          progress={progress}
          copy={copy}
          onOpenPath={(open) => setProgress((p) => ({ ...p, openPath: open }))}
          hand={hand}
          onHand={(id) => setProgress((p) => ({ ...p, hand: id }))}
          onRestore={(themeId, itemId) =>
            setProgress((p) =>
              restoreCard(p, themeId, itemId, pathThemes, new Date()),
            )
          }
          onBack={goToPath}
        />
      )}
      {shown.name === 'note' && shown.theme.note && (
        <GrammarNoteCard
          note={shown.theme.note}
          copy={copy}
          onContinue={() => {
            const { theme, then } = shown
            setProgress((p) =>
              p.notesSeen.includes(theme.id)
                ? p
                : { ...p, notesSeen: [...p.notesSeen, theme.id] },
            )
            if (then) startSubTheme(theme, then)
            else goToPath()
          }}
        />
      )}
      {shown.name === 'end' && (
        <SittingEnd
          key={run}
          sitting={sitting}
          copy={copy}
          onHome={goToPath}
          onExportAll={
            allCsv
              ? () => downloadCsv(fileName(sittingName), allCsv)
              : undefined
          }
          onExportMissed={
            missedCsv
              ? () => downloadCsv(fileName(sittingName, 'ratees'), missedCsv)
              : undefined
          }
        />
      )}
      {shown.name === 'sitting' && (
        <SittingView
          key={run}
          sitting={sitting}
          dispatch={dispatch}
          copy={copy}
          onLeave={answered ? ask : leave}
        />
      )}
      {shown.name === 'sitting' && asking && (
        <ConfirmLeave
          copy={copy}
          keptAside={sitting.skipped.length > 0}
          onStay={() => setAsking(false)}
          onLeave={leave}
        />
      )}
    </PageFrame>
  )
}
