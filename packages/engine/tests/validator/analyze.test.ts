import { describe, expect, it } from 'vitest'
import { type Analysis, type DiagnosticCode, analyzeFormula } from '../../src/index'

function codes(input: string): readonly DiagnosticCode[] {
  return analyzeFormula(input).diagnostics.map((diagnostic) => diagnostic.code)
}

function only(input: string): Analysis['diagnostics'][number] {
  const [diagnostic] = analyzeFormula(input).diagnostics

  if (diagnostic === undefined) {
    throw new Error(`expected a diagnostic for ${input}`)
  }

  return diagnostic
}

describe('analyzeFormula', () => {
  it('reports nothing for an empty input', () => {
    const analysis = analyzeFormula('')

    expect(analysis.diagnostics).toEqual([])
    expect(analysis.isComplete).toBe(false)
  })

  it('reports nothing for a complete formula', () => {
    const analysis = analyzeFormula('((¬p) ∨ q)')

    expect(analysis.diagnostics).toEqual([])
    expect(analysis.isComplete).toBe(true)
  })

  it('accepts a single variable as a complete formula', () => {
    expect(analyzeFormula('p').isComplete).toBe(true)
  })

  describe('diagnostics', () => {
    it('reports an unknown character', () => {
      expect(only('p # q')).toMatchObject({ code: 'NDB001', range: { start: 2, end: 3 } })
    })

    it('reports a token that is not allowed at the cursor', () => {
      expect(codes('(pp')).toEqual(['NDB002'])
    })

    it('reports an unmatched close parenthesis', () => {
      expect(only(')')).toMatchObject({ code: 'NDB003', range: { start: 0, end: 1 } })
    })

    it('reports input that continues after the formula is complete', () => {
      expect(only('p q')).toMatchObject({ code: 'NDB004', range: { start: 2, end: 3 } })
    })

    it('reports a negation that does not follow an open parenthesis', () => {
      expect(codes('¬p')).toEqual(['NDB005'])
    })

    it('reports a connective without a left operand', () => {
      expect(codes('(∧ p)')).toEqual(['NDB006'])
    })

    it('warns that a formula with an unclosed parenthesis is incomplete', () => {
      const diagnostic = only('(p ∧ q')

      expect(diagnostic).toMatchObject({ code: 'NDB007', severity: 'warning' })
      expect(diagnostic.range).toEqual({ start: 0, end: 6 })
    })

    it('warns that a formula with an empty slot is incomplete', () => {
      expect(codes('(p ∧')).toEqual(['NDB007'])
    })

    it('reports only the first error', () => {
      expect(codes('(pp#')).toEqual(['NDB002'])
    })

    it('prefers the earliest error regardless of where it was found', () => {
      expect(only('p#p')).toMatchObject({ code: 'NDB001', range: { start: 1, end: 2 } })
    })

    it('never reports an incomplete warning alongside an error', () => {
      expect(codes('(¬p ∧')).toEqual(['NDB002'])
    })
  })

  describe('allowed next tokens', () => {
    it('allows a variable, a negation or an open parenthesis on an empty input', () => {
      expect(analyzeFormula('').allowedNext).toEqual(['open-paren', 'variable'])
    })

    it('allows a negation directly after an open parenthesis', () => {
      expect(analyzeFormula('(').allowedNext).toEqual(['open-paren', 'negation', 'variable'])
    })

    it('allows a connective or a close parenthesis once the first operand is complete', () => {
      expect(analyzeFormula('(p').allowedNext).toEqual(['connective'])
    })

    it('allows a close parenthesis once both operands of a double node are complete', () => {
      expect(analyzeFormula('(p ∧ q').allowedNext).toEqual(['close-paren'])
    })

    it('allows nothing once the formula is complete', () => {
      expect(analyzeFormula('(p ∧ q)').allowedNext).toEqual([])
    })

    it('allows an operand after a connective', () => {
      expect(analyzeFormula('(p ∧').allowedNext).toEqual(['open-paren', 'variable'])
    })
  })

  describe('steps', () => {
    it('records the initial state and one step per accepted token', () => {
      expect(analyzeFormula('(p ∧ q)').steps.map((step) => step.token?.kind ?? 'start')).toEqual([
        'start',
        'open-paren',
        'variable',
        'connective',
        'variable',
        'close-paren',
      ])
    })

    it('tracks how many parentheses are open at each step', () => {
      expect(analyzeFormula('((p ∧ q) ∨ r)').steps.map((step) => step.openDepth)).toEqual([
        0, 1, 2, 2, 2, 2, 1, 1, 1, 0,
      ])
    })
  })

  it('keeps the tokens it read', () => {
    expect(analyzeFormula('(p ∧ q)').tokens).toHaveLength(5)
  })
})
