import { type Cursor, cursorAt } from '../model/cursor'
import { type Diagnostic } from '../model/diagnostic'
import { ROOT_ID } from '../model/node-id'
import { type Token } from '../model/token'
import { createRootSlot, type TreeNode } from '../model/tree'

export type BuildState = {
  readonly tree: TreeNode
  readonly cursor: Cursor
  readonly openDepth: number
}

export type Placement =
  | { readonly kind: 'placed'; readonly state: BuildState }
  | { readonly kind: 'rejected'; readonly diagnostic: Diagnostic }

export type BuildStep = {
  readonly index: number
  readonly token: Token | null
  readonly tree: TreeNode
  readonly cursor: Cursor
}

export type BuildResult = {
  readonly steps: readonly BuildStep[]
  readonly tree: TreeNode
  readonly cursor: Cursor
  readonly diagnostics: readonly Diagnostic[]
}

export function createBuildState(): BuildState {
  return { tree: createRootSlot(), cursor: cursorAt(ROOT_ID), openDepth: 0 }
}
