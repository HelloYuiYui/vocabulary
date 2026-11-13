import { useEffect, useState } from 'react'
import { LanguageContext } from './components/languageContext.ts'
import { LegacyCahier } from './components/LegacyCahier.tsx'
import { PathCahier } from './components/PathCahier.tsx'
import { languageFor } from './data/language.ts'
import type { Language } from './data/types.ts'
import { loadLanguageCode, saveLanguageCode } from './storage/storage.ts'

export default function App() {
  const [language, setLanguage] = useState(() =>
    languageFor(loadLanguageCode()),
  )

  useEffect(() => {
    document.documentElement.lang = language.code
    document.title = language.copy.header.title
  }, [language])

  const onLanguageChange = (next: Language) => {
    saveLanguageCode(next.code)
    setLanguage(next)
  }
  const { path } = language

  // The key starts each language afresh, with its own saved progress. A
  // language on the path opens on it; the others keep the theme picker.
  return (
    <LanguageContext value={language}>
      {path ? (
        <PathCahier
          key={language.code}
          language={{ ...language, path }}
          onLanguageChange={onLanguageChange}
        />
      ) : (
        <LegacyCahier
          key={language.code}
          language={language}
          onLanguageChange={onLanguageChange}
        />
      )}
    </LanguageContext>
  )
}
