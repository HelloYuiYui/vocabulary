import { matchesFilter } from '../domain/session.ts'
import type { ItemFilter, Mode, Theme } from '../domain/types.ts'
import type { ReactNode } from 'react'
import type { StoredV2 } from '../storage/storage.ts'
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
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2>{copy.home.chooseThemes}</h2>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[0.9rem] text-muted">
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
          </div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Setting label={copy.home.mode.label}>
            <ModeToggle mode={stored.mode} onChange={onModeChange} />
          </Setting>
          <Setting label={copy.home.itemFilter.label}>
            <ItemFilterToggle
              filter={stored.itemFilter}
              onChange={onItemFilterChange}
            />
          </Setting>
          <Setting label={copy.home.sessionLimit.label}>
            <SessionLimitSelector
              limit={stored.sessionLimit}
              onChange={onSessionLimitChange}
            />
          </Setting>
        </div>
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

/** One setting: a small caption beside its control. */
function Setting({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span aria-hidden="true" className="text-[0.82rem] text-muted">
        {label}
      </span>
      {children}
    </div>
  )
}
