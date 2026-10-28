# Cahier de vocabulaire

A small web app for testing French vocabulary by DELF theme. You get a word or phrase in English and type it in French. Answers are checked for accents, articles and gender, and missed words go into a review list you can copy into Anki.

## Features

- Two modes: one card at a time, or a full worksheet list on one page.
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
src/data/a1/, src/data/a2/  vocabulary, one file per theme
src/data/themes.ts          the THEMES list, in checklist order
src/domain/                 grading, session reducer, Anki export (no React)
src/storage/                localStorage load, save and migration
src/components/             one file per component, styled with Tailwind
src/styles/tokens.css       light and dark colour tokens
src/styles/index.css        Tailwind entry and token mapping
docs/delf-checklist.md      A1 to B2 theme checklist, a roadmap for new themes
```

## Adding vocabulary

Each theme lives in its own file under `src/data/<level>/` and has an `id`, `name`, `level`, `desc` and `items`. Items are built with `word()` or `sentence()`: an English prompt, the accepted French answers with the preferred one first, and an optional note in French:

```ts
word('the stairs', [a("l'escalier", 'm'), a('les escaliers', 'm')], 'Optional note.'),
sentence('Where is the station?', [a('Où est la gare ?')]),
```

Use `sentence()` for prompts ending in `.`, `?` or `!`, and `word()` for everything else, including verb phrases like "to have a shower". When the article hides the gender (`l'`, `les`), pass it as the second argument to `a()`. Add a new theme to `THEMES` in `src/data/themes.ts`. The tests check that genders and item types are set correctly and that ids and prompts are unique, since saved progress is keyed on them.
