import type { Copy } from '../data/types.ts'
import type { GradeResult, Tone } from '../domain/grade.ts'

export const TONE_CLASSES: Record<Tone, string> = {
  ok: 'text-ok',
  near: 'text-warn',
  bad: 'text-pen',
}

/** What screen readers hear: the verdict, then the correction. */
export const verdictMessage = (
  { verdict, answer }: GradeResult,
  labels: Copy['verdicts'],
): string =>
  verdict === 'ok' ? labels.ok : `${labels[verdict]} ${answer.text}`
