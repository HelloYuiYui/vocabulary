import { useEffect, useLayoutEffect } from 'react'
import { HomePage } from './components/HomePage.tsx'
import { LanguageContext } from './components/languageContext.ts'
import { PathCahier } from './components/PathCahier.tsx'
import { homeCopy } from './data/homeCopy.ts'
import { LANGUAGES } from './data/language.ts'
import type { Language } from './data/types.ts'
import { formatRoute, HOME } from './domain/route.ts'
import { go, useHash } from './routing/hashHistory.ts'
import { languageAt, languageNamedBy } from './routing/languageAt.ts'
import { saveLanguageCode } from './storage/storage.ts'

const pathOf = (language: Language) =>
  formatRoute({ lang: language.code, page: { name: 'path' } })

export default function App() {
  const hash = useHash()
  // Shown at once, before the address is set right, so a returning visitor
  // never glimpses the homepage on the way to their path.
  const language = languageAt(hash)
  const settled = hash === HOME || languageNamedBy(hash) !== undefined

  // An address that names no page takes the address of the page shown: the
  // saved language's path, or the homepage on a first visit.
  useEffect(() => {
    if (!settled) go(language ? pathOf(language) : HOME, { replace: true })
  }, [settled, language])

  // A layout effect: the language's colours follow its lang attribute, and
  // must change in the same frame as its text.
  useLayoutEffect(() => {
    document.documentElement.lang = language?.code ?? 'en'
    document.title = language?.copy.header.title ?? homeCopy.title
  }, [language])

  useEffect(() => {
    if (language) saveLanguageCode(language.code)
  }, [language])

  const choose = (next: Language) => go(pathOf(next))

  if (!language) return <HomePage languages={LANGUAGES} onChoose={choose} />

  // The key starts each language afresh, with its own saved progress.
  return (
    <LanguageContext value={language}>
      <PathCahier
        key={language.code}
        language={language}
        onLanguageChange={choose}
      />
    </LanguageContext>
  )
}
