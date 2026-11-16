/**
 * A page of the app and its address. The address is the URL's hash, so the
 * static host never sees it: `#/fr`, `#/fr/note/famille`, `#/fr/sitting`.
 */
export type Page =
  | { name: 'path' }
  // A theme's note; `then` is the sub-theme to start once it has been read.
  | { name: 'note'; themeId: string; then?: string }
  | { name: 'sitting' }
  | { name: 'end' } // the end of a sitting, once it is recorded

/** The homepage's address: before, or apart from, any language. */
export const HOME = '#/'

export interface Route {
  lang: string
  page: Page
}

/** The route a hash names, or undefined when it names none. */
export function parseRoute(hash: string): Route | undefined {
  if (!hash.startsWith('#/')) return undefined
  const [lang, ...rest] = hash.slice(2).replace(/\/$/, '').split('/')
  if (!lang) return undefined
  const page = parsePage(rest)
  return page && { lang, page }
}

function parsePage([name, ...rest]: string[]): Page | undefined {
  if (name === undefined) return { name: 'path' }
  if (name === 'note' && rest.length >= 1 && rest.length <= 2 && rest[0])
    return rest[1]
      ? { name: 'note', themeId: rest[0], then: rest[1] }
      : { name: 'note', themeId: rest[0] }
  if (name === 'sitting' && rest.length === 0) return { name: 'sitting' }
  if (name === 'sitting' && rest.length === 1 && rest[0] === 'end')
    return { name: 'end' }
  return undefined
}

/** The hash of a route. */
export function formatRoute({ lang, page }: Route): string {
  const parts = [lang]
  if (page.name === 'note') {
    parts.push('note', page.themeId)
    if (page.then) parts.push(page.then)
  }
  if (page.name === 'sitting') parts.push('sitting')
  if (page.name === 'end') parts.push('sitting', 'end')
  return `#/${parts.join('/')}`
}
