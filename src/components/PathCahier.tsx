import { useMemo, useRef, useState } from 'react'
import type { Language } from '../data/types.ts'
import {
  cardKey,
  dueCount,
  dueEntries,
  isSubDone,
  recordSitting,
} from '../domain/path.ts'
import { shuffled, type Entry } from '../domain/session.ts'
import {
  initialSitting,
  quizCards,
  sittingReducer,
  type SittingAction,
  type SittingKind,
} from '../domain/sitting.ts'
import type { SubTheme, Theme } from '../domain/types.ts'
import { clozeCsv } from '../domain/clozeExport.ts'
import { localDay } from '../domain/schedule.ts'
import { downloadCsv } from './download.ts'
import { usePathProgress } from '../storage/usePathProgress.ts'
import { GrammarNoteCard } from './GrammarNoteCard.tsx'
import { Header } from './Header.tsx'
import { PathView } from './PathView.tsx'
import { SittingEnd } from './SittingEnd.tsx'
import { SittingView } from './SittingView.tsx'

interface PathCahierProps {
  language: Language
  onLanguageChange: (language: Language) => void
}

type View =
  | { name: 'path' }
  // A theme's note; `then` is the sub-theme to start once it has been read.
  | { name: 'note'; theme: Theme; then?: SubTheme }
  | { name: 'sitting' }

/** A language on the path: its themes in order, sittings, review and quizzes. */
export function PathCahier({ language, onLanguageChange }: PathCahierProps) {
  const { path, themes } = language
  const copy = path.copy
  const pathThemes = useMemo(
    () => path.themes.flatMap((id) => themes.find((t) => t.id === id) ?? []),
    [path, themes],
  )
  const [progress, setProgress] = usePathProgress(path.storageKey, pathThemes)
  const [view, setView] = useState<View>({ name: 'path' })
  const [sitting, setSitting] = useState(initialSitting)
  const [run, setRun] = useState(0) // remounts the sitting on each start
  const sittingRef = useRef(sitting)

  // Like useReducer's dispatch, but records the sitting, once, as soon as an
  // action finishes it.
  const dispatch = (action: SittingAction) => {
    const prev = sittingRef.current
    const next = sittingReducer(prev, action)
    if (next === prev) return
    sittingRef.current = next
    setSitting(next)
    if (next.finished && !prev.finished)
      setProgress((p) => recordSitting(p, next, pathThemes, new Date()))
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
    setView({ name: 'sitting' })
  }

  const startSubTheme = (theme: Theme, sub: SubTheme) =>
    start(
      isSubDone(progress, theme.id, sub.id) ? 'practice' : 'learn',
      shuffled(sub.items.map((item) => ({ themeId: theme.id, item }))),
      { themeId: theme.id, subThemeId: sub.id },
    )

  const goToPath = () => setView({ name: 'path' })

  const now = new Date()
  const due = dueEntries(pathThemes, progress, now)

  // Cards learnt so far, in path order, and the sitting's own cards.
  const learnt = pathThemes.flatMap((theme) =>
    theme.items.flatMap((item) =>
      item.id && progress.cards[cardKey(theme.id, item.id)]
        ? [{ themeId: theme.id, item }]
        : [],
    ),
  )
  const learntCsv = clozeCsv(learnt)
  const sittingCsv = clozeCsv(sitting.cards)
  const fileName = (...parts: string[]) =>
    ['cahier', language.code, ...parts, localDay(now)].join('-') + '.csv'

  return (
    <div className="mx-auto flex max-w-[920px] flex-col gap-8 pt-10 pr-[max(16px,env(safe-area-inset-right,0px))] pb-16 pl-[max(16px,env(safe-area-inset-left,0px))]">
      <Header
        intro={copy.intro}
        onLanguageChange={view.name === 'path' ? onLanguageChange : undefined}
      />
      {view.name === 'path' && (
        <PathView
          themes={pathThemes}
          progress={progress}
          dueCount={dueCount(pathThemes, progress, now)}
          copy={copy}
          onReview={() => start('review', shuffled(due))}
          onSubTheme={(theme, sub) => {
            // A theme's note is shown once, before its first sitting.
            if (theme.note && !progress.notesSeen.includes(theme.id))
              setView({ name: 'note', theme, then: sub })
            else startSubTheme(theme, sub)
          }}
          onQuiz={(theme) =>
            start('quiz', quizCards(theme), { themeId: theme.id })
          }
          onNote={(theme) => setView({ name: 'note', theme })}
          onExport={
            learntCsv ? () => downloadCsv(fileName(), learntCsv) : undefined
          }
        />
      )}
      {view.name === 'note' && view.theme.note && (
        <GrammarNoteCard
          note={view.theme.note}
          copy={copy}
          onContinue={() => {
            const { theme, then } = view
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
      {view.name === 'sitting' &&
        (sitting.finished ? (
          <SittingEnd
            key={run}
            sitting={sitting}
            copy={copy}
            onHome={goToPath}
            onExport={
              sittingCsv
                ? () =>
                    downloadCsv(
                      fileName(
                        ...(sitting.themeId ? [sitting.themeId] : ['revision']),
                      ),
                      sittingCsv,
                    )
                : undefined
            }
          />
        ) : (
          <SittingView
            key={run}
            sitting={sitting}
            dispatch={dispatch}
            copy={copy}
            onLeave={goToPath}
          />
        ))}
    </div>
  )
}
