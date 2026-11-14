import type { Copy } from '../types.ts'

export const copy: Copy = {
  header: {
    eyebrow: 'Български · A1',
    title: 'Тетрадка с думи',
  },
  card: {
    prompt: 'На български:',
    answerLabel: () => 'Твоят отговор',
    placeholder: 'пиши тук…',
    check: 'Провери',
    dunno: 'Не знам',
    next: 'Следващ ↵',
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
  languageLabel: 'Език',
}
