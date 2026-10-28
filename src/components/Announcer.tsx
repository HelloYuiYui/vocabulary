/** Reads a message out to screen readers without showing it. */
export function Announcer({ message }: { message: string }) {
  return (
    <p aria-live="polite" className="sr-only">
      {message}
    </p>
  )
}
