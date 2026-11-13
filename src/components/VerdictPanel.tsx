import { Fragment } from 'react'
import { canOverride, tone, type GradeResult } from '../domain/grade.ts'
import type { Item } from '../domain/types.ts'
import { Actions } from './Actions.tsx'
import { Button } from './Button.tsx'
import { cx } from './cx.ts'
import { AnswerText } from './AnswerText.tsx'
import { TONE_CLASSES } from './verdictCopy.ts'
import { useCopy } from './languageContext.ts'

interface VerdictPanelProps {
  result: GradeResult
  item: Item
  /** Shows the override button when the verdict allows it. */
  onOverride?: () => void
  compact?: boolean
  /** Introduces a cloze card's form in its sentence, when the result has one. */
  formLabel?: string
}

export function VerdictPanel({
  result: { verdict, answer, form },
  item,
  onOverride,
  compact,
  formLabel,
}: VerdictPanelProps) {
  const copy = useCopy()
  const others = item.answers.filter((a) => a.text !== answer.text)
  return (
    <div className="flex flex-col gap-1">
      <span
        className={cx('text-[0.95rem] font-bold', TONE_CLASSES[tone(verdict)])}
      >
        {copy.verdicts[verdict]}
      </span>
      {verdict !== 'ok' && (
        <span
          className={cx(
            'font-hand leading-[1.3] text-pen',
            compact ? 'text-[1.25rem]' : 'text-[1.5rem]',
          )}
        >
          <AnswerText answer={answer} />
        </span>
      )}
      {verdict === 'ok' && answer.gender && (
        <span className="text-[0.9rem] text-muted">
          <AnswerText answer={answer} />
        </span>
      )}
      {form && formLabel && (
        <span className="text-[0.9rem] text-muted">
          {formLabel}{' '}
          <span
            data-testid="needed-form"
            className="font-hand text-[1.25rem] text-pen"
          >
            <AnswerText answer={form} />
          </span>
        </span>
      )}
      {others.length > 0 && (
        <span className="text-[0.9rem] text-muted">
          {copy.alsoAccepted}{' '}
          {others.map((a, i) => (
            <Fragment key={a.text}>
              {i > 0 && ' · '}
              <AnswerText answer={a} />
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
            {copy.override}
          </Button>
        </Actions>
      )}
    </div>
  )
}
