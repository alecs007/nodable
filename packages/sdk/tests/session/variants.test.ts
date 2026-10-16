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
    expect(variants[0]?.pending).toEqual(['root'])
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

    expect(double?.pending).toEqual(['root.1'])
    expect(double?.snapshot.root).toMatchObject({ kind: 'binary', symbol: '∨' })
  })

  it('puts the cursor on the node that would take the negation', () => {
    const [double, single] = variantsOf('(')

    expect(double?.snapshot.cursor).toEqual({ kind: 'node', nodeId: 'root.0' })
    expect(single?.snapshot.cursor).toEqual({ kind: 'node', nodeId: 'root' })
  })

  it('settles every group that can only become a double node', () => {
    const variants = variantsOf('(((')

    expect(variants).toHaveLength(2)
    expect(variants[0]?.pending).toEqual(['root', 'root.0', 'root.0.0'])
    expect(variants[0]?.snapshot.root).toMatchObject({
      kind: 'binary',
      right: { kind: 'slot', id: 'root.1' },
      left: { kind: 'binary', right: { kind: 'slot', id: 'root.0.1' } },
    })
  })

  it('offers the two shapes for the innermost group only', () => {
    const [double, single] = variantsOf('(((')

    expect(double?.snapshot.root).toMatchObject({
      left: { left: { kind: 'binary', id: 'root.0.0' } },
    })
    expect(single?.snapshot.root).toMatchObject({
      left: { left: { kind: 'unary', id: 'root.0.0' } },
    })
  })
})
