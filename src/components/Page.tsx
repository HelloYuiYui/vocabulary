import type { ReactNode } from 'react'

/** The column every page sits in, clear of the notch on a phone. */
export function Page({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-[920px] flex-col gap-8 pt-10 pr-[max(16px,env(safe-area-inset-right,0px))] pb-16 pl-[max(16px,env(safe-area-inset-left,0px))]">
      {children}
    </div>
  )
}
