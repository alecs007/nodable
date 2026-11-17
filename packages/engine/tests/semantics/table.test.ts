import { describe, expect, it } from 'vitest'
import {
  type TreeNode,
  MAX_TABLE_VARIABLES,
  analyzeFormula,
  createRootSlot,
  tabulateTree,
} from '../../src/index'

function treeOf(input: string): TreeNode {
  return analyzeFormula(input).tree
}

function disjunctionOf(count: number): string {
  return Array.from({ length: count }, (_, index) => `p${String(index)}`).reduce(
    (formula, variable) => `(${formula} ∨ ${variable})`,
  )
}

describe('tabulateTree', () => {
  it('lists the variables, then every subformula from the inside out', () => {
    const table = tabulateTree(treeOf('((¬p) ∨ q)'))

    expect(table?.variables).toEqual(['p', 'q'])
    expect(table?.columns.map((column) => column.id)).toEqual(['root.0', 'root'])
  })

  it('writes one row per interpretation, all true first', () => {
    const table = tabulateTree(treeOf('((¬p) ∨ q)'))

    expect(table?.rows).toEqual([
      { interpretation: { p: true, q: true }, values: [false, true] },
      { interpretation: { p: true, q: false }, values: [false, false] },
      { interpretation: { p: false, q: true }, values: [true, true] },
      { interpretation: { p: false, q: false }, values: [true, true] },
    ])
  })

  it('keeps a subformula that appears twice in one column', () => {
    const table = tabulateTree(treeOf('((¬p) ∧ (¬p))'))

    expect(table?.columns.map((column) => column.id)).toEqual(['root.0', 'root'])
  })

  it('tells apart subformulas that differ in a variable or a connective', () => {
    expect(tabulateTree(treeOf('((p ∧ q) ∨ (p ∧ r))'))?.columns).toHaveLength(3)
    expect(tabulateTree(treeOf('((p ∧ q) ∨ (p ∨ q))'))?.columns).toHaveLength(3)
    expect(tabulateTree(treeOf('((p → q) ∧ (r → q))'))?.columns).toHaveLength(3)
    expect(tabulateTree(treeOf('((p → q) ∧ (p → r))'))?.columns).toHaveLength(3)
    expect(tabulateTree(treeOf('((¬p) ∧ (¬q))'))?.columns).toHaveLength(3)
  })

  it('does not merge a negation with a binary node', () => {
    expect(tabulateTree(treeOf('((¬p) ∧ (p ∧ p))'))?.columns).toHaveLength(3)
  })

  it('tabulates a single variable without subformulas', () => {
    expect(tabulateTree(treeOf('p'))).toEqual({
      variables: ['p'],
      columns: [],
      rows: [
        { interpretation: { p: true }, values: [] },
        { interpretation: { p: false }, values: [] },
      ],
    })
  })

  it('gives no table for an unfinished formula', () => {
    expect(tabulateTree(treeOf('(p ∧'))).toBeUndefined()
    expect(tabulateTree(createRootSlot())).toBeUndefined()
  })

  it('stops at the variable limit', () => {
    expect(tabulateTree(treeOf(disjunctionOf(MAX_TABLE_VARIABLES)))?.rows).toHaveLength(
      2 ** MAX_TABLE_VARIABLES,
    )
    expect(tabulateTree(treeOf(disjunctionOf(MAX_TABLE_VARIABLES + 1)))).toBeUndefined()
  })
})
