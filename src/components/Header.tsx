import type { Language } from '../data/types.ts'
import { Eyebrow } from './Eyebrow.tsx'
import { useCopy } from './languageContext.ts'
import { LanguageToggle } from './LanguageToggle.tsx'

interface HeaderProps {
  /** Shows the language switcher; left out during a session. */
  onLanguageChange?: (language: Language) => void
  intro: string
}

export function Header({ onLanguageChange, intro }: HeaderProps) {
  const copy = useCopy()
  return (
    <header>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Eyebrow>{copy.header.eyebrow}</Eyebrow>
        {onLanguageChange && <LanguageToggle onChange={onLanguageChange} />}
      </div>
      <h1>{copy.header.title}</h1>
      <p className="mt-2.5 max-w-[62ch] text-muted">{intro}</p>
    </header>
  )
}
