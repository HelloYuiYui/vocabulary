import type { MouseEvent } from 'react'
import type { Language } from '../data/types.ts'
import { HOME } from '../domain/route.ts'
import { Eyebrow } from './Eyebrow.tsx'
import { useCopy } from './languageContext.ts'
import { LanguageToggle } from './LanguageToggle.tsx'

interface HeaderProps {
  /** Shows the language switcher; left out during a session. */
  onLanguageChange?: (language: Language) => void
  /** Links the title to the homepage; left out during a sitting. */
  onHome?: () => void
  intro: string
}

export function Header({ onLanguageChange, onHome, intro }: HeaderProps) {
  const copy = useCopy()
  // A plain click stays in the app; a modified one (new tab) is the browser's.
  const onTitleClick = (event: MouseEvent) => {
    if (
      !onHome ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return
    event.preventDefault()
    onHome()
  }
  return (
    <header>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Eyebrow>{copy.header.eyebrow}</Eyebrow>
        {onLanguageChange && <LanguageToggle onChange={onLanguageChange} />}
      </div>
      <h1>
        {onHome ? (
          <a
            href={HOME}
            onClick={onTitleClick}
            className="text-inherit no-underline hover:underline hover:decoration-2 hover:underline-offset-6"
          >
            {copy.header.title}
          </a>
        ) : (
          copy.header.title
        )}
      </h1>
      <p className="mt-2.5 max-w-[62ch] text-muted">{intro}</p>
    </header>
  )
}
