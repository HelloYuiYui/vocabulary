import { useLayoutEffect, useState } from 'react'
import { LanguageContext } from './components/languageContext.ts'
import { PathCahier } from './components/PathCahier.tsx'
import { languageFor } from './data/language.ts'
import type { Language } from './data/types.ts'
import { loadLanguageCode, saveLanguageCode } from './storage/storage.ts'

export default function App() {
  const [language, setLanguage] = useState(() =>
    languageFor(loadLanguageCode()),
  )

  // A layout effect: the language's colours follow its lang attribute, and
  // must change in the same frame as its text.
  useLayoutEffect(() => {
    document.documentElement.lang = language.code
    document.title = language.copy.header.title
  }, [language])

  const onLanguageChange = (next: Language) => {
    saveLanguageCode(next.code)
    setLanguage(next)
  }

  // The key starts each language afresh, with its own saved progress.
  return (
    <LanguageContext value={language}>
      <PathCahier
        key={language.code}
        language={language}
        onLanguageChange={onLanguageChange}
      />
    </LanguageContext>
  )
}
