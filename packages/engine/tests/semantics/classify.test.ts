import { describe, expect, it } from 'vitest'
import {
  type TreeNode,
  MAX_CLASSIFIED_VARIABLES,
  ROOT_ID,
  analyzeFormula,
  classifyTree,
  createRootSlot,
} from '../../src/index'

function treeOf(input: string): TreeNode {
  return analyzeFormula(input).tree
}

function disjunctionOf(count: number): string {
  return Array.from({ length: count }, (_, index) => `p${String(index)}`).reduce(
    (formula, variable) => `(${formula} ∨ ${variable})`,
  )
}

describe('classifyTree', () => {
  it('finds a formula true under every interpretation valid', () => {
    expect(classifyTree(treeOf('(p ∨ (¬p))'))).toEqual({
      kind: 'valid',
      models: 2,
      interpretations: 2,
      model: { p: true },
      countermodel: undefined,
    })
  })

  it('finds a formula false under every interpretation unsatisfiable', () => {
    expect(classifyTree(treeOf('(p ∧ (¬p))'))).toEqual({
      kind: 'unsatisfiable',
      models: 0,
      interpretations: 2,
      model: undefined,
      countermodel: { p: true },
    })
  })

  it('finds a formula true under some interpretations satisfiable', () => {
    expect(classifyTree(treeOf('(p → q)'))).toEqual({
      kind: 'satisfiable',
      models: 3,
      interpretations: 4,
      model: { p: true, q: true },
      countermodel: { p: true, q: false },
    })
  })

  it('classifies the examples of the course', () => {
    expect(classifyTree(treeOf('((P → Q) ∨ (Q → P))'))?.kind).toBe('valid')
    expect(classifyTree(treeOf('((P ∧ (¬P)) → Q)'))?.kind).toBe('valid')
    expect(classifyTree(treeOf('(((P ∨ Q) ∧ (¬P)) ∧ (¬Q))'))?.kind).toBe('unsatisfiable')
    expect(classifyTree(treeOf('(P → (Q ∧ R))'))?.kind).toBe('satisfiable')
  })

  it('counts every variable once however often it appears', () => {
    expect(classifyTree(treeOf('((p ∧ q) ∨ (p ∧ (¬q)))'))?.interpretations).toBe(4)
  })

  it('gives no classification to an unfinished tree', () => {
    expect(classifyTree(treeOf('(p ∧'))).toBeUndefined()
    expect(classifyTree(createRootSlot())).toBeUndefined()
  })

  it('gives no classification to an undecided group', () => {
    const group: TreeNode = {
      kind: 'group',
      id: ROOT_ID,
      isClosed: false,
      first: { kind: 'leaf', id: 'root.0', name: 'p' },
    }

    expect(classifyTree(group)).toBeUndefined()
  })

  it('leaves a negation of an unfinished part without a value', () => {
    expect(classifyTree(treeOf('(¬'))).toBeUndefined()
  })

  it('classifies up to the variable limit and no further', () => {
    expect(classifyTree(treeOf(disjunctionOf(MAX_CLASSIFIED_VARIABLES)))?.models).toBe(
      2 ** MAX_CLASSIFIED_VARIABLES - 1,
    )
    expect(classifyTree(treeOf(disjunctionOf(MAX_CLASSIFIED_VARIABLES + 1)))).toBeUndefined()
  })
})
