import { matchesFilter } from '../domain/session.ts'
import type { ItemFilter, Mode, Theme } from '../domain/types.ts'
import type { StoredV2 } from '../storage/storage.ts'
import { Actions } from './Actions.tsx'
import { Button } from './Button.tsx'
import { ItemFilterToggle } from './ItemFilterToggle.tsx'
import { ModeToggle } from './ModeToggle.tsx'
import { ReviewBand } from './ReviewBand.tsx'
import { SessionLimitSelector } from './SessionLimitSelector.tsx'
import { ThemeGrid } from './ThemeGrid.tsx'
import { useCopy } from './languageContext.ts'

interface HomeViewProps {
  themes: Theme[]
  stored: StoredV2
  selected: ReadonlySet<string>
  onToggleTheme: (themeId: string, selected: boolean) => void
  onModeChange: (mode: Mode) => void
  onSessionLimitChange: (limit: number | null) => void
  onItemFilterChange: (filter: ItemFilter) => void
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
  onSessionLimitChange,
  onItemFilterChange,
  onStart,
  onReview,
  onClearReview,
}: HomeViewProps) {
  const copy = useCopy()
  const chosen = themes.filter((t) => selected.has(t.id))
  const questions = chosen.reduce(
    (sum, t) =>
      sum +
      t.items.filter((item) => matchesFilter(item, stored.itemFilter)).length,
    0,
  )
  const sessionSize =
    stored.sessionLimit === null
      ? questions
      : Math.min(stored.sessionLimit, questions)
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
        <h2>{copy.home.chooseThemes}</h2>
        <Actions>
          <ModeToggle mode={stored.mode} onChange={onModeChange} />
          <ItemFilterToggle
            filter={stored.itemFilter}
            onChange={onItemFilterChange}
          />
          <SessionLimitSelector
            limit={stored.sessionLimit}
            onChange={onSessionLimitChange}
          />
          <span className="text-[0.95rem] text-muted">
            {chosen.length
              ? copy.home.selection(
                  chosen.length,
                  sessionSize,
                  questions > sessionSize ? questions : undefined,
                )
              : copy.home.noTheme}
          </span>
          <Button
            variant="primary"
            disabled={questions === 0}
            onClick={() => onStart(chosen)}
          >
            {copy.home.start}
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
