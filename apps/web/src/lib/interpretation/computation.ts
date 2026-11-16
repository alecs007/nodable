import {
  type EvaluationStep,
  type Interpretation,
  type TruthValue,
  NEGATION,
  valueOfVariable,
} from '@nodable/sdk'

export type TruthLetters = {
  readonly true: string
  readonly false: string
}

export const UNKNOWN_LETTER = '?'

export function letterOf(value: TruthValue | undefined, letters: TruthLetters): string {
  if (value === undefined) {
    return UNKNOWN_LETTER
  }

  return value ? letters.true : letters.false
}

export function computationOf(step: EvaluationStep, letters: TruthLetters): string {
  const [first, second] = step.operands

  switch (step.node.kind) {
    case 'leaf':
      return step.node.name
    case 'unary':
      return `${NEGATION}${letterOf(first, letters)}`
    case 'binary':
      return `${letterOf(first, letters)} ${step.node.symbol} ${letterOf(second, letters)}`
    case 'group':
    case 'slot':
      return ''
  }
}

export function isCompound(step: EvaluationStep): boolean {
  return step.node.kind === 'unary' || step.node.kind === 'binary'
}

export function describeInterpretation(
  interpretation: Interpretation,
  variables: readonly string[],
  letters: TruthLetters,
): string {
  return variables
    .map((name) => `${name} = ${letterOf(valueOfVariable(interpretation, name), letters)}`)
    .join(', ')
}
