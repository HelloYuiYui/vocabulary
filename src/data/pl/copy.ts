import type { Copy } from '../types.ts'

export const copy: Copy = {
  header: {
    eyebrow: 'Polski · A1',
    title: 'Zeszyt słówek',
  },
  card: {
    prompt: 'Po polsku:',
    answerLabel: () => 'Twoja odpowiedź',
    placeholder: 'pisz tutaj…',
    check: 'Sprawdź',
    dunno: 'Nie wiem',
    next: 'Dalej ↵',
  },
  // Only French grading hides the gender or checks articles, so the
  // gender, article and elision verdicts are not expected here.
  verdicts: {
    ok: 'Dobrze!',
    accent: 'Dobrze, ale uważaj na polskie znaki.',
    elision: 'Dobrze. Poprawna forma to:',
    'gender-missing': 'Prawie: wybierz rodzaj.',
    gender: 'Prawie: słowo jest dobre, ale rodzaj nie.',
    article: 'Prawie: sprawdź formę.',
    bad: 'Nie całkiem.',
    dunno: 'Oto odpowiedź.',
    empty: 'Brak odpowiedzi.',
  },
  alsoAccepted: 'Też dobrze:',
  override: 'Właściwie moja odpowiedź była dobra',
  gender: {
    label: 'Rodzaj',
    m: { short: 'm.', long: 'rodzaj męski' },
    f: { short: 'ż.', long: 'rodzaj żeński' },
  },
  languageLabel: 'Język',
}
