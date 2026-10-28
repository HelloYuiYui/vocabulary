import { Actions } from './Actions.tsx'
import { Button } from './Button.tsx'

interface ReviewBandProps {
  count: number
  onStart: () => void
  onClear: () => void
}

export function ReviewBand({ count, onStart, onClear }: ReviewBandProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border-[1.5px] border-dashed border-pen bg-sheet p-4">
      <p>
        Tu as <strong className="text-pen">{count}</strong> mots à revoir de tes
        sessions précédentes.
      </p>
      <Actions>
        <Button variant="primary" onClick={onStart}>
          Réviser ces mots
        </Button>
        <Button variant="ghost" onClick={onClear}>
          Vider la liste
        </Button>
      </Actions>
    </div>
  )
}
