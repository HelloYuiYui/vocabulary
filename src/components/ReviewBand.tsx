import { Actions } from './Actions.tsx'
import { Button } from './Button.tsx'
import { useCopy } from './languageContext.ts'

interface ReviewBandProps {
  count: number
  onStart: () => void
  onClear: () => void
}

export function ReviewBand({ count, onStart, onClear }: ReviewBandProps) {
  const copy = useCopy()
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border-[1.5px] border-dashed border-pen bg-sheet p-4">
      <p>
        {copy.review.summary(
          <strong className="text-pen">{count}</strong>,
          count,
        )}
      </p>
      <Actions>
        <Button variant="primary" onClick={onStart}>
          {copy.review.start}
        </Button>
        <Button variant="ghost" onClick={onClear}>
          {copy.review.clear}
        </Button>
      </Actions>
    </div>
  )
}
