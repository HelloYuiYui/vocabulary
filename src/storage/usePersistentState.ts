import { useEffect, useState } from 'react'
import { THEMES } from '../data/themes.ts'
import { loadStored, saveStored } from './storage.ts'

/** Saved progress and mode, written back to storage on every change. */
export function usePersistentState() {
  const [stored, setStored] = useState(() => loadStored(THEMES))
  useEffect(() => saveStored(stored), [stored])
  return [stored, setStored] as const
}
