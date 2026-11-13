import { useEffect, useState } from 'react'
import type { Theme } from '../domain/types.ts'
import { loadPath, savePath } from './pathStorage.ts'

/** A language's progress on the path, written back on every change. */
export function usePathProgress(key: string, themes: Theme[]) {
  const [progress, setProgress] = useState(() => loadPath(key, themes))
  useEffect(() => savePath(key, progress), [key, progress])
  return [progress, setProgress] as const
}
