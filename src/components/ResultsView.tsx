import { useEffect, useRef, useState } from 'react'
import type { Copy } from '../data/types.ts'
import { ankiText } from '../domain/anki.ts'
import { hidesGender } from '../domain/normalise.ts'
import {
  isRight,
  responsesOf,
  type Entry,
  type Response,
  type SessionState,
} from '../domain/session.ts'
import { Actions } from './Actions.tsx'
import { Button } from './Button.tsx'
import { cx } from './cx.ts'
import { Eyebrow } from './Eyebrow.tsx'
import { AnswerText } from './AnswerText.tsx'
import { useCopy } from './languageContext.ts'
import { Notebook } from './Notebook.tsx'

/** What the learner typed, with the gender they picked when it mattered. */
function givenText(
  { input, gender }: Response,
  labels: Copy['gender'],
): string {
  const text = input.trim()
  return gender && hidesGender(text) ? `${text} ${labels[gender].short}` : text
}

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface ResultsViewProps {
  session: SessionState
  onAgain: (entries: Entry[]) => void
  onHome: () => void
  /** Scroll the results into view when they appear below a worksheet. */
  scrollIntoView?: boolean
}

export function ResultsView({
  session,
  onAgain,
  onHome,
  scrollIntoView,
}: ResultsViewProps) {
  const ui = useCopy()
  const responses = responsesOf(session)
  const right = responses.filter(isRight).length
  const missed = responses.filter((r) => !isRight(r))
  const [copy, setCopy] = useState<
    { state: 'idle' | 'copied' } | { state: 'manual'; text: string }
  >({ state: 'idle' })
  const sectionRef = useRef<HTMLElement>(null)
  const copyBoxRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!scrollIntoView) return
    sectionRef.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }, [scrollIntoView])

  useEffect(() => {
    if (copy.state !== 'manual') return
    copyBoxRef.current?.focus()
    copyBoxRef.current?.select()
  }, [copy])

  const copyForAnki = () => {
    const text = ankiText(missed.map((r) => r.entry.item))
    const manual = () => setCopy({ state: 'manual', text })
    try {
      navigator.clipboard
        .writeText(text)
        .then(() => setCopy({ state: 'copied' }), manual)
    } catch {
      manual()
    }
  }

  return (
    <section ref={sectionRef}>
      <Notebook>
        <Eyebrow>{ui.results.title}</Eyebrow>
        <p className="font-display text-[clamp(2.6rem,8vw,4rem)] leading-none font-extrabold text-ink tabular-nums">
          {right}
          <small className="text-[0.45em] font-medium text-muted">
            {' '}
            / {responses.length}
          </small>
        </p>
        <p className="max-w-[62ch] text-[0.95rem] text-text">
          {ui.results.scoreLine(right, responses.length)}
        </p>
        {responses.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3>{ui.results.yourAnswers}</h3>
            <ul>
              {responses.map((r, i) => (
                <li
                  key={`${i}-${r.entry.themeId}-${r.entry.item.en}`}
                  className="grid grid-cols-2 gap-3 border-b border-dashed border-rule-strong py-[7px] max-[520px]:grid-cols-1 max-[520px]:gap-0"
                >
                  <span>{r.entry.item.en}</span>
                  <span
                    className={cx(
                      'font-hand text-[1.15rem]',
                      isRight(r) ? 'text-ok' : 'text-pen',
                    )}
                  >
                    <AnswerText answer={r.result.answer} />
                    {!isRight(r) && r.input.trim() && (
                      <span className="ml-2.5 text-[0.95em] text-muted line-through">
                        {givenText(r, ui.gender)}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Actions>
          {missed.length > 0 && (
            <>
              <Button
                variant="primary"
                onClick={() => onAgain(missed.map((r) => r.entry))}
              >
                {ui.results.retry}
              </Button>
              <Button onClick={copyForAnki}>{ui.results.copyForAnki}</Button>
            </>
          )}
          <Button variant="ghost" onClick={onHome}>
            {ui.backToThemes}
          </Button>
          {copy.state === 'copied' && (
            <span className="text-[0.9rem] text-ok">{ui.results.copied}</span>
          )}
        </Actions>
        {copy.state === 'manual' && (
          <textarea
            ref={copyBoxRef}
            readOnly
            value={copy.text}
            aria-label={ui.results.copyBox}
            className="min-h-[120px] w-full rounded-md border border-line bg-sheet p-2 font-mono text-[0.85rem] leading-[1.4] text-text"
          />
        )}
      </Notebook>
    </section>
  )
}
