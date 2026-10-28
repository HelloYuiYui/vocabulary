import { Fragment } from 'react'
import { canOverride, tone, type GradeResult } from '../domain/grade.ts'
import type { Item } from '../domain/types.ts'
import { Actions } from './Actions.tsx'
import { Button } from './Button.tsx'
import { cx } from './cx.ts'
import { FrenchAnswer } from './FrenchAnswer.tsx'
import { TONE_CLASSES, VERDICT_LABELS } from './verdictCopy.ts'

interface VerdictPanelProps {
  result: GradeResult
  item: Item
  /** Shows "En fait, ma réponse était juste" when the verdict allows it. */
  onOverride?: () => void
  compact?: boolean
}

export function VerdictPanel({
  result: { verdict, answer },
  item,
  onOverride,
  compact,
}: VerdictPanelProps) {
  const others = item.fr.filter((a) => a.text !== answer.text)
  return (
    <div className="flex flex-col gap-1">
      <span
        className={cx('text-[0.95rem] font-bold', TONE_CLASSES[tone(verdict)])}
      >
        {VERDICT_LABELS[verdict]}
      </span>
      {verdict !== 'ok' && (
        <span
          className={cx(
            'font-hand leading-[1.3] text-pen',
            compact ? 'text-[1.25rem]' : 'text-[1.5rem]',
          )}
        >
          <FrenchAnswer answer={answer} />
        </span>
      )}
      {verdict === 'ok' && answer.gender && (
        <span className="text-[0.9rem] text-muted">
          <FrenchAnswer answer={answer} />
        </span>
      )}
      {others.length > 0 && (
        <span className="text-[0.9rem] text-muted">
          Aussi accepté :{' '}
          {others.map((a, i) => (
            <Fragment key={a.text}>
              {i > 0 && ' · '}
              <FrenchAnswer answer={a} />
            </Fragment>
          ))}
        </span>
      )}
      {item.note && (
        <span className="max-w-[62ch] text-[0.95rem] text-text">
          {item.note}
        </span>
      )}
      {onOverride && canOverride(verdict) && (
        <Actions>
          <Button variant="ghost" size="xs" onClick={onOverride}>
            En fait, ma réponse était juste
          </Button>
        </Actions>
      )}
    </div>
  )
}
