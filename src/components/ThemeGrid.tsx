import type { Score, Theme } from '../domain/types.ts'
import { ThemeCard } from './ThemeCard.tsx'

interface ThemeGridProps {
  themes: Theme[]
  scores: Record<string, Score>
  selected: ReadonlySet<string>
  onToggle: (themeId: string, selected: boolean) => void
}

export function ThemeGrid({
  themes,
  scores,
  selected,
  onToggle,
}: ThemeGridProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3.5">
      {themes.map((theme) => (
        <ThemeCard
          key={theme.id}
          theme={theme}
          score={scores[theme.id]}
          selected={selected.has(theme.id)}
          onToggle={(on) => onToggle(theme.id, on)}
        />
      ))}
    </div>
  )
}
