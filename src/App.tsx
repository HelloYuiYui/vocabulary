import { useRef, useState } from 'react'
import { CardSession } from './components/CardSession.tsx'
import { Header } from './components/Header.tsx'
import { HomeView } from './components/HomeView.tsx'
import { ListSession } from './components/ListSession.tsx'
import { ResultsView } from './components/ResultsView.tsx'
import { THEME_BY_ID, THEMES } from './data/themes.ts'
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
import { usePersistentState } from './storage/usePersistentState.ts'

export default function App() {
  const [stored, setStored] = usePersistentState()
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

  const start = (entries: Entry[], label: string, progress?: Record<string, number>) => {
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
      <Header />
      {view === 'home' ? (
        <HomeView
          themes={THEMES}
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
          onStart={(themes) => {
            const { entries, nextProgress } = entriesWithProgress(
              themes,
              stored.themeProgress,
              stored.sessionLimit,
            )
            start(
              entries,
              themes.length === 1 && themes[0] ? themes[0].name : 'mix',
              nextProgress,
            )
          }}
          onReview={() =>
            start(entriesFromKeys(stored.review, THEME_BY_ID), 'mix')
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
