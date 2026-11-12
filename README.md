# Cahier de vocabulaire

A small web app for testing French vocabulary by DELF theme. You get a word or phrase in English and type it in French. Answers are checked for accents, articles and gender, and missed words go into a review list you can copy into Anki.

It also teaches Bulgarian (_Тетрадка с думи_) and Polish (_Zeszyt słówek_), each with the first four A1 themes so far. Switch language at the top of the home page; each language keeps its own progress. See [Languages](#languages).

## Features

- Two modes: one card at a time, or a full worksheet list on one page.
- Ask only words, only sentences, or both. With a session limit, each choice keeps its own place in every theme.
- Gender checks: when an answer starts with `l'` or `les`, a masculine/feminine picker appears. Typing `un escalier` instead of `l'escalier` also counts, since the indefinite article shows the gender.
- "Presque" verdicts for a wrong article or gender, and an override for sentences that can be phrased several ways.
- A results list showing every answer, a review list that persists between sessions, and a tab-separated export for Anki.

## Running it

React and TypeScript, built with Vite and managed with pnpm. The project pins Node 26 (LTS); pnpm downloads it for the project's scripts if your system Node differs.

```sh
pnpm install
pnpm dev          # dev server
pnpm build        # type-check and build to dist/
pnpm preview      # serve the build
```

Checks, all run in CI:

```sh
pnpm test         # Vitest: domain, storage and component tests
pnpm lint         # ESLint
pnpm typecheck    # tsc
pnpm format       # Prettier (format:check in CI)
```

## Deployment

Pushing to `main` deploys to GitHub Pages through `.github/workflows/pages.yml`. In the repository settings, set Pages to deploy from GitHub Actions. The base path defaults to `/cahier-de-vocabulaire/`; set `BASE_PATH` to build for another host or path, for example `BASE_PATH=/ pnpm build`.

## Structure

```
index.html                  page shell and Google Fonts
src/main.tsx                entry point
src/App.tsx                 view state, saved progress, session dispatch
src/data/language.ts        the list of language packs
src/data/types.ts           what a language pack holds
src/data/fr/, bg/, pl/      a language pack each: themes, interface text
src/data/<code>/a1/ …       vocabulary, one file per theme
src/data/<code>/themes.ts   the THEMES list, in checklist order
src/domain/                 grading, session reducer, Anki export (no React)
src/storage/                localStorage load, save and migration
src/components/             one file per component, styled with Tailwind
src/styles/tokens.css       light and dark colour tokens
src/styles/index.css        Tailwind entry and token mapping
docs/delf-checklist.md      A1 to B2 theme checklist, a roadmap for new themes
```

## Adding vocabulary

Each theme lives in its own file under `src/data/<code>/<level>/` and has an `id`, `name`, `level`, `desc` and `items`. Items are built with `word()` or `sentence()`: an English prompt, the accepted answers with the preferred one first, and an optional note in the language being learnt:

```ts
word('the stairs', [a("l'escalier", 'm'), a('les escaliers', 'm')], 'Optional note.'),
sentence('Where is the station?', [a('Où est la gare ?')]),
```

Use `sentence()` for prompts ending in `.`, `?` or `!`, and `word()` for everything else, including verb phrases like "to have a shower". When the article hides the gender (`l'`, `les`), pass it as the second argument to `a()`. Add a new theme to `THEMES` in `src/data/<code>/themes.ts`. The tests check that genders and item types are set correctly and that ids and prompts are unique, since saved progress is keyed on them.

In Bulgarian, prompt nouns without "the" (`word('family', [a('семейство')])`), since the answer is the bare form, and give verbs in the "аз" form (`говоря`), since Bulgarian has no infinitive. The tests reject Latin letters in Bulgarian answers, which look the same as Cyrillic а, е, о, с, р but never match.

In Polish, prompt nouns without "the" too, but give verbs in the infinitive (`mówić`). A missing Polish letter, `ł` included, counts as an accent slip, like a missing French accent.

## Languages

A language pack is a folder under `src/data/<code>/` with:

- `themes.ts` and the theme files, as above;
- `copy.tsx`, every piece of interface text, typed by `Copy` in `src/data/types.ts`, so a missing string fails the type check;
- `index.ts`, exporting the `Language`: its code, its name for the switcher, its themes, its copy and its localStorage key. Each language needs its own key so that progress never mixes; the chosen language itself is kept under `cahier-vocab-language`.

To add one, copy `src/data/bg/`, translate it, and add it to `LANGUAGES` in `src/data/language.ts`; it then appears in the switcher. Components read the current pack with `useLanguage()` or `useCopy()` from `src/components/languageContext.ts`. If the alphabet isn't covered by the fonts in `index.html`, add a font that covers it as a fallback in `src/styles/tokens.css`, as Bulgarian does with Cyrillic.

Grading is shared. Its article and gender rules (`l'`, `les`, `un`/`une`) are French, and they simply never match Cyrillic, so Bulgarian is graded on spelling alone, with `и` for `й` or `ѝ` counted as an accent slip. They don't match Polish answers either. A language with articles of its own would need those rules moved into its pack.
