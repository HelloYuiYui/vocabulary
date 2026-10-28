/** Lower-cases and folds curly apostrophes, hyphens and punctuation into plain spacing. */
export const norm = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[’`ʼ]/g, "'")
    .replace(/[-‑–]/g, ' ')
    .replace(/[.,!?;:«»"()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/** Removes accents. */
export const bare = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '')

const ARTICLE = /^(l'|le |la |les |un |une |des |du |de la |de l')/

/** Removes a leading article from normalised text. */
export const stripArticle = (s: string): string => s.replace(ARTICLE, '').trim()

/** True when the article (l', les) does not show the gender. */
export const hidesGender = (input: string): boolean =>
  /^(l'|les )/.test(norm(input))
