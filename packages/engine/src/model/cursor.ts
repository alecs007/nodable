import { type NodeId, parentId } from './node-id'

export type Cursor =
  { readonly kind: 'node'; readonly nodeId: NodeId } | { readonly kind: 'above-root' }

export const ABOVE_ROOT: Cursor = { kind: 'above-root' }

export function cursorAt(nodeId: NodeId): Cursor {
  return { kind: 'node', nodeId }
}

export function cursorAbove(nodeId: NodeId): Cursor {
  const parent = parentId(nodeId)

  return parent === undefined ? ABOVE_ROOT : cursorAt(parent)
}

export function isComplete(cursor: Cursor): boolean {
  return cursor.kind === 'above-root'
}

export function cursorNodeId(cursor: Cursor): NodeId | undefined {
  return cursor.kind === 'node' ? cursor.nodeId : undefined
}
