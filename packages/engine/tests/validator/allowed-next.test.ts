import { describe, expect, it } from 'vitest'
import { allowedNextTokens, analyzeFormula, stateOfStep } from '../../src/index'

function allowedAtStep(input: string, index: number): readonly string[] {
  const step = analyzeFormula(input).steps[index]

  if (step === undefined) {
    throw new Error(`expected step ${String(index)} for ${input}`)
  }

  return allowedNextTokens(stateOfStep(step))
}

describe('allowedNextTokens', () => {
  it('answers for an earlier step of a finished build', () => {
    expect(allowedAtStep('(p ∧ q)', 0)).toEqual(['open-paren', 'variable'])
    expect(allowedAtStep('(p ∧ q)', 1)).toEqual(['open-paren', 'negation', 'variable'])
    expect(allowedAtStep('(p ∧ q)', 5)).toEqual([])
  })

  it('does not allow a close parenthesis when nothing is open', () => {
    expect(allowedAtStep('p', 0)).not.toContain('close-paren')
  })
})
