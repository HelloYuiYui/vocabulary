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
      className="inline-flex max-w-full gap-0.5 rounded-[7px] bg-line/60 p-0.5"
    >
      {options.map((opt) => (
        <button
          key={opt.label}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className="cursor-pointer rounded-[5px] px-2.5 py-0.5 text-[0.82rem] text-muted hover:text-ink aria-pressed:bg-sheet aria-pressed:font-bold aria-pressed:text-ink aria-pressed:shadow-sm"
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
