import type { Ref } from 'react'
import { hidesGender } from '../domain/normalise.ts'
import type { Draft } from '../domain/session.ts'
import { cx } from './cx.ts'
import { GenderPicker } from './GenderPicker.tsx'

interface AnswerFieldProps {
  id: string
  draft: Draft
  onChange: (draft: Draft) => void
  disabled?: boolean
  large?: boolean
  placeholder: string
  autoFocus?: boolean
  ref?: Ref<HTMLInputElement>
}

/** The handwritten answer line, with the gender picker when l' or les hides it. */
export function AnswerField({
  id,
  draft,
  onChange,
  disabled,
  large,
  placeholder,
  autoFocus,
  ref,
}: AnswerFieldProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <input
        ref={ref}
        id={id}
        type="text"
        value={draft.input}
        onChange={(e) => onChange({ ...draft, input: e.target.value })}
        disabled={disabled}
        placeholder={placeholder}
        autoFocus={autoFocus}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        className={cx(
          'min-w-0 flex-[1_1_220px] rounded-none border-0 border-b-2 border-ink bg-transparent p-0.5 font-hand leading-[normal] text-ink placeholder:text-muted placeholder:opacity-60',
          large ? 'text-[1.6rem]' : 'text-[1.3rem]',
        )}
      />
      {hidesGender(draft.input) && (
        <GenderPicker
          name={`${id}-gender`}
          value={draft.gender}
          onChange={(gender) => onChange({ ...draft, gender })}
          disabled={disabled}
        />
      )}
    </div>
  )
}
