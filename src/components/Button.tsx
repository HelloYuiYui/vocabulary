import type { ComponentProps } from 'react'
import { cx } from './cx.ts'

type Variant = 'default' | 'primary' | 'ghost'

const VARIANTS: Record<Variant, string> = {
  default: 'border-ink font-bold text-ink',
  primary: 'border-ink bg-ink font-bold text-sheet',
  ghost:
    'border-transparent font-normal text-muted underline underline-offset-3',
}

// md is the default; sm sits in a theme card's meta line, xs in a verdict.
type Size = 'md' | 'sm' | 'xs'

interface ButtonProps extends ComponentProps<'button'> {
  variant?: Variant
  size?: Size
}

export function Button({
  variant = 'default',
  size = 'md',
  type = 'button',
  className,
  ...props
}: ButtonProps) {
  const padding =
    size === 'xs'
      ? 'px-1 py-0'
      : size === 'sm'
        ? 'px-1 py-0.5'
        : variant === 'ghost'
          ? 'px-2 py-2.5'
          : 'px-4 py-2.5'
  return (
    <button
      type={type}
      className={cx(
        'cursor-pointer rounded-lg border-[1.5px] hover:brightness-108 disabled:cursor-default disabled:opacity-40',
        VARIANTS[variant],
        padding,
        className,
      )}
      {...props}
    />
  )
}
