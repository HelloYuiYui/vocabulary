import type { PathCopy } from '../data/types.ts'
import {
  quizPassed,
  rightFirstTime,
  type SittingState,
} from '../domain/sitting.ts'
import { Actions } from './Actions.tsx'
import { AnswerText } from './AnswerText.tsx'
import { Button } from './Button.tsx'
import { cx } from './cx.ts'
import { Eyebrow } from './Eyebrow.tsx'
import { Notebook } from './Notebook.tsx'

interface SittingEndProps {
  sitting: SittingState
  copy: PathCopy
  onHome: () => void
  /** Downloads the sitting's cards; left out when none can be exported. */
  onExport?: () => void
}

/**
 * What a finished sitting amounted to, stated as fact: which cards needed
 * more than one try, or the count a quiz ended on.
 */
export function SittingEnd({
  sitting,
  copy,
  onHome,
  onExport,
}: SittingEndProps) {
  const total = sitting.cards.length
  const right = rightFirstTime(sitting)
  const rows = sitting.cards.map((entry, i) => ({
    entry,
    retried: sitting.firstRight[i] !== true,
  }))
  // Stable sort: the cards that needed another try come first.
  const ordered = [...rows].sort(
    (x, y) => Number(y.retried) - Number(x.retried),
  )
  const summary =
    sitting.kind === 'quiz'
      ? quizPassed(sitting)
        ? copy.end.quizPassed(right, total)
        : copy.end.quizFailed(right, total)
      : right === total
        ? copy.end.allFirstTry
        : copy.end.retried(total - right)
  return (
    <section>
      <Notebook>
        <Eyebrow>{copy.end.title}</Eyebrow>
        <p className="max-w-[62ch] text-[1.05rem] text-text">{summary}</p>
        {ordered.length > 0 && (
          <ul>
            {ordered.map(({ entry, retried }) => (
              <li
                key={`${entry.themeId}/${entry.item.id ?? entry.item.en}`}
                className="grid grid-cols-2 gap-3 border-b border-dashed border-rule-strong py-[7px] max-[520px]:grid-cols-1 max-[520px]:gap-0"
              >
                <span>{entry.item.en}</span>
                <span
                  className={cx(
                    'font-hand text-[1.15rem]',
                    retried ? 'text-pen' : 'text-ink',
                  )}
                >
                  <AnswerText answer={entry.item.answers[0]} />
                </span>
              </li>
            ))}
          </ul>
        )}
        <Actions>
          <Button variant="primary" autoFocus onClick={onHome}>
            {copy.backToPath}
          </Button>
          {onExport && (
            <Button variant="ghost" onClick={onExport}>
              {copy.exportSitting}
            </Button>
          )}
        </Actions>
      </Notebook>
    </section>
  )
}
