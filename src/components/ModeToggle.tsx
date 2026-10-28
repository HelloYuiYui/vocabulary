import type { Mode } from '../domain/types.ts'

const MODES: { mode: Mode; label: string }[] = [
  { mode: 'cards', label: 'Une par une' },
  { mode: 'list', label: 'Liste' },
]

interface ModeToggleProps {
  mode: Mode
  onChange: (mode: Mode) => void
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div
      role="group"
      aria-label="Mode"
      className="inline-flex overflow-hidden rounded-lg border-[1.5px] border-ink"
    >
      {MODES.map((m) => (
        <button
          key={m.mode}
          type="button"
          aria-pressed={mode === m.mode}
          onClick={() => onChange(m.mode)}
          className="cursor-pointer px-3.5 py-2 font-bold text-ink hover:brightness-108 aria-pressed:bg-ink aria-pressed:text-sheet"
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
