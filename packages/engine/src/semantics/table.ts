import { type TreeNode } from '../model/tree'
import { interpretationAt } from './classify'
import { type Interpretation, type TruthValue, evaluateTree, variablesOf } from './evaluate'

export const MAX_TABLE_VARIABLES = 8

export type TruthTableRow = {
  readonly interpretation: Interpretation
  readonly values: readonly TruthValue[]
}

export type TruthTable = {
  readonly variables: readonly string[]
  readonly columns: readonly TreeNode[]
  readonly rows: readonly TruthTableRow[]
}

function isSameFormula(first: TreeNode, second: TreeNode): boolean {
  if (first.kind === 'leaf' && second.kind === 'leaf') {
    return first.name === second.name
  }

  if (first.kind === 'unary' && second.kind === 'unary') {
    return isSameFormula(first.child, second.child)
  }

  if (first.kind === 'binary' && second.kind === 'binary') {
    return (
      first.symbol === second.symbol &&
      isSameFormula(first.left, second.left) &&
      isSameFormula(first.right, second.right)
    )
  }

  return false
}

function compoundsOf(node: TreeNode): readonly TreeNode[] {
  switch (node.kind) {
    case 'unary':
      return [...compoundsOf(node.child), node]
    case 'binary':
      return [...compoundsOf(node.left), ...compoundsOf(node.right), node]
    case 'leaf':
    case 'slot':
    case 'group':
      return []
  }
}

function distinct(nodes: readonly TreeNode[]): readonly TreeNode[] {
  return nodes.filter(
    (node, index) => !nodes.slice(0, index).some((earlier) => isSameFormula(earlier, node)),
  )
}

export function tabulateTree(root: TreeNode): TruthTable | undefined {
  const variables = variablesOf(root)

  if (variables.length > MAX_TABLE_VARIABLES) {
    return undefined
  }

  const columns = distinct(compoundsOf(root))
  const rows: TruthTableRow[] = []

  for (let row = 0; row < 2 ** variables.length; row += 1) {
    const interpretation = interpretationAt(variables, row)
    const evaluation = evaluateTree(root, interpretation)

    if (evaluation.value === undefined) {
      return undefined
    }

    rows.push({
      interpretation,
      values: columns.map((column) => evaluation.values[column.id] === true),
    })
  }

  return { variables, columns, rows }
}
