import type { PathCopy } from '../data/types.ts'
import type { SittingAction, SittingState } from '../domain/sitting.ts'
import { Actions } from './Actions.tsx'
import { Announcer } from './Announcer.tsx'
import { Button } from './Button.tsx'
import { CardQuestion } from './CardQuestion.tsx'
import { Eyebrow } from './Eyebrow.tsx'
import { useLanguage } from './languageContext.ts'
import { Notebook } from './Notebook.tsx'
import { verdictMessage } from './verdictCopy.ts'

interface SittingViewProps {
  sitting: SittingState
  dispatch: (action: SittingAction) => void
  copy: PathCopy
  /** Leaves without recording anything. */
  onLeave: () => void
}

/** A sitting on the path: one card at a time, missed ones coming round again. */
export function SittingView({
  sitting,
  dispatch,
  copy: pathCopy,
  onLeave,
}: SittingViewProps) {
  const { copy, themes } = useLanguage()
  const { cards, queue, response } = sitting
  const index = queue[0]
  const entry = index === undefined ? undefined : cards[index]
  if (index === undefined || !entry) return null
  const answered = cards.length - queue.length
  // A card that returns is a fresh question: the tries before this one are
  // part of its key, so it remounts with an empty, focused answer box.
  const asked = `${index}-${(sitting.tries[index] ?? 0) - (response ? 1 : 0)}`
  return (
    <section>
      <Notebook>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Eyebrow as="span">
            {themes.find((t) => t.id === entry.themeId)?.name}
          </Eyebrow>
          <span className="text-[0.9rem] text-muted tabular-nums">
            {pathCopy.left(queue.length)}
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-xs bg-rule-strong">
          <span
            className="block h-full bg-ink transition-[width] duration-250 motion-reduce:transition-none"
            style={{ width: `${(answered / cards.length) * 100}%` }}
          />
        </div>
        <CardQuestion
          key={asked}
          entry={entry}
          response={response}
          pathCopy={pathCopy}
          onAnswer={(draft) => dispatch({ type: 'answer', ...draft })}
          onDunno={() => dispatch({ type: 'dunno' })}
          onNext={() => dispatch({ type: 'next' })}
          onOverride={() => {
            dispatch({ type: 'override' })
            dispatch({ type: 'next' })
          }}
        />
      </Notebook>
      <Actions className="mt-3">
        <Button variant="ghost" onClick={onLeave}>
          {pathCopy.leave}
        </Button>
      </Actions>
      <Announcer
        message={response ? verdictMessage(response.result, copy.verdicts) : ''}
      />
    </section>
  )
}
