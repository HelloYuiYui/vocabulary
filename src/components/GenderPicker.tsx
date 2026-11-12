import type { Gender } from '../domain/types.ts'
import { cx } from './cx.ts'
import { useCopy } from './languageContext.ts'

const GENDERS: Gender[] = ['m', 'f']

interface GenderPickerProps {
  name: string
  value: Gender | null
  onChange: (gender: Gender) => void
  disabled?: boolean
}

export function GenderPicker({
  name,
  value,
  onChange,
  disabled,
}: GenderPickerProps) {
  const copy = useCopy()
  return (
    <span
      role="radiogroup"
      aria-label={copy.gender.label}
      className="inline-flex flex-none overflow-hidden rounded-full border-[1.5px] border-line bg-sheet"
    >
      {GENDERS.map((gender) => (
        <label
          key={gender}
          className={cx(
            'cursor-pointer px-3 py-[5px] text-[0.85rem] font-bold text-muted has-checked:text-sheet has-focus-visible:outline-3 has-focus-visible:-outline-offset-3 has-focus-visible:outline-pen has-disabled:cursor-default',
            gender === 'm' ? 'has-checked:bg-masc' : 'has-checked:bg-fem',
          )}
        >
          <input
            type="radio"
            name={name}
            value={gender}
            checked={value === gender}
            onChange={() => onChange(gender)}
            disabled={disabled}
            className="absolute size-px opacity-0"
          />
          {copy.gender[gender].short}
        </label>
      ))}
    </span>
  )
}
