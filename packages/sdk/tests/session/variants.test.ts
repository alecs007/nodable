import { describe, expect, it } from 'vitest'
import { createSession, getTree, pendingVariants } from '../../src/index'

function variantsOf(input: string): ReturnType<typeof pendingVariants> {
  return pendingVariants(getTree(createSession(input)))
}

describe('pendingVariants', () => {
  it('reports nothing when no group is waiting for its arity', () => {
    expect(variantsOf('')).toEqual([])
    expect(variantsOf('(p ∧ q)')).toEqual([])
    expect(variantsOf('(¬p)')).toEqual([])
  })

  it('offers both shapes directly after an open parenthesis', () => {
    const variants = variantsOf('(')

    expect(variants.map((variant) => variant.kind)).toEqual(['double', 'single'])
    expect(variants[0]?.workingId).toBe('root')
  })

  it('leaves the connective of the double shape unnamed', () => {
    expect(variantsOf('(')[0]?.isLabelKnown).toBe(false)
    expect(variantsOf('(')[1]?.isLabelKnown).toBe(true)
  })

  it('gives the double shape a second operand slot', () => {
    const [double] = variantsOf('(')

    expect(double?.snapshot.root).toMatchObject({
      kind: 'binary',
      right: { kind: 'slot', id: 'root.1' },
    })
  })

  it('gives the single shape the negation symbol', () => {
    const [, single] = variantsOf('(')

    expect(single?.snapshot.root).toMatchObject({ kind: 'unary', symbol: '¬' })
  })

  it('keeps only the double shape once the first operand is filled', () => {
    expect(variantsOf('(p').map((variant) => variant.kind)).toEqual(['double'])
    expect(variantsOf('((p ∧ q)').map((variant) => variant.kind)).toEqual(['double'])
  })

  it('keeps the nodes that were already built', () => {
    const [double] = variantsOf('((¬p) ∨ (')

    expect(double?.workingId).toBe('root.1')
    expect(double?.snapshot.root).toMatchObject({ kind: 'binary', symbol: '∨' })
  })
})
