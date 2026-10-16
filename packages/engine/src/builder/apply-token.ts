import { cursorAbove, cursorAt } from '../model/cursor'
import { createDiagnostic, type DiagnosticCode } from '../model/diagnostic'
import { type NodeId, parentId } from '../model/node-id'
import { type SourceRange } from '../model/source-range'
import { NEGATION } from '../model/symbols'
import { type ConnectiveToken, type Token, type VariableToken } from '../model/token'
import {
  areChildrenComplete,
  createSlot,
  findNode,
  firstChildId,
  isNodeComplete,
  replaceNode,
  secondChildId,
  type TreeNode,
} from '../model/tree'
import { type BuildState, type Placement } from './build-state'

function reject(code: DiagnosticCode, range: SourceRange): Placement {
  return { kind: 'rejected', diagnostic: createDiagnostic(code, range) }
}

function placed(state: BuildState): Placement {
  return { kind: 'placed', state }
}

function openGroup(state: BuildState, node: TreeNode, range: SourceRange): Placement {
  if (node.kind !== 'slot') {
    return reject('NDB002', range)
  }

  const first = createSlot(firstChildId(node.id))
  const group: TreeNode = { kind: 'group', id: node.id, isClosed: false, first }

  return placed({
    tree: replaceNode(state.tree, node.id, group),
    cursor: cursorAt(first.id),
    openDepth: state.openDepth + 1,
  })
}

function placeVariable(state: BuildState, node: TreeNode, token: VariableToken): Placement {
  if (node.kind !== 'slot') {
    return reject('NDB002', token.range)
  }

  const leaf: TreeNode = { kind: 'leaf', id: node.id, name: token.name }

  return placed({
    tree: replaceNode(state.tree, node.id, leaf),
    cursor: cursorAbove(node.id),
    openDepth: state.openDepth,
  })
}

function pendingGroupId(state: BuildState, node: TreeNode): NodeId | undefined {
  if (node.kind !== 'slot') {
    return undefined
  }

  const parent = parentId(node.id)

  if (parent === undefined || firstChildId(parent) !== node.id) {
    return undefined
  }

  return findNode(state.tree, parent)?.kind === 'group' ? parent : undefined
}

function placeNegation(state: BuildState, node: TreeNode, range: SourceRange): Placement {
  const groupId = pendingGroupId(state, node)

  if (groupId === undefined) {
    return reject('NDB005', range)
  }

  const unary: TreeNode = {
    kind: 'unary',
    id: groupId,
    symbol: NEGATION,
    isClosed: false,
    child: node,
  }

  return placed({
    tree: replaceNode(state.tree, groupId, unary),
    cursor: cursorAt(node.id),
    openDepth: state.openDepth,
  })
}

function placeConnective(state: BuildState, node: TreeNode, token: ConnectiveToken): Placement {
  if (node.kind === 'slot') {
    return reject('NDB006', token.range)
  }

  if (node.kind !== 'group' || !isNodeComplete(node.first)) {
    return reject('NDB002', token.range)
  }

  const right = createSlot(secondChildId(node.id))
  const binary: TreeNode = {
    kind: 'binary',
    id: node.id,
    symbol: token.symbol,
    isClosed: false,
    left: node.first,
    right,
  }

  return placed({
    tree: replaceNode(state.tree, node.id, binary),
    cursor: cursorAt(right.id),
    openDepth: state.openDepth,
  })
}

function closeNode(state: BuildState, node: TreeNode, range: SourceRange): Placement {
  if (state.openDepth === 0) {
    return reject('NDB003', range)
  }

  if (node.kind === 'slot' || node.kind === 'leaf' || !areChildrenComplete(node)) {
    return reject('NDB002', range)
  }

  return placed({
    tree: replaceNode(state.tree, node.id, { ...node, isClosed: true }),
    cursor: cursorAbove(node.id),
    openDepth: state.openDepth - 1,
  })
}

export function applyToken(state: BuildState, token: Token): Placement {
  if (state.cursor.kind === 'above-root') {
    return reject('NDB004', token.range)
  }

  const node = findNode(state.tree, state.cursor.nodeId)

  if (node === undefined) {
    throw new Error(`The cursor points at ${state.cursor.nodeId}, which is not in the tree`)
  }

  switch (token.kind) {
    case 'open-paren':
      return openGroup(state, node, token.range)
    case 'variable':
      return placeVariable(state, node, token)
    case 'negation':
      return placeNegation(state, node, token.range)
    case 'connective':
      return placeConnective(state, node, token)
    case 'close-paren':
      return closeNode(state, node, token.range)
  }
}
