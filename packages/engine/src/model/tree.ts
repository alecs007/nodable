import { childId, isDescendantId, type NodeId, ROOT_ID } from './node-id'
import { type Connective, type Negation } from './symbols'

export type NodeKind = 'slot' | 'group' | 'unary' | 'binary' | 'leaf'

export type SlotNode = {
  readonly kind: 'slot'
  readonly id: NodeId
}

export type GroupNode = {
  readonly kind: 'group'
  readonly id: NodeId
  readonly isClosed: boolean
  readonly first: TreeNode
}

export type UnaryNode = {
  readonly kind: 'unary'
  readonly id: NodeId
  readonly symbol: Negation
  readonly isClosed: boolean
  readonly child: TreeNode
}

export type BinaryNode = {
  readonly kind: 'binary'
  readonly id: NodeId
  readonly symbol: Connective
  readonly isClosed: boolean
  readonly left: TreeNode
  readonly right: TreeNode
}

export type LeafNode = {
  readonly kind: 'leaf'
  readonly id: NodeId
  readonly name: string
}

export type TreeNode = SlotNode | GroupNode | UnaryNode | BinaryNode | LeafNode

export function createSlot(id: NodeId): SlotNode {
  return { kind: 'slot', id }
}

export function createRootSlot(): SlotNode {
  return createSlot(ROOT_ID)
}

export function childrenOf(node: TreeNode): readonly TreeNode[] {
  switch (node.kind) {
    case 'group':
      return [node.first]
    case 'unary':
      return [node.child]
    case 'binary':
      return [node.left, node.right]
    case 'slot':
    case 'leaf':
      return []
  }
}

export function isNodeComplete(node: TreeNode): boolean {
  switch (node.kind) {
    case 'leaf':
      return true
    case 'group':
    case 'unary':
    case 'binary':
      return node.isClosed
    case 'slot':
      return false
  }
}

export function areChildrenComplete(node: TreeNode): boolean {
  const children = childrenOf(node)

  return children.length > 0 && children.every(isNodeComplete)
}

export function findNode(root: TreeNode, id: NodeId): TreeNode | undefined {
  if (root.id === id) {
    return root
  }

  if (!isDescendantId(id, root.id)) {
    return undefined
  }

  for (const child of childrenOf(root)) {
    const found = findNode(child, id)

    if (found !== undefined) {
      return found
    }
  }

  return undefined
}

export function replaceNode(root: TreeNode, id: NodeId, next: TreeNode): TreeNode {
  if (root.id === id) {
    return next
  }

  if (!isDescendantId(id, root.id)) {
    return root
  }

  switch (root.kind) {
    case 'group':
      return { ...root, first: replaceNode(root.first, id, next) }
    case 'unary':
      return { ...root, child: replaceNode(root.child, id, next) }
    case 'binary':
      return {
        ...root,
        left: replaceNode(root.left, id, next),
        right: replaceNode(root.right, id, next),
      }
    case 'slot':
    case 'leaf':
      return root
  }
}

export function firstChildId(id: NodeId): NodeId {
  return childId(id, 0)
}

export function secondChildId(id: NodeId): NodeId {
  return childId(id, 1)
}

export function collectNodes(root: TreeNode): readonly TreeNode[] {
  return [root, ...childrenOf(root).flatMap(collectNodes)]
}

export function leavesOf(root: TreeNode): readonly LeafNode[] {
  return collectNodes(root).filter((node): node is LeafNode => node.kind === 'leaf')
}
