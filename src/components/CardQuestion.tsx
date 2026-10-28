import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { canOverride } from '../domain/grade.ts'
import { norm } from '../domain/normalise.ts'
import type { Draft, Entry, Response } from '../domain/session.ts'
import { Actions } from './Actions.tsx'
import { AnswerField } from './AnswerField.tsx'
import { Button } from './Button.tsx'
import { VerdictPanel } from './VerdictPanel.tsx'

interface CardQuestionProps {
  entry: Entry
  response: Response | undefined
  onAnswer: (draft: Draft) => void
  onDunno: () => void
  onNext: () => void
  onOverride: () => void
}

/** One card: the prompt, the answer, then the verdict. Remount it per card. */
export function CardQuestion({
  entry: { item },
  response,
  onAnswer,
  onDunno,
  onNext,
  onOverride,
}: CardQuestionProps) {
  const [draft, setDraft] = useState<Draft>({ input: '', gender: null })
  const inputRef = useRef<HTMLInputElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const overrideRef = useRef<HTMLButtonElement>(null)
  const id = useId()
  const revealed = response !== undefined

  // Once revealed, Enter anywhere goes to the next card, except on the
  // override button, which Enter activates instead.
  useEffect(() => {
    if (!revealed) return
    nextRef.current?.focus()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || document.activeElement === overrideRef.current)
        return
      e.preventDefault()
      onNext()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [revealed, onNext])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (revealed) return
    if (!norm(draft.input)) inputRef.current?.focus()
    else onAnswer(draft)
  }

  return (
    <>
      <div>
        <p className="text-[0.8rem] tracking-[0.08em] text-muted uppercase">
          En français :
        </p>
        <p className="font-display text-[clamp(1.4rem,4vw,2rem)] leading-[1.2] font-bold text-balance text-text">
          {item.en}
        </p>
      </div>
      {/* "contents" lets the field and buttons sit in the page's own flow. */}
      <form autoComplete="off" onSubmit={submit} className="contents">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id} className="text-[0.9rem] text-muted">
            {/^(the|a|an) /i.test(item.en)
              ? "Ta réponse, avec l'article"
              : 'Ta réponse'}
          </label>
          <AnswerField
            id={id}
            ref={inputRef}
            draft={draft}
            onChange={setDraft}
            disabled={revealed}
            placeholder="écris ici…"
            large
            autoFocus
          />
        </div>
        {!response && (
          <Actions>
            <Button variant="primary" type="submit">
              Vérifier
            </Button>
            <Button onClick={onDunno}>Je ne sais pas</Button>
          </Actions>
        )}
      </form>
      {response && (
        <>
          <VerdictPanel result={response.result} item={item} />
          <Actions>
            <Button ref={nextRef} variant="primary" onClick={onNext}>
              Suivant ↵
            </Button>
            {canOverride(response.result.verdict) && (
              <Button ref={overrideRef} variant="ghost" onClick={onOverride}>
                En fait, ma réponse était juste
              </Button>
            )}
          </Actions>
        </>
      )}
    </>
  )
}
