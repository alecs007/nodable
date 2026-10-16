import { describe, expect, it } from 'vitest'
import { createRange, mergeRanges, singleCharacterRange } from '../../src/index'

describe('source ranges', () => {
  it('creates a range from two offsets', () => {
    expect(createRange(2, 5)).toEqual({ start: 2, end: 5 })
  })

  it('creates a range covering one character', () => {
    expect(singleCharacterRange(3)).toEqual({ start: 3, end: 4 })
  })

  it('merges two ranges into the span that covers both', () => {
    expect(mergeRanges({ start: 4, end: 6 }, { start: 1, end: 2 })).toEqual({ start: 1, end: 6 })
  })
})
