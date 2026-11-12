import type { Copy } from '../types.ts'

/** Picks the singular or plural form of a noun after a number. */
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

export const copy: Copy = {
  header: {
    eyebrow: 'Български · A1',
    title: 'Тетрадка с думи',
    intro: (
      <>
        Даваме ти думата на английски, а ти я пишеш на български, на кирилица.
        Правописът има значение. Глаголите пиши във формата за „аз“, например{' '}
        <em>говоря</em>, защото в българския няма инфинитив. Сгрешените думи
        отиват в списъка „за преговор“.
      </>
    ),
  },
  home: {
    chooseThemes: 'Избери теми',
    start: 'Започни',
    noTheme: 'Няма избрана тема',
    selection: (themes, questions, total) =>
      `${themes} ${plural(themes, 'тема', 'теми')} · ${questions}${total ? `/${total}` : ''} ${plural(total ?? questions, 'въпрос', 'въпроса')}`,
    mode: { label: 'Режим', cards: 'Една по една', list: 'Списък' },
    itemFilter: {
      label: 'Въпроси',
      word: 'Думи',
      sentence: 'Изречения',
      all: 'И двете',
    },
    sessionLimit: { label: 'Брой въпроси', all: 'Всички' },
  },
  review: {
    summary: (count, n) => (
      <>
        Имаш {count} {plural(n, 'дума', 'думи')} за преговор от предишните
        сесии.
      </>
    ),
    start: 'Преговори тези думи',
    clear: 'Изчисти списъка',
  },
  themeCard: {
    stats: (words, sentences) =>
      `${words} ${plural(words, 'дума', 'думи')} · ${sentences} ${plural(sentences, 'изречение', 'изречения')}`,
    lastScore: (right, total) => ` · последен резултат ${right}/${total}`,
    show: 'Покажи думите',
    hide: 'Скрий думите',
  },
  card: {
    prompt: 'На български:',
    answerLabel: () => 'Твоят отговор',
    placeholder: 'пиши тук…',
    check: 'Провери',
    dunno: 'Не знам',
    next: 'Следващ ↵',
    stop: 'Спри и виж резултата',
  },
  list: {
    eyebrow: 'Упражнение · преведи на български',
    help: 'Enter проверява реда и минава на следващия. Можеш и да попълниш всичко и да провериш наведнъж.',
    progress: (answered, total, right) =>
      `${answered} / ${total} проверени · ${right} верни`,
    checkAll: 'Провери всичко',
  },
  // Only French grading hides the gender or checks articles, so the
  // gender, article and elision verdicts are not expected here.
  verdicts: {
    ok: 'Вярно!',
    accent: 'Вярно, но внимавай с „й“ и „ѝ“.',
    elision: 'Вярно. Правилната форма е:',
    'gender-missing': 'Почти: избери рода.',
    gender: 'Почти: думата е вярна, но родът не е.',
    article: 'Почти: провери члена.',
    bad: 'Не съвсем.',
    dunno: 'Ето отговора.',
    empty: 'Няма отговор.',
  },
  alsoAccepted: 'Също вярно:',
  override: 'Всъщност отговорът ми беше верен',
  gender: {
    label: 'Род',
    m: { short: 'м. р.', long: 'мъжки род' },
    f: { short: 'ж. р.', long: 'женски род' },
  },
  results: {
    title: 'Резултат',
    scoreLine: (right, done) => {
      if (done === 0) return 'Този път няма отговори.'
      if (right === done)
        return 'Без грешка. Тази тема е усвоена, мини на следващата.'
      if (right / done >= 0.7)
        return 'Добра основа. Запази думите по-долу в списъка си.'
      return 'Тази тема иска още една сесия. Започни с думите по-долу.'
    },
    yourAnswers: 'Твоите отговори',
    retry: 'Повтори грешните',
    copyForAnki: 'Копирай за Anki',
    copied: 'Копирано: по една карта на ред, разделени с табулация.',
    copyBox: 'Списък за копиране',
  },
  backToThemes: 'Обратно към темите',
  languageLabel: 'Език',
}
