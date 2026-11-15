import { useEffect, useId, useRef } from 'react'
import type { PathCopy } from '../data/types.ts'
import { Actions } from './Actions.tsx'
import { Button } from './Button.tsx'
import { Notebook } from './Notebook.tsx'

interface ConfirmLeaveProps {
  copy: PathCopy
  onStay: () => void
  onLeave: () => void
}

/**
 * Asks before a sitting with answers is left. Staying is the default: it has
 * the focus, and Escape stays too.
 */
export function ConfirmLeave({ copy, onStay, onLeave }: ConfirmLeaveProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog || dialog.open) return
    dialog.showModal()
    return () => dialog.close()
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onStay()
      }}
      className="m-auto w-[min(30rem,calc(100%-32px))] bg-transparent p-0 text-text backdrop:bg-ink/40"
    >
      <Notebook>
        <h2 id={titleId}>{copy.leaveConfirm.title}</h2>
        <p className="max-w-[62ch]">{copy.leaveConfirm.body}</p>
        <Actions>
          <Button variant="primary" autoFocus onClick={onStay}>
            {copy.leaveConfirm.stay}
          </Button>
          <Button onClick={onLeave}>{copy.leave}</Button>
        </Actions>
      </Notebook>
    </dialog>
  )
}
