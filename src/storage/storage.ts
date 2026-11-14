/*
 * Settings shared by every language. Each language's progress on the path is
 * kept by pathStorage.ts under its own key.
 *
 * Earlier versions kept the old theme picker's progress under
 * cahier-vocab-v1, cahier-vocab-v2, cahier-vocab-bg-v2 and cahier-vocab-pl-v2.
 * The app no longer reads those entries and never deletes them.
 */

// Storage can be missing or blocked, so every access is guarded.
function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? undefined : (JSON.parse(raw) as unknown)
  } catch {
    return undefined
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // The app works without storage; the choice just isn't kept.
  }
}

/** The code of the language last chosen, shared by every language. */
export const LANGUAGE_KEY = 'cahier-vocab-language'

export function loadLanguageCode(): string | undefined {
  const code = read(LANGUAGE_KEY)
  return typeof code === 'string' ? code : undefined
}

export const saveLanguageCode = (code: string): void =>
  write(LANGUAGE_KEY, code)
