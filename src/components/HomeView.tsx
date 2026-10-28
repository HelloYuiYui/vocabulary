import type { Mode, Theme } from '../domain/types.ts'
import type { StoredV2 } from '../storage/storage.ts'
import { Actions } from './Actions.tsx'
import { Button } from './Button.tsx'
import { ModeToggle } from './ModeToggle.tsx'
import { ReviewBand } from './ReviewBand.tsx'
import { ThemeGrid } from './ThemeGrid.tsx'

interface HomeViewProps {
  themes: Theme[]
  stored: StoredV2
  selected: ReadonlySet<string>
  onToggleTheme: (themeId: string, selected: boolean) => void
  onModeChange: (mode: Mode) => void
  onStart: (themes: Theme[]) => void
  onReview: () => void
  onClearReview: () => void
}

export function HomeView({
  themes,
  stored,
  selected,
  onToggleTheme,
  onModeChange,
  onStart,
  onReview,
  onClearReview,
}: HomeViewProps) {
  const chosen = themes.filter((t) => selected.has(t.id))
  const questions = chosen.reduce((sum, t) => sum + t.items.length, 0)
  return (
    <section className="flex flex-col gap-5">
      {stored.review.length > 0 && (
        <ReviewBand
          count={stored.review.length}
          onStart={onReview}
          onClear={onClearReview}
        />
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2>Choisis tes thèmes</h2>
        <Actions>
          <ModeToggle mode={stored.mode} onChange={onModeChange} />
          <span className="text-[0.95rem] text-muted">
            {chosen.length
              ? `${chosen.length} thème${chosen.length > 1 ? 's' : ''} · ${questions} questions`
              : 'Aucun thème choisi'}
          </span>
          <Button
            variant="primary"
            disabled={chosen.length === 0}
            onClick={() => onStart(chosen)}
          >
            Commencer
          </Button>
        </Actions>
      </div>
      <ThemeGrid
        themes={themes}
        scores={stored.scores}
        selected={selected}
        onToggle={onToggleTheme}
      />
    </section>
  )
}
