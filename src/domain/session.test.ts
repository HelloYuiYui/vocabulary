import { describe, expect, it } from 'vitest'
import { shuffled } from './session.ts'

describe('shuffled', () => {
  it('reorders a copy and leaves the original alone', () => {
    const items = [1, 2, 3, 4]
    expect(shuffled(items, () => 0)).toEqual([2, 3, 4, 1])
    expect(items).toEqual([1, 2, 3, 4])
  })

  it('keeps the order with a random source near 1', () => {
    expect(shuffled([1, 2, 3, 4], () => 0.999)).toEqual([1, 2, 3, 4])
  })

  it('keeps every item', () => {
    const out = shuffled([1, 2, 3, 4, 5], Math.random)
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5])
  })
})
