import { describe, expect, it } from 'vitest'
import {
  type Connective,
  type GroupNode,
  CONJUNCTION,
  DISJUNCTION,
  EQUIVALENCE,
  IMPLICATION,
  ROOT_ID,
  analyzeFormula,
  applyConnective,
  createRootSlot,
  evaluateTree,
  valueOfVariable,
  variablesOf,
} from '../../src/index'

function treeOf(input: string): ReturnType<typeof analyzeFormula>['tree'] {
  return analyzeFormula(input).tree
}

describe('variablesOf', () => {
  it('lists each variable once, in order of first appearance', () => {
    expect(variablesOf(treeOf('((q ∧ p) → (¬q))'))).toEqual(['q', 'p'])
  })

  it('keeps names that differ only in case apart', () => {
    expect(variablesOf(treeOf('(P ∨ p)'))).toEqual(['P', 'p'])
  })

  it('finds no variables in an empty tree', () => {
    expect(variablesOf(createRootSlot())).toEqual([])
  })
})

describe('valueOfVariable', () => {
  it('reads an assigned value', () => {
    expect(valueOfVariable({ p: false }, 'p')).toBe(false)
  })

  it('ignores names inherited from the object prototype', () => {
    expect(valueOfVariable({}, 'constructor')).toBeUndefined()
  })
})

describe('applyConnective', () => {
  const table: readonly (readonly [Connective, readonly boolean[]])[] = [
    [CONJUNCTION, [true, false, false, false]],
    [DISJUNCTION, [true, true, true, false]],
    [IMPLICATION, [true, false, true, true]],
    [EQUIVALENCE, [true, false, false, true]],
  ]

  const rows: readonly (readonly [boolean, boolean])[] = [
    [true, true],
    [true, false],
    [false, true],
    [false, false],
  ]

  it.each(table)('follows the truth table of %s', (symbol, expected) => {
    expect(rows.map(([left, right]) => applyConnective(symbol, left, right))).toEqual(expected)
  })
})

describe('evaluateTree', () => {
  it('evaluates a single variable', () => {
    expect(evaluateTree(treeOf('p'), { p: true }).value).toBe(true)
  })

  it('negates the value of its operand', () => {
    const evaluation = evaluateTree(treeOf('(¬p)'), { p: true })

    expect(evaluation.value).toBe(false)
    expect(evaluation.steps.at(-1)?.operands).toEqual([true])
  })

  it('computes every node from the leaves up', () => {
    const evaluation = evaluateTree(treeOf('((¬p) ∨ q)'), { p: true, q: false })

    expect(evaluation.steps.map((step) => step.node.id)).toEqual([
      'root.0.0',
      'root.0',
      'root.1',
      'root',
    ])
    expect(evaluation.values).toEqual({
      root: false,
      'root.0': false,
      'root.0.0': true,
      'root.1': false,
    })
    expect(evaluation.steps.at(-1)?.operands).toEqual([false, false])
  })

  it('leaves a value open while one of its variables is unassigned', () => {
    const evaluation = evaluateTree(treeOf('((¬p) ∨ q)'), { p: false })

    expect(evaluation.value).toBeUndefined()
    expect(evaluation.values).toEqual({ 'root.0': true, 'root.0.0': false })
    expect(evaluation.steps.at(-1)?.operands).toEqual([true, undefined])
  })

  it('leaves a negation open while its operand is open', () => {
    expect(evaluateTree(treeOf('(¬p)'), {}).values).toEqual({})
  })

  it('leaves a binary node open while its left operand is open', () => {
    expect(evaluateTree(treeOf('(p ∧ q)'), { q: true }).values).toEqual({ 'root.1': true })
  })

  it('gives no value to an unfinished tree', () => {
    const evaluation = evaluateTree(treeOf('(p'), { p: true })

    expect(evaluation.value).toBeUndefined()
    expect(evaluation.values).toEqual({ 'root.0': true })
  })

  it('gives no value to an undecided group', () => {
    const group: GroupNode = {
      kind: 'group',
      id: ROOT_ID,
      isClosed: false,
      first: { kind: 'leaf', id: 'root.0', name: 'p' },
    }

    expect(evaluateTree(group, { p: true }).value).toBeUndefined()
  })

  it('gives no value to an empty slot', () => {
    expect(evaluateTree(createRootSlot(), {}).steps).toHaveLength(1)
  })
})
