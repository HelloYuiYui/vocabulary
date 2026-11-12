export interface Segment<T> {
  value: T
  label: string
}

interface SegmentedControlProps<T> {
  label: string // accessible name of the group
  options: Segment<T>[]
  value: T
  onChange: (value: T) => void
}

/** A row of joined toggle buttons, exactly one of which is pressed. */
export function SegmentedControl<T>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex overflow-hidden rounded-lg border-[1.5px] border-ink"
    >
      {options.map((opt) => (
        <button
          key={opt.label}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className="cursor-pointer px-3.5 py-2 font-bold text-ink hover:brightness-108 aria-pressed:bg-ink aria-pressed:text-sheet"
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
