import type { Ref } from 'react'
import type { Draft, Entry, Response } from '../domain/session.ts'
import { AnswerField } from './AnswerField.tsx'
import { VerdictPanel } from './VerdictPanel.tsx'

interface ListRowProps {
  number: number
  entry: Entry
  draft: Draft
  response: Response | undefined
  onDraft: (draft: Draft) => void
  onCheck: () => void
  onOverride: () => void
  autoFocus: boolean
  inputRef: Ref<HTMLInputElement>
}

export function ListRow({
  number,
  entry: { item },
  draft,
  response,
  onDraft,
  onCheck,
  onOverride,
  autoFocus,
  inputRef,
}: ListRowProps) {
  const id = `row-${number}`
  return (
    <li
      className="grid grid-cols-[2.2em_1fr] gap-2 border-b border-dashed border-rule-strong py-2.5"
      onKeyDown={(e) => {
        if (e.key !== 'Enter' || response) return
        e.preventDefault()
        onCheck()
      }}
    >
      <span className="font-hand text-[1.1rem] text-pen tabular-nums">
        {number}.
      </span>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] items-center gap-x-4 gap-y-1.5 max-[560px]:grid-cols-1">
        <label htmlFor={id} className="font-bold">
          {item.en}
        </label>
        <AnswerField
          id={id}
          ref={inputRef}
          draft={draft}
          onChange={onDraft}
          disabled={response !== undefined}
          placeholder="…"
          autoFocus={autoFocus}
        />
        {response && (
          <div className="col-span-full">
            <VerdictPanel
              result={response.result}
              item={item}
              onOverride={onOverride}
              compact
            />
          </div>
        )}
      </div>
    </li>
  )
}
