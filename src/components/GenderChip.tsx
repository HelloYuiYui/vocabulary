import type { Gender } from '../domain/types.ts'
import { cx } from './cx.ts'
import { GENDER_LABELS } from './genderLabels.ts'

export function GenderChip({ gender }: { gender: Gender }) {
  return (
    <span
      title={GENDER_LABELS[gender].long}
      className={cx(
        'ml-1.5 inline-block rounded-full border-[1.5px] border-current px-[7px] py-[3px] align-[0.2em] font-body text-[0.7rem] leading-none font-bold tracking-[0.06em] uppercase',
        gender === 'm' ? 'text-masc' : 'text-fem',
      )}
    >
      {GENDER_LABELS[gender].short}
    </span>
  )
}
