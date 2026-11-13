import { describe, expect, it } from 'vitest'
import {
  addDays,
  dueKeys,
  enrol,
  localDay,
  REVIEW_LIMIT,
  schedule,
  type CardState,
} from './schedule.ts'

// Dates are built with the local constructor, so the tests hold in any timezone.
const NOW = new Date(2026, 10, 12, 9, 0)
const card = (box: number, due: string, seen = 2, right = 1): CardState => ({
  box,
  due,
  seen,
  right,
})

describe('localDay', () => {
  it('uses the local day, not UTC', () => {
    expect(localDay(new Date(2026, 10, 12, 23, 50))).toBe('2026-11-12')
    expect(localDay(new Date(2026, 10, 13, 0, 5))).toBe('2026-11-13')
  })

  it('pads months and days', () => {
    expect(localDay(new Date(2026, 0, 5, 12, 0))).toBe('2026-01-05')
  })
})

describe('addDays', () => {
  it('adds days across month and year ends', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDays('2026-12-25', 14)).toBe('2027-01-08')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
  })

  it('adds days across a clock change', () => {
    expect(addDays('2026-03-28', 3)).toBe('2026-03-31')
    expect(addDays('2026-10-24', 3)).toBe('2026-10-27')
    expect(addDays('2026-03-07', 3)).toBe('2026-03-10')
    expect(addDays('2026-10-31', 3)).toBe('2026-11-03')
  })
})

describe('enrol', () => {
  it('puts a card in box 1, due tomorrow, even late in the evening', () => {
    expect(enrol(new Date(2026, 10, 12, 23, 50))).toEqual({
      box: 1,
      due: '2026-11-13',
      seen: 0,
      right: 0,
    })
  })
})

describe('schedule', () => {
  it.each([
    [1, 2, '2026-11-15'],
    [2, 3, '2026-11-19'],
    [3, 4, '2026-11-26'],
    [4, 5, '2026-12-12'],
    [5, 5, '2026-12-12'],
  ])('moves box %i to box %i when right', (from, to, due) => {
    expect(schedule(card(from, '2026-11-12'), true, NOW)).toEqual({
      box: to,
      due,
      seen: 3,
      right: 2,
    })
  })

  it('sends a missed card to box 1, due tomorrow', () => {
    expect(schedule(card(4, '2026-11-12', 5, 4), false, NOW)).toEqual({
      box: 1,
      due: '2026-11-13',
      seen: 6,
      right: 4,
    })
  })

  it('counts from today, not from the day the card was due', () => {
    expect(schedule(card(1, '2026-10-01'), true, NOW).due).toBe('2026-11-15')
  })

  it.each([9, 0, -3, 2.5, Number.NaN])(
    'copes with an out-of-range box: %s',
    (box) => {
      const next = schedule(card(box, '2026-11-12'), true, NOW)
      expect(next.box).toBeGreaterThanOrEqual(1)
      expect(next.box).toBeLessThanOrEqual(5)
      expect(next.due).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    },
  )
})

describe('dueKeys', () => {
  it('lists due cards, earliest first, never the future', () => {
    const cards = {
      later: card(1, '2026-11-13'),
      today: card(1, '2026-11-12'),
      old: card(1, '2026-11-10'),
    }
    expect(dueKeys(cards, NOW)).toEqual(['old', 'today'])
  })

  it('orders cards due the same day by key', () => {
    const cards = { b: card(1, '2026-11-12'), a: card(1, '2026-11-12') }
    expect(dueKeys(cards, NOW)).toEqual(['a', 'b'])
  })

  it('caps a backlog at the review limit', () => {
    const cards = Object.fromEntries(
      Array.from({ length: 40 }, (_, i) => [`k${i}`, card(1, '2026-11-01')]),
    )
    expect(REVIEW_LIMIT).toBe(30)
    expect(dueKeys(cards, NOW)).toHaveLength(30)
  })

  it('keeps cards due when the clock is set back, and offers them later', () => {
    const cards = { a: card(2, '2026-11-12') }
    expect(dueKeys(cards, new Date(2026, 10, 1, 9, 0))).toEqual([])
    expect(dueKeys(cards, new Date(2027, 5, 1, 9, 0))).toEqual(['a'])
  })

  it('is empty when there are no cards', () => {
    expect(dueKeys({}, NOW)).toEqual([])
  })
})
