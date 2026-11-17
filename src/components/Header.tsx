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
  /** Links to the settings page; left out during a sitting and on it. */
  settings?: { label: string; href: string; onOpen: () => void }
  intro: string
}

// A plain click stays in the app; a modified one (new tab) is the browser's.
const inApp = (go: () => void) => (event: MouseEvent) => {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return
  event.preventDefault()
  go()
}

const LINK =
  'text-inherit no-underline hover:underline hover:decoration-2 hover:underline-offset-6'

export function Header({
  onLanguageChange,
  onHome,
  settings,
  intro,
}: HeaderProps) {
  const copy = useCopy()
  return (
    <header>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Eyebrow>{copy.header.eyebrow}</Eyebrow>
        <div className="flex flex-wrap items-center gap-4">
          {settings && (
            <a
              href={settings.href}
              onClick={inApp(settings.onOpen)}
              className="text-[0.9rem] text-muted underline decoration-1 underline-offset-4 hover:text-text"
            >
              {settings.label}
            </a>
          )}
          {onLanguageChange && <LanguageToggle onChange={onLanguageChange} />}
        </div>
      </div>
      <h1>
        {onHome ? (
          <a href={HOME} onClick={inApp(onHome)} className={LINK}>
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
