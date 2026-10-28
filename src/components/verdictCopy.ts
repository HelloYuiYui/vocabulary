import type { GradeResult, Tone, Verdict } from '../domain/grade.ts'

export const VERDICT_LABELS: Record<Verdict, string> = {
  ok: 'Juste !',
  accent: 'Juste, mais attention aux accents.',
  elision: "Juste, et le genre est bon. Avec l'article défini, on écrit :",
  'gender-missing':
    "Presque : l'article ne montre pas le genre, choisis masculin ou féminin.",
  gender: 'Presque : le mot est bon, mais pas le genre.',
  article: "Presque : vérifie l'article ou le genre.",
  bad: 'Pas tout à fait.',
  dunno: 'Voici la réponse.',
  empty: 'Pas de réponse.',
}

export const TONE_CLASSES: Record<Tone, string> = {
  ok: 'text-ok',
  near: 'text-warn',
  bad: 'text-pen',
}

/** What screen readers hear: the verdict, then the correction. */
export const verdictMessage = ({ verdict, answer }: GradeResult): string =>
  verdict === 'ok'
    ? VERDICT_LABELS.ok
    : `${VERDICT_LABELS[verdict]} ${answer.text}`
