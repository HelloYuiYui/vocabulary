import type { Ref } from 'react'
import type { Gender } from '../domain/types.ts'
import { cx } from './cx.ts'
import { useCopy } from './languageContext.ts'

const GENDERS: Gender[] = ['m', 'f']

interface GenderPickerProps {
  name: string
  value: Gender | null
  onChange: (gender: Gender) => void
  disabled?: boolean
  /** A pick is required and missing: the picker is outlined in red. */
  invalid?: boolean
  /** The first choice, so that focus can be sent to the picker. */
  ref?: Ref<HTMLInputElement>
}

export function GenderPicker({
  name,
  value,
  onChange,
  disabled,
  invalid,
  ref,
}: GenderPickerProps) {
  const copy = useCopy()
  return (
    <span
      role="radiogroup"
      aria-label={copy.gender.label}
      aria-invalid={invalid || undefined}
      className={cx(
        'inline-flex flex-none overflow-hidden rounded-full border-[1.5px] bg-sheet',
        invalid ? 'border-pen ring-2 ring-pen' : 'border-line',
      )}
    >
      {GENDERS.map((gender, i) => (
        <label
          key={gender}
          className={cx(
            'cursor-pointer px-3 py-[5px] text-[0.85rem] font-bold text-muted has-checked:text-sheet has-focus-visible:outline-3 has-focus-visible:-outline-offset-3 has-focus-visible:outline-pen has-disabled:cursor-default',
            gender === 'm' ? 'has-checked:bg-masc' : 'has-checked:bg-fem',
          )}
        >
          <input
            ref={i === 0 ? ref : undefined}
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
