import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { go, useHash, useLeaveGuard } from './hashHistory.ts'

/** Presses the browser's Back button and waits for the page to settle. */
const pressBack = async () => {
  const before = location.hash
  act(() => history.back())
  await waitFor(() => expect(location.hash).not.toBe(before))
}

describe('hash history', () => {
  it('shows the hash it starts on', () => {
    history.replaceState(null, '', '#/fr')
    const { result } = renderHook(() => useHash())
    expect(result.current).toBe('#/fr')
  })

  it('moves to a new address and back with the browser', async () => {
    history.replaceState(null, '', '#/fr')
    const { result } = renderHook(() => useHash())
    const length = history.length
    act(() => go('#/fr/note/famille'))
    expect(result.current).toBe('#/fr/note/famille')
    expect(location.hash).toBe('#/fr/note/famille')
    expect(history.length).toBe(length + 1)

    await pressBack()
    await waitFor(() => expect(result.current).toBe('#/fr'))
  })

  it('goes back instead of stacking an address that is just behind', async () => {
    history.replaceState(null, '', '#/fr')
    const { result } = renderHook(() => useHash())
    act(() => go('#/fr/sitting'))
    const length = history.length
    act(() => go('#/fr'))
    // Shown at once; the browser catches up a moment later.
    expect(result.current).toBe('#/fr')
    await waitFor(() => expect(location.hash).toBe('#/fr'))
    expect(history.length).toBe(length)
    expect(result.current).toBe('#/fr')
  })

  it('steps back once when asked twice before the browser catches up', async () => {
    history.replaceState(null, '', '#/fr')
    history.pushState({ back: '#/fr' }, '', '#/fr/sitting')
    const length = history.length
    // jsdom folds two queued steps back into one; Chrome takes both.
    const back = vi.spyOn(history, 'back')
    const { result, unmount } = renderHook(() => useHash())
    act(() => go('#/fr', { replace: true }))
    // As in StrictMode: the page is unmounted and mounted again at once.
    unmount()
    const again = renderHook(() => useHash())
    act(() => go('#/fr', { replace: true }))
    expect(result.current).toBe('#/fr')
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(location.hash).toBe('#/fr')
    expect(again.result.current).toBe('#/fr')
    expect(history.length).toBe(length)
    expect(back).toHaveBeenCalledOnce()
    back.mockRestore()
  })

  it('moves on to a new address asked for during a step back', async () => {
    history.replaceState(null, '', '#/fr')
    const { result } = renderHook(() => useHash())
    act(() => go('#/fr/sitting'))
    act(() => {
      go('#/fr')
      go('#/fr/note/famille')
    })
    expect(result.current).toBe('#/fr/note/famille')
    await waitFor(() => expect(location.hash).toBe('#/fr/note/famille'))
    expect(result.current).toBe('#/fr/note/famille')

    // The note stands on the path, not on the sitting that was left.
    await pressBack()
    await waitFor(() => expect(result.current).toBe('#/fr'))
  })

  it('replaces the address when asked, keeping what is behind it', async () => {
    history.replaceState(null, '', '#/fr')
    const { result } = renderHook(() => useHash())
    act(() => go('#/fr/note/famille/membres'))
    const length = history.length
    act(() => go('#/fr/sitting', { replace: true }))
    expect(result.current).toBe('#/fr/sitting')
    expect(history.length).toBe(length)

    // The path is still just behind, so going there is a step back.
    act(() => go('#/fr'))
    await waitFor(() => expect(location.hash).toBe('#/fr'))
    expect(history.length).toBe(length)
  })

  it('lets a guard keep the page when the browser goes back', async () => {
    history.replaceState(null, '', '#/fr')
    const onBlocked = vi.fn()
    const { result, rerender } = renderHook(
      ({ active }) => {
        useLeaveGuard(active, onBlocked)
        return useHash()
      },
      { initialProps: { active: false } },
    )
    act(() => go('#/fr/sitting'))
    rerender({ active: true })

    act(() => history.back())
    await waitFor(() => expect(onBlocked).toHaveBeenCalledOnce())
    expect(result.current).toBe('#/fr/sitting')
    expect(location.hash).toBe('#/fr/sitting')

    // Once the learner agrees to leave, the path is just behind again.
    const length = history.length
    act(() => go('#/fr'))
    await waitFor(() => expect(location.hash).toBe('#/fr'))
    expect(history.length).toBe(length)
    expect(onBlocked).toHaveBeenCalledOnce()
  })

  it('lets the browser go back when the guard is off', async () => {
    history.replaceState(null, '', '#/fr')
    const onBlocked = vi.fn()
    const { result } = renderHook(() => {
      useLeaveGuard(false, onBlocked)
      return useHash()
    })
    act(() => go('#/fr/sitting'))
    await pressBack()
    await waitFor(() => expect(result.current).toBe('#/fr'))
    expect(onBlocked).not.toHaveBeenCalled()
  })

  it('asks the browser to confirm closing the tab only while guarded', () => {
    const { rerender } = renderHook(
      ({ active }) => useLeaveGuard(active, () => {}),
      { initialProps: { active: true } },
    )
    const unload = () => {
      const event = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(event)
      return event.defaultPrevented
    }
    expect(unload()).toBe(true)
    rerender({ active: false })
    expect(unload()).toBe(false)
  })
})
