import { useEffect, useState } from 'react'
import type { Language } from '../data/types.ts'
import { loadStored, saveStored } from './storage.ts'

/** A language's saved progress and mode, written back on every change. */
export function usePersistentState({ themes, storage }: Language) {
  const [stored, setStored] = useState(() => loadStored(themes, storage))
  useEffect(() => saveStored(stored, storage), [stored, storage])
  return [stored, setStored] as const
}
