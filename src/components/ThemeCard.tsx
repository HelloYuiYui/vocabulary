import { useState } from 'react'
import type { Score, Theme } from '../domain/types.ts'
import { Button } from './Button.tsx'
import { FrenchAnswer } from './FrenchAnswer.tsx'

interface ThemeCardProps {
  theme: Theme
  score: Score | undefined
  selected: boolean
  onToggle: (selected: boolean) => void
}

export function ThemeCard({
  theme,
  score,
  selected,
  onToggle,
}: ThemeCardProps) {
  const [open, setOpen] = useState(false)
  const id = `theme-${theme.id}`
  return (
    <article className="flex min-w-0 flex-col gap-2.5 rounded-[10px] border-[1.5px] border-line bg-sheet p-4 has-checked:border-ink has-checked:ring-1 has-checked:ring-ink">
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          id={id}
          checked={selected}
          onChange={(e) => onToggle(e.target.checked)}
          className="mt-0.5 mr-[3px] mb-[3px] ml-1 size-5 flex-none accent-ink"
        />
        <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
          <h3>{theme.name}</h3>
          <p className="text-[0.92rem] text-muted">{theme.desc}</p>
        </label>
        <span className="flex-none rounded border-[1.5px] border-ink px-1.5 py-px text-[0.72rem] font-bold tracking-[0.08em] text-ink">
          {theme.level}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[0.85rem] text-muted">
        <span>
          {theme.items.length} mots et phrases
          {score && ` · dernier score ${score.right}/${score.total}`}
        </span>
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? 'Cacher les mots' : 'Voir les mots'}
        </Button>
      </div>
      {open && (
        <ul className="border-t border-dashed border-line text-[0.9rem]">
          {theme.items.map((item) => (
            <li
              key={item.en}
              className="grid grid-cols-2 gap-2.5 border-b border-dashed border-line py-[5px] max-[520px]:grid-cols-1 max-[520px]:gap-0"
            >
              <span>{item.en}</span>
              <span className="font-hand text-[1.02rem] text-ink">
                <FrenchAnswer answer={item.fr[0]} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
