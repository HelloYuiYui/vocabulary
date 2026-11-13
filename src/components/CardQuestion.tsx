import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { canOverride } from '../domain/grade.ts'
import type { PathCopy } from '../data/types.ts'
import { hidesGender, norm } from '../domain/normalise.ts'
import type { Draft, Entry, Response } from '../domain/session.ts'
import { Actions } from './Actions.tsx'
import { AnswerField } from './AnswerField.tsx'
import { Button } from './Button.tsx'
import { ClozePrompt } from './ClozePrompt.tsx'
import { VerdictPanel } from './VerdictPanel.tsx'
import { useCopy } from './languageContext.ts'

interface CardQuestionProps {
  entry: Entry
  response: Response | undefined
  onAnswer: (draft: Draft) => void
  onDunno: () => void
  onNext: () => void
  onOverride: () => void
  /** On the path: an item with a sentence is then shown as a cloze card. */
  pathCopy?: PathCopy
}

/** One card: the prompt, the answer, then the verdict. Remount it per card. */
export function CardQuestion({
  entry: { item },
  response,
  onAnswer,
  onDunno,
  onNext,
  onOverride,
  pathCopy,
}: CardQuestionProps) {
  const copy = useCopy()
  const [draft, setDraft] = useState<Draft>({ input: '', gender: null })
  const inputRef = useRef<HTMLInputElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const overrideRef = useRef<HTMLButtonElement>(null)
  const id = useId()
  const revealed = response !== undefined
  const sentence = pathCopy ? item.sentence : undefined

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

  // On the path, an answer whose article hides the gender (l', les) cannot
  // be checked until masculine or feminine is picked.
  const genderMissing =
    pathCopy !== undefined && hidesGender(draft.input) && !draft.gender
  const [askedForGender, setAskedForGender] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (revealed) return
    if (!norm(draft.input)) inputRef.current?.focus()
    else if (genderMissing) setAskedForGender(true)
    else onAnswer(draft)
  }

  return (
    <>
      {pathCopy && sentence ? (
        <ClozePrompt
          sentence={sentence}
          hint={item.en}
          revealed={revealed}
          copy={pathCopy}
        />
      ) : (
        <div>
          <p className="text-[0.8rem] tracking-[0.08em] text-muted uppercase">
            {copy.card.prompt}
          </p>
          <p className="font-display text-[clamp(1.4rem,4vw,2rem)] leading-[1.2] font-bold text-balance text-text">
            {item.en}
          </p>
        </div>
      )}
      {/* "contents" lets the field and buttons sit in the page's own flow. */}
      <form autoComplete="off" onSubmit={submit} className="contents">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={id} className="text-[0.9rem] text-muted">
            {copy.card.answerLabel(item.en)}
          </label>
          <AnswerField
            id={id}
            ref={inputRef}
            draft={draft}
            onChange={setDraft}
            disabled={revealed}
            placeholder={copy.card.placeholder}
            large
            autoFocus
          />
          {pathCopy && askedForGender && genderMissing && !revealed && (
            <p role="alert" className="text-[0.9rem] font-bold text-warn">
              {pathCopy.pickGender}
            </p>
          )}
        </div>
        {!response && (
          <Actions>
            <Button variant="primary" type="submit">
              {copy.card.check}
            </Button>
            <Button onClick={onDunno}>{copy.card.dunno}</Button>
          </Actions>
        )}
      </form>
      {response && (
        <>
          <VerdictPanel
            result={response.result}
            item={item}
            formLabel={pathCopy?.formNeeded}
          />
          <Actions>
            <Button ref={nextRef} variant="primary" onClick={onNext}>
              {copy.card.next}
            </Button>
            {canOverride(response.result.verdict) && (
              <Button ref={overrideRef} variant="ghost" onClick={onOverride}>
                {copy.override}
              </Button>
            )}
          </Actions>
        </>
      )}
    </>
  )
}
