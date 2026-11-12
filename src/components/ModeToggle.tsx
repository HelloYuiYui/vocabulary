import type { Mode } from '../domain/types.ts'
import { useCopy } from './languageContext.ts'
import { SegmentedControl } from './SegmentedControl.tsx'

interface ModeToggleProps {
  mode: Mode
  onChange: (mode: Mode) => void
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const { mode: labels } = useCopy().home
  return (
    <SegmentedControl
      label={labels.label}
      options={[
        { value: 'cards', label: labels.cards },
        { value: 'list', label: labels.list },
      ]}
      value={mode}
      onChange={onChange}
    />
  )
}
