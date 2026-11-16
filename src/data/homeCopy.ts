import type { HomeCopy } from './types.ts'

/**
 * The homepage, in English: it comes before a language is chosen. It states
 * what the notebook does and does not do, and promises nothing.
 */
export const homeCopy: HomeCopy = {
  title: 'Cahier de vocabulaire',
  tagline: 'A vocabulary notebook for French, Bulgarian and Polish.',
  intro:
    'Everyday words, learnt theme by theme, inside real sentences. Each card is a sentence in the language you are learning with one word missing. An English hint takes its place, and you type the word.',
  how: {
    title: 'How it works',
    points: [
      {
        lead: 'You type the word.',
        rest: ' Writing it yourself pulls it out of memory instead of only recognising it. That effort, active recall, is what makes a word stay.',
      },
      {
        lead: 'Cards come back when they are due.',
        rest: ' A word you get right returns after 1, 3, 7, 14 and 30 days; one you miss starts again the next day.',
      },
      {
        lead: 'Themes open in order,',
        rest: ' in short sittings of up to 12 cards. A card you miss comes back until you get it right.',
      },
    ],
  },
  isnt: {
    title: 'What it isn’t',
    body: 'It is not a course. Words stick when you meet them again and again in what you read, hear and say: comprehensible input. Use this notebook beside that input, not instead of it. On its own, it will not take you far.',
  },
  expect: {
    title: 'What to expect',
    body: 'Coming back often matters more than long sessions. Progress is slow and uneven, and that is normal. The notebook shows what you have done and what is due, nothing more.',
  },
  choose: { title: 'Choose a language' },
  summary: (themes, levels, exam) =>
    `${themes} ${themes === 1 ? 'theme' : 'themes'}, ${levels.join(', ')}${exam ? ` (${exam})` : ''}`,
  awaitingReview: 'Drafted with AI help, awaiting review by a native speaker.',
}
