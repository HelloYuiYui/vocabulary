import type { PathCopy } from '../types.ts'

/** Polish plurals: 1 karta, 2–4 karty (but 12–14 kart), 5 and up kart. */
function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one
  const tens = n % 100
  return n % 10 >= 2 && n % 10 <= 4 && (tens < 12 || tens > 14) ? few : many
}

const cardsWord = (count: number) =>
  `${count} ${plural(count, 'karta', 'karty', 'kart')}`

export const pathCopy: PathCopy = {
  intro:
    'Idź ścieżką, temat po temacie. W każdym zdaniu wpisz po polsku brakujące słowo. Polskie znaki się liczą. Przyjmujemy też formę podstawową słowa, a karta pokaże wtedy formę, której wymagało zdanie. Poznane karty wracają później do powtórki.',
  sentencePrompt: 'Uzupełnij zdanie',
  formNeeded: 'W zdaniu:',
  listen: 'Odsłuchaj zdanie',
  review: (count) => `${cardsWord(count)} do powtórki`,
  cards: (count) => cardsWord(count),
  left: (count) =>
    `${plural(count, 'została', 'zostały', 'zostało')} ${cardsWord(count)}`,
  leave: 'Przerwij',
  subThemeDone: 'zrobione',
  locked: 'Wkrótce',
  quiz: 'Znam już ten temat',
  quizHelp:
    'Test z najwyżej 20 kart, bez drugiej próby. 80% otwiera następny temat.',
  note: 'Notatka gramatyczna',
  noteContinue: 'Dalej',
  backToPath: 'Wróć do ścieżki',
  exportSitting: 'Eksportuj te karty (CSV)',
  exportLearnt: 'Eksportuj poznane karty (CSV)',
  end: {
    title: 'Sesja zakończona',
    allFirstTry: 'Wszystkie karty za pierwszym razem.',
    retried: (count) =>
      `${cardsWord(count)} ${plural(count, 'wymagała', 'wymagały', 'wymagało')} więcej niż jednej próby.`,
    quizPassed: (right, total) => `${right}/${total}: temat zaliczony.`,
    quizFailed: (right, total) =>
      `${right}/${total}: temat nadal do zrobienia.`,
  },
}
