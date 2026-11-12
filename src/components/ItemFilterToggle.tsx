import type { ItemFilter } from '../domain/types.ts'
import { useCopy } from './languageContext.ts'
import { SegmentedControl } from './SegmentedControl.tsx'

interface ItemFilterToggleProps {
  filter: ItemFilter
  onChange: (filter: ItemFilter) => void
}

export function ItemFilterToggle({ filter, onChange }: ItemFilterToggleProps) {
  const { itemFilter: labels } = useCopy().home
  return (
    <SegmentedControl
      label={labels.label}
      options={[
        { value: 'word', label: labels.word },
        { value: 'sentence', label: labels.sentence },
        { value: 'all', label: labels.all },
      ]}
      value={filter}
      onChange={onChange}
    />
  )
}
