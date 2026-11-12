import type { Copy } from '../types.ts'

/** Polish plurals: 1 słowo, 2–4 słowa (but 12–14 słów), 5 and up słów. */
function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one
  const tens = n % 100
  return n % 10 >= 2 && n % 10 <= 4 && (tens < 12 || tens > 14) ? few : many
}

export const copy: Copy = {
  header: {
    eyebrow: 'Polski · A1',
    title: 'Zeszyt słówek',
    intro: (
      <>
        Dostajesz słowo po angielsku, a ty piszesz je po polsku. Pisz z polskimi
        znakami (ą, ć, ę, ł, ń, ó, ś, ź, ż): bez nich odpowiedź zaliczymy, ale z
        uwagą. Czasowniki pisz w bezokoliczniku, na przykład <em>mówić</em>.
        Błędne słowa trafiają na listę „do powtórki”.
      </>
    ),
  },
  home: {
    chooseThemes: 'Wybierz tematy',
    start: 'Zacznij',
    noTheme: 'Nie wybrano tematu',
    selection: (themes, questions, total) =>
      `${themes} ${plural(themes, 'temat', 'tematy', 'tematów')} · ${questions}${total ? `/${total}` : ''} ${plural(total ?? questions, 'pytanie', 'pytania', 'pytań')}`,
    mode: { label: 'Tryb', cards: 'Po jednym', list: 'Lista' },
    itemFilter: {
      label: 'Pytania',
      word: 'Słowa',
      sentence: 'Zdania',
      all: 'Wszystko',
    },
    sessionLimit: { label: 'Limit sesji', all: 'Wszystkie' },
  },
  review: {
    summary: (count, n) => (
      <>
        Masz {count} {plural(n, 'słowo', 'słowa', 'słów')} do powtórki z
        poprzednich sesji.
      </>
    ),
    start: 'Powtórz te słowa',
    clear: 'Wyczyść listę',
  },
  themeCard: {
    stats: (words, sentences) =>
      `${words} ${plural(words, 'słowo', 'słowa', 'słów')} · ${sentences} ${plural(sentences, 'zdanie', 'zdania', 'zdań')}`,
    lastScore: (right, total) => ` · ostatni wynik ${right}/${total}`,
    show: 'Pokaż słowa',
    hide: 'Ukryj słowa',
  },
  card: {
    prompt: 'Po polsku:',
    answerLabel: () => 'Twoja odpowiedź',
    placeholder: 'pisz tutaj…',
    check: 'Sprawdź',
    dunno: 'Nie wiem',
    next: 'Dalej ↵',
    stop: 'Zakończ i zobacz wynik',
  },
  list: {
    eyebrow: 'Ćwiczenie · przetłumacz na polski',
    help: 'Enter sprawdza wiersz i przechodzi do następnego. Możesz też wypełnić wszystko i sprawdzić naraz.',
    progress: (answered, total, right) =>
      `${answered} / ${total} sprawdzonych · ${right} dobrze`,
    checkAll: 'Sprawdź wszystko',
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
  results: {
    title: 'Wynik',
    scoreLine: (right, done) => {
      if (done === 0) return 'Tym razem brak odpowiedzi.'
      if (right === done)
        return 'Bez błędu. Ten temat masz opanowany, przejdź do następnego.'
      if (right / done >= 0.7)
        return 'Dobra podstawa. Zachowaj poniższe słowa na swojej liście.'
      return 'Ten temat wymaga jeszcze jednej sesji. Zacznij od słów poniżej.'
    },
    yourAnswers: 'Twoje odpowiedzi',
    retry: 'Powtórz błędne słowa',
    copyForAnki: 'Kopiuj do Anki',
    copied: 'Skopiowano: jedna karta na wiersz, oddzielona tabulatorem.',
    copyBox: 'Lista do skopiowania',
  },
  backToThemes: 'Wróć do tematów',
  languageLabel: 'Język',
}
