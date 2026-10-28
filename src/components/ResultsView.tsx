import { useEffect, useRef, useState } from 'react'
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
import { FrenchAnswer } from './FrenchAnswer.tsx'
import { GENDER_LABELS } from './genderLabels.ts'
import { Notebook } from './Notebook.tsx'

function scoreLine(right: number, done: number): string {
  if (done === 0) return 'Aucune réponse cette fois.'
  if (right === done)
    return 'Sans faute. Ce thème est acquis, passe au suivant.'
  if (right / done >= 0.7)
    return 'Bonne base. Garde les mots ci-dessous dans ta liste.'
  return 'Ce thème mérite une session de plus. Commence par les mots ci-dessous.'
}

/** What the learner typed, with the gender they picked when it mattered. */
function givenText({ input, gender }: Response): string {
  const text = input.trim()
  return gender && hidesGender(text)
    ? `${text} ${GENDER_LABELS[gender].short}`
    : text
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
        <Eyebrow>Bilan</Eyebrow>
        <p className="font-display text-[clamp(2.6rem,8vw,4rem)] leading-none font-extrabold text-ink tabular-nums">
          {right}
          <small className="text-[0.45em] font-medium text-muted">
            {' '}
            / {responses.length}
          </small>
        </p>
        <p className="max-w-[62ch] text-[0.95rem] text-text">
          {scoreLine(right, responses.length)}
        </p>
        {responses.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3>Tes réponses</h3>
            <ul>
              {responses.map((r, i) => (
                <li
                  key={i}
                  className="grid grid-cols-2 gap-3 border-b border-dashed border-rule-strong py-[7px] max-[520px]:grid-cols-1 max-[520px]:gap-0"
                >
                  <span>{r.entry.item.en}</span>
                  <span
                    className={cx(
                      'font-hand text-[1.15rem]',
                      isRight(r) ? 'text-ok' : 'text-pen',
                    )}
                  >
                    <FrenchAnswer answer={r.result.answer} />
                    {!isRight(r) && r.input.trim() && (
                      <span className="ml-2.5 text-[0.95em] text-muted line-through">
                        {givenText(r)}
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
                Refaire les mots ratés
              </Button>
              <Button onClick={copyForAnki}>Copier pour Anki</Button>
            </>
          )}
          <Button variant="ghost" onClick={onHome}>
            Retour aux thèmes
          </Button>
          {copy.state === 'copied' && (
            <span className="text-[0.9rem] text-ok">
              Copié : une carte par ligne, séparée par une tabulation.
            </span>
          )}
        </Actions>
        {copy.state === 'manual' && (
          <textarea
            ref={copyBoxRef}
            readOnly
            value={copy.text}
            aria-label="Liste à copier"
            className="min-h-[120px] w-full rounded-md border border-line bg-sheet p-2 font-mono text-[0.85rem] leading-[1.4] text-text"
          />
        )}
      </Notebook>
    </section>
  )
}
