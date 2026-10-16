import { describe, expect, it } from 'vitest'
import { normalizeFormula } from '../../src/index'

describe('normalizeFormula', () => {
  it('leaves canonical symbols untouched', () => {
    expect(normalizeFormula('((¬p) ∨ q)')).toBe('((¬p) ∨ q)')
  })

  it('replaces negation aliases', () => {
    expect(normalizeFormula('(!p)')).toBe('(¬p)')
    expect(normalizeFormula('(~p)')).toBe('(¬p)')
  })

  it.each([
    ['(p & q)', '(p ∧ q)'],
    ['(p /\\ q)', '(p ∧ q)'],
    ['(p | q)', '(p ∨ q)'],
    ['(p \\/ q)', '(p ∨ q)'],
    ['(p -> q)', '(p → q)'],
    ['(p => q)', '(p → q)'],
    ['(p <-> q)', '(p ↔ q)'],
    ['(p <=> q)', '(p ↔ q)'],
  ])('replaces %s with %s', (input, expected) => {
    expect(normalizeFormula(input)).toBe(expected)
  })

  it('keeps characters it does not recognize', () => {
    expect(normalizeFormula('p # q')).toBe('p # q')
  })

  it('returns an empty string unchanged', () => {
    expect(normalizeFormula('')).toBe('')
  })
})
