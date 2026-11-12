import type { Level, Score, Theme } from '../domain/types.ts'
import { ThemeCard } from './ThemeCard.tsx'

interface ThemeGridProps {
  themes: Theme[]
  scores: Record<string, Score>
  selected: ReadonlySet<string>
  onToggle: (themeId: string, selected: boolean) => void
}

/** Themes grouped by level, in the order each level first appears. */
function byLevel(themes: Theme[]): [Level, Theme[]][] {
  const groups = new Map<Level, Theme[]>()
  for (const theme of themes) {
    const group = groups.get(theme.level)
    if (group) group.push(theme)
    else groups.set(theme.level, [theme])
  }
  return [...groups]
}

export function ThemeGrid({
  themes,
  scores,
  selected,
  onToggle,
}: ThemeGridProps) {
  return (
    <div className="flex flex-col gap-9">
      {byLevel(themes).map(([level, group]) => (
        <section
          key={level}
          aria-labelledby={`level-${level}`}
          className="flex flex-col gap-3.5"
        >
          <div className="flex items-center gap-3">
            <h3
              id={`level-${level}`}
              className="rounded-md bg-ink px-2.5 py-0.5 text-[1.05rem] tracking-[0.08em] text-sheet"
            >
              {level}
            </h3>
            <span className="h-0 flex-1 border-t-2 border-ink" />
            <span className="text-[0.85rem] font-bold text-muted tabular-nums">
              {group.length}
            </span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3.5">
            {group.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                score={scores[theme.id]}
                selected={selected.has(theme.id)}
                onToggle={(on) => onToggle(theme.id, on)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
