import { useEffect, useRef, useState } from 'react'
import { CardSession } from './components/CardSession.tsx'
import { Header } from './components/Header.tsx'
import { HomeView } from './components/HomeView.tsx'
import { LanguageContext } from './components/languageContext.ts'
import { ListSession } from './components/ListSession.tsx'
import { ResultsView } from './components/ResultsView.tsx'
import { languageFor, themesById } from './data/language.ts'
import type { Language } from './data/types.ts'
import {
  entriesFromKeys,
  entriesWithProgress,
  groupedByTheme,
  initialSession,
  recordSession,
  sessionReducer,
  shuffled,
  type Entry,
  type SessionAction,
} from './domain/session.ts'
import { loadLanguageCode, saveLanguageCode } from './storage/storage.ts'
import { usePersistentState } from './storage/usePersistentState.ts'

export default function App() {
  const [language, setLanguage] = useState(() =>
    languageFor(loadLanguageCode()),
  )

  useEffect(() => {
    document.documentElement.lang = language.code
    document.title = language.copy.header.title
  }, [language])

  // The key starts each language afresh, with its own saved progress.
  return (
    <LanguageContext value={language}>
      <Cahier
        key={language.code}
        language={language}
        onLanguageChange={(next) => {
          saveLanguageCode(next.code)
          setLanguage(next)
        }}
      />
    </LanguageContext>
  )
}

interface CahierProps {
  language: Language
  onLanguageChange: (language: Language) => void
}

function Cahier({ language, onLanguageChange }: CahierProps) {
  const [stored, setStored] = usePersistentState(language)
  const [view, setView] = useState<'home' | 'session'>('home')
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [session, setSession] = useState(initialSession)
  const [run, setRun] = useState(0) // remounts the session views on restart
  const sessionRef = useRef(session)
  const pendingProgressRef = useRef<Record<string, number>>({})

  // Like useReducer's dispatch, but records the session as soon as an action
  // finishes it, or changes it afterwards (an override below the results).
  const dispatch = (action: SessionAction) => {
    const prev = sessionRef.current
    const next = sessionReducer(prev, action)
    if (next === prev) return
    sessionRef.current = next
    setSession(next)
    if (next.finished) {
      // Capture and clear progress before setStored (React may call the callback twice)
      const progressToSave = pendingProgressRef.current
      pendingProgressRef.current = {}
      setStored((s) => {
        const recorded = recordSession(s, next)
        if (Object.keys(progressToSave).length > 0) {
          return {
            ...recorded,
            themeProgress: { ...recorded.themeProgress, ...progressToSave },
          }
        }
        return recorded
      })
    }
  }

  const start = (
    entries: Entry[],
    label: string,
    progress?: Record<string, number>,
  ) => {
    pendingProgressRef.current = progress ?? {}
    const mode = stored.mode
    const ordered =
      mode === 'cards' ? shuffled(entries) : groupedByTheme(entries)
    dispatch({ type: 'start', mode, label, entries: ordered })
    setRun((r) => r + 1)
    setView('session')
  }
  const goHome = () => setView('home')

  return (
    <div className="mx-auto flex max-w-[920px] flex-col gap-8 pt-10 pr-[max(16px,env(safe-area-inset-right,0px))] pb-16 pl-[max(16px,env(safe-area-inset-left,0px))]">
      <Header
        onLanguageChange={view === 'home' ? onLanguageChange : undefined}
      />
      {view === 'home' ? (
        <HomeView
          themes={language.themes}
          stored={stored}
          selected={selected}
          onToggleTheme={(id, on) =>
            setSelected((prev) => {
              const next = new Set(prev)
              if (on) next.add(id)
              else next.delete(id)
              return next
            })
          }
          onModeChange={(mode) => setStored((s) => ({ ...s, mode }))}
          onSessionLimitChange={(sessionLimit) =>
            setStored((s) => ({ ...s, sessionLimit }))
          }
          onItemFilterChange={(itemFilter) =>
            setStored((s) => ({ ...s, itemFilter }))
          }
          onStart={(themes) => {
            const { entries, nextProgress } = entriesWithProgress(
              themes,
              stored.themeProgress,
              stored.sessionLimit,
              stored.itemFilter,
            )
            start(
              entries,
              themes.length === 1 && themes[0] ? themes[0].name : 'mix',
              nextProgress,
            )
          }}
          onReview={() =>
            start(
              entriesFromKeys(stored.review, themesById(language.themes)),
              'mix',
            )
          }
          onClearReview={() => setStored((s) => ({ ...s, review: [] }))}
        />
      ) : (
        <>
          {session.mode === 'cards' && !session.finished && (
            <CardSession key={run} session={session} dispatch={dispatch} />
          )}
          {session.mode === 'list' && (
            <ListSession
              key={run}
              session={session}
              dispatch={dispatch}
              onHome={goHome}
            />
          )}
          {session.finished && (
            <ResultsView
              key={run}
              session={session}
              onAgain={(entries) => start(entries, 'mix')}
              onHome={goHome}
              scrollIntoView={session.mode === 'list'}
            />
          )}
        </>
      )}
    </div>
  )
}
