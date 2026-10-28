# Cahier de vocabulaire

A small static site for testing French vocabulary by DELF theme. You get a word or phrase in English and type it in French. Answers are checked for accents, articles and gender, and missed words go into a review list you can copy into Anki.

## Features

- Two modes: one card at a time, or a full worksheet list on one page.
- Gender checks: when an answer starts with `l'` or `les`, a masculine/feminine picker appears. Typing `un escalier` instead of `l'escalier` also counts, since the indefinite article shows the gender.
- "Presque" verdicts for a wrong article or gender, and an override for sentences that can be phrased several ways.
- A results list showing every answer, a review list that persists between sessions, and a tab-separated export for Anki.

## Running it

No build step and no dependencies. Open `index.html` in a browser, or serve the folder:

```sh
npx serve .
# or
python3 -m http.server
```

It deploys as-is to GitHub Pages, Netlify or any static host.

## Structure

```
index.html        page markup
css/style.css     styles and light/dark theme tokens
js/themes.js      vocabulary data (THEMES)
js/app.js         grading, quiz and list modes, results, storage
docs/delf-checklist.md   A1 to B2 theme checklist, a roadmap for new themes
```

## Adding vocabulary

Edit `js/themes.js`. Each theme has an `id`, `name`, `level`, `desc` and `items`. Each item has an English prompt, a list of accepted French answers with the preferred one first, and an optional note:

```js
{ en: "the stairs", fr: ["l'escalier:m", "les escaliers:m"], note: "Optional explanation." }
```

When the article hides the gender (`l'`, `les`), append `:m` or `:f` to the answer.
