import { useId, useRef } from 'react'
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
  hand?: string // the handwriting in use, when the language offers a choice
  onHand: (id: string) => void
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
  hand,
  onHand,
  onRestore,
  onBack,
}: SettingsViewProps) {
  const { settings } = copy
  const switchId = useId()
  const helpId = useId()
  const asideId = useId()
  const asideHeading = useRef<HTMLHeadingElement>(null)
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

        {settings.hand && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 font-bold text-text">
              {settings.hand.label}
            </legend>
            {settings.hand.options.map((option) => (
              <label
                key={option.id}
                className="grid cursor-pointer grid-cols-[auto_1fr] items-center gap-x-3"
              >
                <input
                  type="radio"
                  name={`${switchId}-hand`}
                  value={option.id}
                  checked={hand === option.id}
                  onChange={() => onHand(option.id)}
                  className="size-5 shrink-0 accent-ink"
                />
                <span className="text-text">{option.name}</span>
                {/* The sample sets its own font, whatever the page's is. It
                    is only to look at, so the radio is named by the option. */}
                <span
                  aria-hidden
                  data-hand={option.id}
                  className="col-start-2 font-hand text-[1.35rem] leading-[1.4] text-ink"
                >
                  {settings.hand?.sample}
                </span>
              </label>
            ))}
          </fieldset>
        )}

        <section aria-labelledby={asideId} className="flex flex-col gap-3">
          {/* Focus comes here after "remettre", whose button is then gone. */}
          <h3 id={asideId} ref={asideHeading} tabIndex={-1}>
            {settings.setAsideTitle}
          </h3>
          {groups.length === 0 ? (
            <p className="max-w-[62ch] text-muted">{settings.setAsideEmpty}</p>
          ) : (
            groups.map(({ theme, items }) => (
              <div key={theme.id} className="flex flex-col">
                <h4 className="text-[0.9rem] font-normal text-muted">
                  {theme.name}
                </h4>
                <ul>
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="grid grid-cols-[1fr_1fr_auto] items-center gap-3 border-b border-dashed border-rule-strong py-[7px] max-[520px]:grid-cols-[1fr_auto]"
                    >
                      <span id={`${asideId}-${theme.id}-${item.id}`}>
                        {item.en}
                      </span>
                      <span className="font-hand text-[1.15rem] text-ink max-[520px]:order-3 max-[520px]:col-span-2">
                        <AnswerText answer={item.answers[0]} />
                      </span>
                      <Button
                        variant="ghost"
                        size="xs"
                        aria-describedby={`${asideId}-${theme.id}-${item.id}`}
                        onClick={() => {
                          if (!item.id) return
                          onRestore(theme.id, item.id)
                          asideHeading.current?.focus()
                        }}
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
