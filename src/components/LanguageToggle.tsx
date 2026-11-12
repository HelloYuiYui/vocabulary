import { LANGUAGES } from '../data/language.ts'
import type { Language } from '../data/types.ts'
import { useLanguage } from './languageContext.ts'
import { SegmentedControl } from './SegmentedControl.tsx'

interface LanguageToggleProps {
  onChange: (language: Language) => void
}

export function LanguageToggle({ onChange }: LanguageToggleProps) {
  const language = useLanguage()
  return (
    <SegmentedControl
      label={language.copy.languageLabel}
      options={LANGUAGES.map((l) => ({ value: l, label: l.name }))}
      value={language}
      onChange={onChange}
    />
  )
}
