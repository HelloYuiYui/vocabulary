import type { ReactNode } from 'react'

/** The small red capitals above a heading or a page. */
export function Eyebrow({
  children,
  as: Tag = 'p',
}: {
  children: ReactNode
  as?: 'p' | 'span'
}) {
  return (
    <Tag className="text-[0.75rem] font-bold tracking-[0.12em] text-pen uppercase">
      {children}
    </Tag>
  )
}
