import { useEffect, useSyncExternalStore } from 'react'

/**
 * The browser's history, as the URL's hash. Each page of the app has its own
 * entry, so the Back and Forward buttons move between pages like on any site.
 *
 * Every entry remembers the hash just behind it. Going to that hash steps
 * back instead of stacking a copy, so the path never piles up behind itself.
 */

interface EntryState {
  back?: string // the hash of the entry just behind this one
}

/** Keeps the page when the browser goes back; returns whether it did. */
type Guard = () => boolean

interface Options {
  replace?: boolean
}

let shown = '' // the hash on screen; ahead of the URL while a step back runs
const listeners = new Set<() => void>()
let guard: Guard | undefined
let listening = false
// A step back the browser has not finished: where it lands, and the move
// asked for meanwhile, made once it has landed.
let stepping: string | undefined
let queued: (() => void) | undefined

const entryState = (): EntryState => (history.state as EntryState | null) ?? {}

function show(hash: string) {
  shown = hash
  for (const listener of listeners) listener()
}

function onPopState() {
  if (stepping !== undefined) {
    const landed = location.hash === stepping
    const next = queued
    stepping = undefined
    queued = undefined
    if (landed) {
      next?.()
      return
    }
  }
  const left = shown
  if (location.hash === left) return
  if (guard?.()) {
    // Put the page that was left back on top, as it was.
    history.pushState({ back: location.hash } satisfies EntryState, '', left)
    return
  }
  show(location.hash)
}

function subscribe(listener: () => void) {
  // Never removed, so a step back still lands while the page remounts.
  if (!listening) window.addEventListener('popstate', onPopState)
  listening = true
  if (listeners.size === 0 && stepping === undefined) shown = location.hash
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const snapshot = () =>
  listeners.size === 0 && stepping === undefined ? location.hash : shown

/** The hash of the page on screen. */
export function useHash(): string {
  return useSyncExternalStore(subscribe, snapshot)
}

/**
 * Moves to another page. A new entry by default; with `replace`, this page's
 * entry becomes the new one (a page that should not be come back to).
 */
export function go(hash: string, options: Options = {}) {
  if (stepping !== undefined) {
    // The browser is still stepping back: show the page now, move after.
    queued = hash === stepping ? undefined : () => move(hash, options)
    show(hash)
    return
  }
  if (hash !== snapshot()) move(hash, options)
}

function move(hash: string, { replace = false }: Options) {
  const state = entryState()
  if (state.back === hash) {
    stepping = hash
    show(hash)
    history.back()
    return
  }
  if (replace) history.replaceState(state, '', hash)
  else history.pushState({ back: location.hash } satisfies EntryState, '', hash)
  show(hash)
}

/**
 * While active, keeps the page when the browser goes back and calls
 * `onBlocked` (to ask the learner), and has the browser confirm before the
 * tab closes or reloads.
 */
export function useLeaveGuard(active: boolean, onBlocked: () => void) {
  useEffect(() => {
    if (!active) return
    const keep: Guard = () => {
      onBlocked()
      return true
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault()
    guard = keep
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      if (guard === keep) guard = undefined
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [active, onBlocked])
}
