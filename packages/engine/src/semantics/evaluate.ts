import { type NodeId } from '../model/node-id'
import {
  CONJUNCTION,
  type Connective,
  DISJUNCTION,
  EQUIVALENCE,
  IMPLICATION,
} from '../model/symbols'
import { type TreeNode, leavesOf } from '../model/tree'

export type TruthValue = boolean

export type Interpretation = Readonly<Record<string, TruthValue>>

export type EvaluationStep = {
  readonly node: TreeNode
  readonly operands: readonly (TruthValue | undefined)[]
  readonly value: TruthValue | undefined
}

export type Evaluation = {
  readonly value: TruthValue | undefined
  readonly steps: readonly EvaluationStep[]
  readonly values: Readonly<Record<NodeId, TruthValue>>
}

export function variablesOf(root: TreeNode): readonly string[] {
  return [...new Set(leavesOf(root).map((leaf) => leaf.name))]
}

export function valueOfVariable(
  interpretation: Interpretation,
  name: string,
): TruthValue | undefined {
  return Object.hasOwn(interpretation, name) ? interpretation[name] : undefined
}

export function applyConnective(
  symbol: Connective,
  left: TruthValue,
  right: TruthValue,
): TruthValue {
  switch (symbol) {
    case CONJUNCTION:
      return left && right
    case DISJUNCTION:
      return left || right
    case IMPLICATION:
      return !left || right
    case EQUIVALENCE:
      return left === right
  }
}

function lastValue(steps: readonly EvaluationStep[]): TruthValue | undefined {
  return steps.at(-1)?.value
}

function stepsOf(node: TreeNode, interpretation: Interpretation): readonly EvaluationStep[] {
  switch (node.kind) {
    case 'leaf':
      return [{ node, operands: [], value: valueOfVariable(interpretation, node.name) }]
    case 'unary': {
      const inner = stepsOf(node.child, interpretation)
      const operand = lastValue(inner)

      return [
        ...inner,
        { node, operands: [operand], value: operand === undefined ? undefined : !operand },
      ]
    }
    case 'binary': {
      const left = stepsOf(node.left, interpretation)
      const right = stepsOf(node.right, interpretation)
      const first = lastValue(left)
      const second = lastValue(right)
      const value =
        first === undefined || second === undefined
          ? undefined
          : applyConnective(node.symbol, first, second)

      return [...left, ...right, { node, operands: [first, second], value }]
    }
    case 'group':
      return [...stepsOf(node.first, interpretation), { node, operands: [], value: undefined }]
    case 'slot':
      return [{ node, operands: [], value: undefined }]
  }
}

export function evaluateTree(root: TreeNode, interpretation: Interpretation): Evaluation {
  const steps = stepsOf(root, interpretation)
  const values: Record<NodeId, TruthValue> = {}

  for (const step of steps) {
    if (step.value !== undefined) {
      values[step.node.id] = step.value
    }
  }

  return { value: lastValue(steps), steps, values }
}
