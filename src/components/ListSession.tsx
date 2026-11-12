import { Fragment, useRef, useState } from 'react'
import {
  isRight,
  responsesOf,
  type Draft,
  type Entry,
  type SessionAction,
  type SessionState,
} from '../domain/session.ts'
import { Announcer } from './Announcer.tsx'
import { Button } from './Button.tsx'
import { Eyebrow } from './Eyebrow.tsx'
import { useLanguage } from './languageContext.ts'
import { ListRow } from './ListRow.tsx'
import { Notebook } from './Notebook.tsx'
import { verdictMessage } from './verdictCopy.ts'

const EMPTY_DRAFT: Draft = { input: '', gender: null }

interface ListSessionProps {
  session: SessionState
  dispatch: (action: SessionAction) => void
  onHome: () => void
}

/** The worksheet: every prompt on one page, grouped by theme. */
export function ListSession({ session, dispatch, onHome }: ListSessionProps) {
  const { copy, themes } = useLanguage()
  const { entries, responses } = session
  const [drafts, setDrafts] = useState<Record<number, Draft>>({})
  const [lastChecked, setLastChecked] = useState<number | 'all' | null>(null)
  const inputs = useRef(new Map<number, HTMLInputElement>())

  // Entries arrive grouped by theme, so each run of one theme is a group.
  const groups: { themeId: string; rows: { index: number; entry: Entry }[] }[] =
    []
  entries.forEach((entry, index) => {
    const last = groups.at(-1)
    if (last?.themeId === entry.themeId) last.rows.push({ index, entry })
    else groups.push({ themeId: entry.themeId, rows: [{ index, entry }] })
  })

  const answered = responsesOf(session)
  const progress = copy.list.progress(
    answered.length,
    entries.length,
    answered.filter(isRight).length,
  )
  const lastResponse =
    typeof lastChecked === 'number' ? responses[lastChecked] : undefined

  const checkRow = (index: number) => {
    dispatch({ type: 'answer', index, ...(drafts[index] ?? EMPTY_DRAFT) })
    setLastChecked(index)
    const next = entries.findIndex((_, i) => i > index && !responses[i])
    if (next >= 0) inputs.current.get(next)?.focus()
  }

  return (
    <section className="flex flex-col gap-5">
      <Notebook>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <Eyebrow as="span">{copy.list.eyebrow}</Eyebrow>
          <Button variant="ghost" onClick={onHome}>
            {copy.backToThemes}
          </Button>
        </div>
        <p className="text-[0.9rem] text-muted">{copy.list.help}</p>
        <div className="flex flex-col gap-2">
          {groups.map((group) => (
            <Fragment key={group.rows[0]?.index}>
              <p className="pt-2 font-display text-[1.15rem] font-bold text-ink">
                {themes.find((t) => t.id === group.themeId)?.name}
              </p>
              <ol className="flex flex-col">
                {group.rows.map(({ index, entry }) => (
                  <ListRow
                    key={index}
                    number={index + 1}
                    entry={entry}
                    draft={drafts[index] ?? EMPTY_DRAFT}
                    response={responses[index]}
                    onDraft={(draft) =>
                      setDrafts((d) => ({ ...d, [index]: draft }))
                    }
                    onCheck={() => checkRow(index)}
                    onOverride={() => dispatch({ type: 'override', index })}
                    autoFocus={index === 0}
                    inputRef={(el) => {
                      if (el) inputs.current.set(index, el)
                      else inputs.current.delete(index)
                    }}
                  />
                ))}
              </ol>
            </Fragment>
          ))}
        </div>
      </Notebook>
      <div className="sticky bottom-0 z-2 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-paper pt-3 pb-[env(safe-area-inset-bottom,0px)]">
        <span className="text-[0.9rem] text-muted tabular-nums">
          {progress}
        </span>
        <Button
          variant="primary"
          disabled={session.finished}
          onClick={() => {
            dispatch({ type: 'checkAll', drafts })
            setLastChecked('all')
          }}
        >
          {copy.list.checkAll}
        </Button>
      </div>
      <Announcer
        message={
          lastChecked === 'all'
            ? progress
            : lastResponse
              ? verdictMessage(lastResponse.result, copy.verdicts)
              : ''
        }
      />
    </section>
  )
}
