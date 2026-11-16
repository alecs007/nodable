import { createSession, evaluateSession } from '@nodable/sdk'
import { describe, expect, it } from 'vitest'
import {
  type TruthLetters,
  computationOf,
  describeInterpretation,
  isCompound,
  letterOf,
} from '../../src/lib/interpretation/computation'

const LETTERS: TruthLetters = { true: 'A', false: 'F' }

function stepsOf(input: string, values: Readonly<Record<string, boolean>>) {
  return evaluateSession({ ...createSession(input), interpretation: values }).steps
}

describe('letterOf', () => {
  it('writes a known value with its letter', () => {
    expect([letterOf(true, LETTERS), letterOf(false, LETTERS)]).toEqual(['A', 'F'])
  })

  it('writes an open value as a question mark', () => {
    expect(letterOf(undefined, LETTERS)).toBe('?')
  })
})

describe('computationOf', () => {
  it('writes each step with the values of its operands', () => {
    const steps = stepsOf('((¬p) → q)', { p: true })

    expect(steps.map((step) => computationOf(step, LETTERS))).toEqual(['p', '¬A', 'q', 'F → ?'])
  })

  it('writes nothing for a part that is still missing', () => {
    expect(stepsOf('(p', {}).map((step) => computationOf(step, LETTERS))).toEqual(['p', ''])
    expect(stepsOf('', {}).map((step) => computationOf(step, LETTERS))).toEqual([''])
  })
})

describe('isCompound', () => {
  it('keeps the steps that apply a connective', () => {
    expect(
      stepsOf('((¬p) ∧ q)', {})
        .filter(isCompound)
        .map((step) => step.node.id),
    ).toEqual(['root.0', 'root'])
  })
})

describe('describeInterpretation', () => {
  it('writes each variable with its value, in the given order', () => {
    expect(describeInterpretation({ q: false, p: true }, ['p', 'q', 'r'], LETTERS)).toBe(
      'p = A, q = F, r = ?',
    )
  })
})
