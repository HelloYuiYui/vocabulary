# CLAUDE.md

Context for working on this repo.

## What this is

A static French vocabulary trainer organised by DELF themes, A1 to B1 so far. It is plain HTML, CSS and JavaScript with no framework, bundler or dependencies, and it should stay that way unless there is a clear reason to change.

## Conventions

- UI text is in French. Prompts are in English, answers in French.
- Vocabulary lives only in `js/themes.js`, as the global `THEMES` array loaded before `js/app.js`.
- The first entry in `fr` is the answer shown in corrections and exports; the others are also accepted.
- Answers whose article hides the gender (`l'`, `les`) carry a `:m` or `:f` suffix, parsed by `parseAns()` in `app.js`.
- Grading in `grade()` normalises case, apostrophes, hyphens and punctuation. It returns one of: `ok`, `accent`, `elision` (all count as correct), `gender-missing`, `gender`, `article` (shown as "presque"), `bad`, plus `dunno` and `empty` from the UI.
- Progress, the review list and the chosen mode are stored in `localStorage` under `cahier-vocab-v1`. Every read and write is wrapped in try/catch, and the page must work without storage.
- Colours are CSS custom properties on `:root`, redefined for dark mode. Never hard-code a colour in a component rule.
- Visual language: a plain notebook page with a red margin line. The learner's text is set in Kalam in ink blue, corrections in red pen. Masculine and feminine have their own chip colours.

## Roadmap ideas

- Add the remaining A2 and B1 themes listed in `docs/delf-checklist.md`.
- Accept answers typed without an apostrophe (`l escalier`) as "presque" rather than wrong.
- A French to English direction, and per-theme progress over time.
