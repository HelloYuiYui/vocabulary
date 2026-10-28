import type { ReactNode } from 'react'
import { cx } from './cx.ts'

/** A wrapping row of buttons. */
export function Actions({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cx('flex flex-wrap items-center gap-2.5', className)}>
      {children}
    </div>
  )
}
