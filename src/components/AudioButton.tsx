import { Button } from './Button.tsx'
import { useLanguage } from './languageContext.ts'

/** Plays a sentence's recording. Shown only once the card is answered. */
export function AudioButton({ file, label }: { file: string; label: string }) {
  const { code } = useLanguage()
  const play = () => {
    const src = `${import.meta.env.BASE_URL}audio/${code}/${file}`
    // A missing or blocked file must not break the card.
    void new Audio(src).play().catch(() => {})
  }
  return (
    <Button variant="ghost" size="sm" aria-label={label} onClick={play}>
      <span aria-hidden="true">♪</span>
    </Button>
  )
}
