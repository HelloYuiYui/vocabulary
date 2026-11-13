import type { PathCopy } from '../data/types.ts'
import {
  isSubDone,
  themeStatuses,
  type PathProgress,
  type ThemeStatus,
} from '../domain/path.ts'
import type { Level, SubTheme, Theme } from '../domain/types.ts'
import { Actions } from './Actions.tsx'
import { Button } from './Button.tsx'
import { cx } from './cx.ts'

interface PathViewProps {
  themes: Theme[] // the path's themes, in order
  progress: PathProgress
  dueCount: number
  copy: PathCopy
  showLegacy: boolean
  onReview: () => void
  onSubTheme: (theme: Theme, sub: SubTheme) => void
  onQuiz: (theme: Theme) => void
  onNote: (theme: Theme) => void
  onLegacy: () => void
}

interface Step {
  theme: Theme
  status: ThemeStatus
  number: number
}

/** Steps grouped by level, in the order each level first appears. */
function byLevel(steps: Step[]): [Level, Step[]][] {
  const groups = new Map<Level, Step[]>()
  for (const step of steps) {
    const group = groups.get(step.theme.level)
    if (group) group.push(step)
    else groups.set(step.theme.level, [step])
  }
  return [...groups]
}

/** The home page of a language on the path: its themes, one after another. */
export function PathView({
  themes,
  progress,
  dueCount,
  copy,
  showLegacy,
  onReview,
  onSubTheme,
  onQuiz,
  onNote,
  onLegacy,
}: PathViewProps) {
  const statuses = themeStatuses(themes, progress)
  const steps = themes.map((theme, i) => ({
    theme,
    status: statuses[i] ?? 'locked',
    number: i + 1,
  }))
  return (
    <div className="flex flex-col gap-7">
      {dueCount > 0 && (
        <Actions>
          <Button variant="primary" onClick={onReview}>
            {copy.review(dueCount)}
          </Button>
        </Actions>
      )}
      {byLevel(steps).map(([level, group]) => (
        <div key={level} className="flex flex-col gap-3.5">
          <div className="flex items-center gap-3">
            <h2 className="rounded-md bg-ink px-2.5 py-0.5 text-[1.05rem] tracking-[0.08em] text-sheet">
              {level}
            </h2>
            <span className="h-0 flex-1 border-t-2 border-ink" />
          </div>
          <ol className="flex flex-col">
            {group.map(({ theme, status, number }) => (
              <li key={theme.id} className="flex gap-3">
                <div className="flex flex-none flex-col items-center">
                  <span
                    aria-hidden="true"
                    className={cx(
                      'flex size-7 flex-none items-center justify-center rounded-full border-2 border-ink text-[0.8rem] font-bold tabular-nums',
                      status === 'done' ? 'bg-ink text-sheet' : 'text-ink',
                      status === 'locked' && 'opacity-50',
                    )}
                  >
                    {status === 'done' ? '✓' : number}
                  </span>
                  <span className="w-0.5 flex-1 bg-rule-strong" />
                </div>
                <section
                  aria-label={theme.name}
                  className={cx(
                    'mb-3.5 flex min-w-0 flex-1 flex-col gap-2.5 rounded-[10px] border-[1.5px] bg-sheet p-4',
                    status === 'open' ? 'border-ink' : 'border-line',
                    status === 'locked' && 'opacity-60',
                  )}
                >
                  <div>
                    <h3>{theme.name}</h3>
                    <p className="text-[0.92rem] text-muted">{theme.desc}</p>
                  </div>
                  {status === 'locked' ? (
                    <p className="text-[0.85rem] text-muted">{copy.locked}</p>
                  ) : (
                    <>
                      <ul className="flex flex-wrap gap-2">
                        {(theme.subThemes ?? []).map((sub) => {
                          const done = isSubDone(progress, theme.id, sub.id)
                          return (
                            <li key={sub.id}>
                              {/* A finished sub-theme turns green; it can still be redone. */}
                              <button
                                type="button"
                                data-done={done || undefined}
                                onClick={() => onSubTheme(theme, sub)}
                                className={cx(
                                  'flex cursor-pointer flex-col items-start rounded-lg border-[1.5px] px-4 py-2.5 text-left font-bold hover:brightness-108',
                                  done
                                    ? 'border-ok text-ok'
                                    : 'border-ink text-ink',
                                )}
                              >
                                <span>{sub.name}</span>
                                <span
                                  className={cx(
                                    'text-[0.8rem] font-normal',
                                    !done && 'text-muted',
                                  )}
                                >
                                  {copy.cards(sub.items.length)}
                                  {done && ` · ${copy.subThemeDone}`}
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                      {(theme.note || status === 'open') && (
                        <Actions className="text-[0.85rem]">
                          {theme.note && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onNote(theme)}
                            >
                              {copy.note}
                            </Button>
                          )}
                          {status === 'open' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onQuiz(theme)}
                            >
                              {copy.quiz}
                            </Button>
                          )}
                        </Actions>
                      )}
                      {status === 'open' && (
                        <p className="text-[0.8rem] text-muted">
                          {copy.quizHelp}
                        </p>
                      )}
                    </>
                  )}
                </section>
              </li>
            ))}
          </ol>
        </div>
      ))}
      {showLegacy && (
        <Actions>
          <Button variant="ghost" onClick={onLegacy}>
            {copy.legacy}
          </Button>
        </Actions>
      )}
    </div>
  )
}
