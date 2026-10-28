import type { ReactNode } from 'react'

/** A notebook page with the red margin line. */
export function Notebook({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex flex-col gap-[18px] rounded-md border border-rule-strong bg-sheet py-8 pr-6 pl-[76px] max-[480px]:pr-4 max-[480px]:pl-[42px]">
      <span
        aria-hidden
        className="absolute inset-y-0 left-[54px] w-0.5 bg-pen max-[480px]:left-[26px]"
      />
      {children}
    </div>
  )
}
