# Cahier de vocabulaire

A small web app for learning French vocabulary by DELF theme. Each language opens on a path: themes in order, each split into small sub-themes, where you fill in the missing word of a sentence. Answers are checked for accents and, in French, articles and gender, and the cards you have learnt come back for review.

It also teaches Bulgarian (_Тетрадка с думи_) and Polish (_Zeszyt słówek_), each with the first four A1 themes so far. Switch language at the top of the home page; each language keeps its own progress. See [Languages](#languages).

The Bulgarian and Polish sentences and grammar notes were drafted by an AI model and are still being checked by native speakers.

## The path

- **Themes in order.** The first theme is open; the next opens when every sub-theme of the current one is done. Inside a theme, take the sub-themes in any order.
- **Cloze cards.** A sentence in the language being learnt with one blank, and an English hint in the blank. After you answer, the card shows the whole sentence, its translation and any note.
- **Two accepted forms.** The form in the sentence is right, and so is the dictionary form; the card then shows the form the sentence needed. This matters most in Polish and Bulgarian, where the word in a sentence is often not its dictionary form. In French, gender stays strict.
- **Sittings.** A missed card comes round again until every card has been answered right once. Leaving early records nothing.
- **Review.** Finished cards return after 1, 3, 7, 14 and 30 days (Leitner boxes). A button above the path shows how many are due; a sitting takes at most 30.
- **Skip quiz.** "Je connais déjà ce thème" on an open theme: up to 20 cards, no second tries, 80% finishes the theme and opens the next.
- **Grammar notes.** At most one short reference card per theme, shown before its first sitting and reachable afterwards.
- **Audio.** A play button appears after answering when a sentence has a recording. None are included yet.
- **CSV export.** At the end of a sitting, "Exporter ces cartes (CSV)" saves that sitting's cards; under the path, "Exporter les cartes apprises (CSV)" saves every card learnt so far. Each row is the sentence with its blank written as `[[word:hint]]`, then the English translation, for example `"Je [[me lève:to get up]] à sept heures.","I get up at seven."`. There is no header row; the file is UTF-8 without a byte-order mark. The word is the form in the sentence, and the data tests reject a hint or blank containing `:`, `[[` or `]]`.

In Bulgarian and Polish, all four themes are on the path. In French, six themes are on the path so far: _Se présenter_, _Famille et entourage_, _Chiffres, dates, heure_, _Description simple_, _Chez soi_ and _Routine quotidienne_. The ten other French themes are kept in the pack, unseen, until each is converted (see [Converting an older theme](#converting-an-older-theme)).

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
src/App.tsx                 the chosen language and its path
src/data/language.ts        the list of language packs
src/data/types.ts           what a language pack holds
src/data/fr/, bg/, pl/      a language pack each: themes, interface text
src/data/<code>/a1/ …       vocabulary, one file per theme
src/data/<code>/themes.ts   the THEMES list, in checklist order
src/domain/                 grading, sittings, review schedule, path progress (no React)
src/storage/                localStorage: path progress, the chosen language
src/components/             one file per component, styled with Tailwind
  PathCahier.tsx            the path: sittings, review, quizzes, notes
src/styles/tokens.css       light and dark colour tokens
src/styles/index.css        Tailwind entry and token mapping
docs/delf-checklist.md      A1 to B2 theme checklist, a roadmap for new themes
```

## Adding vocabulary to the path

A theme on the path is built with `pathTheme()` and split into sub-themes of at most 12 cards. Each card is a `cloze()`: an id, the English hint, the dictionary forms, the sentence with its blank in braces, and the translation.

```ts
sub('parents-et-enfants', 'Parents et enfants', [
  cloze('mere', 'the mother', [a('la mère'), a('la maman')],
    '{La mère} de Julie est médecin.', "Julie's mother is a doctor."),
  cloze('oncle', 'the uncle', [a("l'oncle", 'm')],
    "{L'oncle} de Marie habite en Italie.", "Marie's uncle lives in Italy.", { gender: 'm' }),
]),
```

- The blank holds an article plus the noun, or the bare word for verbs, adjectives and the rest. Possessives and partitives stay outside it.
- Pass `gender` when the blank starts with `l'` or `les`.
- Don't put the blank straight after an elided word (`J'{habite}`): write `Nous {habitons}`.
- An id is a storage key: never change it once it is merged. Use ASCII slugs, transliterating Cyrillic (`mayka`). A word without a natural sentence can use `plain()`.
- The French-only rules above (articles, `gender`, elision) do not apply to Bulgarian and Polish. There the blank holds the word in whatever form the sentence needs, and the answers list the dictionary forms. Bulgarian sentences must hold no Latin letters, and Polish ones only the Polish alphabet.
- A theme may have one `note` (title, rule, table, exceptions), written in English with French examples.
- Add the theme's id to `path.themes` in the language's `index.ts` to put it on the path.

The data tests check all of this, so a bad card fails before it ships.

## Converting an older theme

Ten French themes predate the path. They are written with `word()` and `sentence()`: an English prompt and its accepted answers, with no sentence to fill in. They stay in `THEMES` and keep passing the data tests, but the app shows only the themes named in `path.themes`.

To bring one onto the path, rewrite it with `pathTheme()`, `sub()` and `cloze()` as above, keeping every word's English prompt, answers, genders and notes. Each old `sentence()` item either becomes a card on its key word, lends its sentence to an existing card, or is dropped. Then add the theme's id to `path.themes`.

## Languages

A language pack is a folder under `src/data/<code>/` with:

- `themes.ts` and the theme files, as above;
- `copy.ts`, the interface text shared by every screen, typed by `Copy` in `src/data/types.ts`, so a missing string fails the type check;
- `pathCopy.ts`, the path's interface text, typed by `PathCopy`;
- `index.ts`, exporting the `Language`: its code, its name for the switcher, its themes, its copy and its `path` (theme ids in order, a storage key and the path text). Each language needs its own storage key so that progress never mixes; the chosen language itself is kept under `cahier-vocab-language`.

Earlier versions kept progress from an older theme picker under `cahier-vocab-v1`, `cahier-vocab-v2`, `cahier-vocab-bg-v2` and `cahier-vocab-pl-v2`. The app no longer reads those entries and never deletes them.

To add one, copy `src/data/bg/`, translate it, and add it to `LANGUAGES` in `src/data/language.ts`; it then appears in the switcher. Components read the current pack with `useLanguage()` or `useCopy()` from `src/components/languageContext.ts`. If the alphabet isn't covered by the fonts in `index.html`, add a font that covers it as a fallback in `src/styles/tokens.css`, as Bulgarian does with Cyrillic.

Grading is shared. Its article and gender rules (`l'`, `les`, `un`/`une`) are French, and they simply never match Cyrillic, so Bulgarian is graded on spelling alone, with `и` for `й` or `ѝ` counted as an accent slip. They don't match Polish answers either. A language with articles of its own would need those rules moved into its pack.
