import { type BuildStep } from '../builder/build-state'
import { buildTree } from '../builder/build-tree'
import { type Cursor, isComplete } from '../model/cursor'
import { createDiagnostic, type Diagnostic } from '../model/diagnostic'
import { createRange } from '../model/source-range'
import { type Token, type TokenKind } from '../model/token'
import { type TreeNode } from '../model/tree'
import { tokenize } from '../tokenizer/tokenize'
import { allowedNextTokens } from './allowed-next'

export type Analysis = {
  readonly input: string
  readonly tokens: readonly Token[]
  readonly steps: readonly BuildStep[]
  readonly tree: TreeNode
  readonly cursor: Cursor
  readonly diagnostics: readonly Diagnostic[]
  readonly allowedNext: readonly TokenKind[]
  readonly isComplete: boolean
}

function firstErrorOf(groups: readonly (readonly Diagnostic[])[]): Diagnostic | undefined {
  return groups
    .flat()
    .toSorted((left, right) => left.range.start - right.range.start)
    .at(0)
}

function diagnosticsOf(
  input: string,
  tokens: readonly Token[],
  cursor: Cursor,
  error: Diagnostic | undefined,
): readonly Diagnostic[] {
  if (error !== undefined) {
    return [error]
  }

  if (tokens.length > 0 && !isComplete(cursor)) {
    return [createDiagnostic('NDB007', createRange(0, input.length))]
  }

  return []
}

export function analyzeFormula(input: string): Analysis {
  const tokenized = tokenize(input)
  const built = buildTree(tokenized.tokens)
  const error = firstErrorOf([tokenized.diagnostics, built.diagnostics])
  const diagnostics = diagnosticsOf(input, tokenized.tokens, built.cursor, error)

  return {
    input,
    tokens: tokenized.tokens,
    steps: built.steps,
    tree: built.tree,
    cursor: built.cursor,
    diagnostics,
    allowedNext: allowedNextTokens(built),
    isComplete: isComplete(built.cursor) && error === undefined,
  }
}
