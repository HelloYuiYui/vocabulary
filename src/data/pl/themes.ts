import type { Theme } from '../../domain/types.ts'
import { liczby } from './a1/liczby.ts'
import { opis } from './a1/opis.ts'
import { przedstawianie } from './a1/przedstawianie.ts'
import { rodzina } from './a1/rodzina.ts'

/** Every theme, in the same order as the French ones. */
export const THEMES: Theme[] = [przedstawianie, rodzina, liczby, opis]
