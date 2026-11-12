import type { Answer } from '../domain/types.ts'
import { GenderChip } from './GenderChip.tsx'

/** An answer's text, followed by its gender chip when the article hides it. */
export function AnswerText({ answer }: { answer: Answer }) {
  return (
    <>
      {answer.text}
      {answer.gender && <GenderChip gender={answer.gender} />}
    </>
  )
}
