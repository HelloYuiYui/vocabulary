import { THEME_BY_ID } from '../data/themes.ts'
import type { SessionAction, SessionState } from '../domain/session.ts'
import { Actions } from './Actions.tsx'
import { Announcer } from './Announcer.tsx'
import { Button } from './Button.tsx'
import { CardQuestion } from './CardQuestion.tsx'
import { Eyebrow } from './Eyebrow.tsx'
import { Notebook } from './Notebook.tsx'
import { verdictMessage } from './verdictCopy.ts'

interface CardSessionProps {
  session: SessionState
  dispatch: (action: SessionAction) => void
}

export function CardSession({ session, dispatch }: CardSessionProps) {
  const { entries, cursor } = session
  const entry = entries[cursor]
  if (!entry) return null
  const response = session.responses[cursor]
  return (
    <section>
      <Notebook>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Eyebrow as="span">{THEME_BY_ID.get(entry.themeId)?.name}</Eyebrow>
          <span className="text-[0.9rem] text-muted tabular-nums">
            {cursor + 1} / {entries.length}
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-xs bg-rule-strong">
          <span
            className="block h-full bg-ink transition-[width] duration-250 motion-reduce:transition-none"
            style={{ width: `${(cursor / entries.length) * 100}%` }}
          />
        </div>
        <CardQuestion
          key={cursor}
          entry={entry}
          response={response}
          onAnswer={(draft) =>
            dispatch({ type: 'answer', index: cursor, ...draft })
          }
          onDunno={() => dispatch({ type: 'dunno', index: cursor })}
          onNext={() => dispatch({ type: 'next' })}
          onOverride={() => {
            dispatch({ type: 'override', index: cursor })
            dispatch({ type: 'next' })
          }}
        />
      </Notebook>
      <Actions className="mt-3">
        <Button variant="ghost" onClick={() => dispatch({ type: 'finish' })}>
          Arrêter et voir le bilan
        </Button>
      </Actions>
      <Announcer message={response ? verdictMessage(response.result) : ''} />
    </section>
  )
}
