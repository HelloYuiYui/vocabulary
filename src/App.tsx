import { useEffect, useLayoutEffect } from 'react'
import { LanguageContext } from './components/languageContext.ts'
import { PathCahier } from './components/PathCahier.tsx'
import type { Language } from './data/types.ts'
import { formatRoute, parseRoute } from './domain/route.ts'
import { go, useHash } from './routing/hashHistory.ts'
import { languageAt } from './routing/languageAt.ts'
import { saveLanguageCode } from './storage/storage.ts'

const pathOf = (language: Language) =>
  formatRoute({ lang: language.code, page: { name: 'path' } })

export default function App() {
  const hash = useHash()
  const language = languageAt(hash)
  const known = parseRoute(hash)?.lang === language.code

  // An address that names no page of a known language takes the address of
  // that language's path.
  useEffect(() => {
    if (!known) go(pathOf(language), { replace: true })
  }, [known, language])

  // A layout effect: the language's colours follow its lang attribute, and
  // must change in the same frame as its text.
  useLayoutEffect(() => {
    document.documentElement.lang = language.code
    document.title = language.copy.header.title
  }, [language])

  useEffect(() => {
    saveLanguageCode(language.code)
  }, [language.code])

  // The key starts each language afresh, with its own saved progress.
  return (
    <LanguageContext value={language}>
      <PathCahier
        key={language.code}
        language={language}
        onLanguageChange={(next) => go(pathOf(next))}
      />
    </LanguageContext>
  )
}
