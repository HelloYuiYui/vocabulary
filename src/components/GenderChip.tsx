import type { Gender } from '../domain/types.ts'
import { cx } from './cx.ts'
import { useCopy } from './languageContext.ts'

export function GenderChip({ gender }: { gender: Gender }) {
  const label = useCopy().gender[gender]
  return (
    <span
      title={label.long}
      className={cx(
        'ml-1.5 inline-block rounded-full border-[1.5px] border-current px-[7px] py-[3px] align-[0.2em] font-body text-[0.7rem] leading-none font-bold tracking-[0.06em] uppercase',
        gender === 'm' ? 'text-masc' : 'text-fem',
      )}
    >
      {label.short}
    </span>
  )
}
