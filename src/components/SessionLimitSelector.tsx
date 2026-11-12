import { useCopy } from './languageContext.ts'
import { SegmentedControl } from './SegmentedControl.tsx'

type SessionLimit = number | null

interface SessionLimitSelectorProps {
  limit: SessionLimit
  onChange: (limit: SessionLimit) => void
}

export function SessionLimitSelector({
  limit,
  onChange,
}: SessionLimitSelectorProps) {
  const { sessionLimit: labels } = useCopy().home
  return (
    <SegmentedControl<SessionLimit>
      label={labels.label}
      options={[
        { value: 15, label: '15' },
        { value: 30, label: '30' },
        { value: 50, label: '50' },
        { value: null, label: labels.all },
      ]}
      value={limit}
      onChange={onChange}
    />
  )
}
