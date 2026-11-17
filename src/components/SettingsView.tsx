import { useId } from 'react'
import type { PathCopy } from '../data/types.ts'
import { cardKey, type PathProgress } from '../domain/path.ts'
import type { Theme } from '../domain/types.ts'
import { Actions } from './Actions.tsx'
import { AnswerText } from './AnswerText.tsx'
import { Button } from './Button.tsx'
import { Notebook } from './Notebook.tsx'

interface SettingsViewProps {
  themes: Theme[] // the path's themes, in order
  progress: PathProgress
  copy: PathCopy
  onOpenPath: (open: boolean) => void
  /** Puts a card set aside back. */
  onRestore: (themeId: string, itemId: string) => void
  onBack: () => void
}

/** A language's settings: the open path, and the cards set aside. */
export function SettingsView({
  themes,
  progress,
  copy,
  onOpenPath,
  onRestore,
  onBack,
}: SettingsViewProps) {
  const { settings } = copy
  const switchId = useId()
  const helpId = useId()
  const asideId = useId()
  const aside = new Set(progress.skipped)
  const groups = themes.flatMap((theme) => {
    const items = theme.items.filter(
      (item) => item.id && aside.has(cardKey(theme.id, item.id)),
    )
    return items.length > 0 ? [{ theme, items }] : []
  })

  return (
    <section>
      <Notebook>
        <h2>{settings.title}</h2>

        <div className="flex items-start gap-3">
          <input
            id={switchId}
            type="checkbox"
            aria-describedby={helpId}
            checked={progress.openPath}
            onChange={(e) => onOpenPath(e.target.checked)}
            className="mt-1 size-5 shrink-0 accent-ink"
          />
          <div className="flex flex-col gap-1">
            <label htmlFor={switchId} className="font-bold text-text">
              {settings.openPath.label}
            </label>
            <p id={helpId} className="max-w-[62ch] text-[0.95rem] text-muted">
              {settings.openPath.help}
            </p>
          </div>
        </div>

        <section aria-labelledby={asideId} className="flex flex-col gap-3">
          <h3 id={asideId}>{settings.setAsideTitle}</h3>
          {groups.length === 0 ? (
            <p className="max-w-[62ch] text-muted">{settings.setAsideEmpty}</p>
          ) : (
            groups.map(({ theme, items }) => (
              <div key={theme.id} className="flex flex-col">
                <p className="text-[0.9rem] text-muted">{theme.name}</p>
                <ul>
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="grid grid-cols-[1fr_1fr_auto] items-center gap-3 border-b border-dashed border-rule-strong py-[7px] max-[520px]:grid-cols-[1fr_auto]"
                    >
                      <span>{item.en}</span>
                      <span className="font-hand text-[1.15rem] text-ink max-[520px]:order-3 max-[520px]:col-span-2">
                        <AnswerText answer={item.answers[0]} />
                      </span>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => item.id && onRestore(theme.id, item.id)}
                      >
                        {settings.restore}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>

        <Actions>
          <Button variant="primary" onClick={onBack}>
            {copy.backToPath}
          </Button>
        </Actions>
      </Notebook>
    </section>
  )
}
