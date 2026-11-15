import { describe, expect, it } from 'vitest'
import { type TreeNode, createSession, formulaOf } from '../../src/index'

function treeOf(input: string): TreeNode {
  return createSession(input).analysis.tree
}

describe('formulaOf', () => {
  it('writes a variable by its name', () => {
    expect(formulaOf(treeOf('p'))).toBe('p')
  })

  it('writes a fully parenthesized formula with canonical spacing', () => {
    expect(formulaOf(treeOf('((!p)|(q->r))'))).toBe('((¬p) ∨ (q → r))')
  })

  it('marks what is still missing', () => {
    expect(formulaOf(treeOf('(p ∧'))).toBe('(p ∧ □)')
  })

  it('marks an undecided group', () => {
    expect(formulaOf(treeOf('(p'))).toBe('(p □)')
  })
})
