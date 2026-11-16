import { type TreeNode } from '../model/tree'
import {
  type Interpretation,
  type TruthValue,
  applyConnective,
  valueOfVariable,
  variablesOf,
} from './evaluate'

export const MAX_CLASSIFIED_VARIABLES = 16

export type Satisfiability = 'valid' | 'satisfiable' | 'unsatisfiable'

export type Classification = {
  readonly kind: Satisfiability
  readonly models: number
  readonly interpretations: number
  readonly model: Interpretation | undefined
  readonly countermodel: Interpretation | undefined
}

function valueOf(node: TreeNode, interpretation: Interpretation): TruthValue | undefined {
  switch (node.kind) {
    case 'leaf':
      return valueOfVariable(interpretation, node.name)
    case 'unary': {
      const operand = valueOf(node.child, interpretation)

      return operand === undefined ? undefined : !operand
    }
    case 'binary': {
      const left = valueOf(node.left, interpretation)
      const right = valueOf(node.right, interpretation)

      return left === undefined || right === undefined
        ? undefined
        : applyConnective(node.symbol, left, right)
    }
    case 'group':
    case 'slot':
      return undefined
  }
}

function interpretationAt(variables: readonly string[], row: number): Interpretation {
  return Object.fromEntries(
    variables.map((name, index) => {
      const bit = variables.length - 1 - index

      return [name, (row & (1 << bit)) === 0]
    }),
  )
}

function kindOf(models: number, interpretations: number): Satisfiability {
  if (models === interpretations) {
    return 'valid'
  }

  return models === 0 ? 'unsatisfiable' : 'satisfiable'
}

export function classifyTree(root: TreeNode): Classification | undefined {
  const variables = variablesOf(root)

  if (variables.length > MAX_CLASSIFIED_VARIABLES) {
    return undefined
  }

  const interpretations = 2 ** variables.length
  let models = 0
  let model: Interpretation | undefined
  let countermodel: Interpretation | undefined

  for (let row = 0; row < interpretations; row += 1) {
    const interpretation = interpretationAt(variables, row)
    const value = valueOf(root, interpretation)

    if (value === undefined) {
      return undefined
    }

    if (value) {
      models += 1
      model ??= interpretation
    } else {
      countermodel ??= interpretation
    }
  }

  return { kind: kindOf(models, interpretations), models, interpretations, model, countermodel }
}
