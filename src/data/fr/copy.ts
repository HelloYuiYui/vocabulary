import type { Copy } from '../types.ts'

export const copy: Copy = {
  header: {
    eyebrow: 'DELF · A1 → B1',
    title: 'Cahier de vocabulaire',
  },
  card: {
    prompt: 'En français :',
    answerLabel: (en) =>
      /^(the|a|an) /i.test(en) ? "Ta réponse, avec l'article" : 'Ta réponse',
    placeholder: 'écris ici…',
    check: 'Vérifier',
    dunno: 'Je ne sais pas',
    next: 'Suivant ↵',
  },
  verdicts: {
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
  },
  alsoAccepted: 'Aussi accepté :',
  override: 'En fait, ma réponse était juste',
  gender: {
    label: 'Genre',
    m: { short: 'M', long: 'masculin' },
    f: { short: 'F', long: 'féminin' },
  },
  languageLabel: 'Langue',
}
