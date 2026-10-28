type SessionLimit = number | null

const OPTIONS: { value: SessionLimit; label: string }[] = [
  { value: 15, label: '15' },
  { value: 30, label: '30' },
  { value: 50, label: '50' },
  { value: null, label: 'Tout' },
]

interface SessionLimitSelectorProps {
  limit: SessionLimit
  onChange: (limit: SessionLimit) => void
}

export function SessionLimitSelector({
  limit,
  onChange,
}: SessionLimitSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Limite de session"
      className="inline-flex overflow-hidden rounded-lg border-[1.5px] border-ink"
    >
      {OPTIONS.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          aria-pressed={limit === opt.value}
          onClick={() => onChange(opt.value)}
          className="cursor-pointer px-3.5 py-2 font-bold text-ink hover:brightness-108 aria-pressed:bg-ink aria-pressed:text-sheet"
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
