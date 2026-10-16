import {
  CONJUNCTION,
  cursorAt,
  type GroupNode,
  NEGATION,
  type NodeId,
  type TreeNode,
  collectNodes,
  createSlot,
  replaceNode,
  secondChildId,
} from '@nodable/engine'
import { type TreeSnapshot } from './session'

export type VariantKind = 'double' | 'single'

export type FormulaVariant = {
  readonly kind: VariantKind
  readonly snapshot: TreeSnapshot
  readonly pending: readonly NodeId[]
}

function pendingGroups(root: TreeNode): readonly GroupNode[] {
  return collectNodes(root).filter(
    (node): node is GroupNode => node.kind === 'group' && !node.isClosed,
  )
}

function asDouble(group: GroupNode): TreeNode {
  return {
    kind: 'binary',
    id: group.id,
    symbol: CONJUNCTION,
    isClosed: false,
    left: group.first,
    right: createSlot(secondChildId(group.id)),
  }
}

function asSingle(group: GroupNode): TreeNode {
  return {
    kind: 'unary',
    id: group.id,
    symbol: NEGATION,
    isClosed: false,
    child: group.first,
  }
}

export function pendingVariants(snapshot: TreeSnapshot): readonly FormulaVariant[] {
  const groups = pendingGroups(snapshot.root)

  if (groups.length === 0) {
    return []
  }

  const undecided = groups.find((group) => group.first.kind === 'slot')
  const pending = groups.map((group) => group.id)

  const settled = groups
    .filter((group) => group.first.kind !== 'slot')
    .reduce<TreeNode>((tree, group) => replaceNode(tree, group.id, asDouble(group)), snapshot.root)

  if (undecided === undefined) {
    return [{ kind: 'double', snapshot: { ...snapshot, root: settled }, pending }]
  }

  return [
    {
      kind: 'double',
      snapshot: { ...snapshot, root: replaceNode(settled, undecided.id, asDouble(undecided)) },
      pending,
    },
    {
      kind: 'single',
      snapshot: {
        ...snapshot,
        root: replaceNode(settled, undecided.id, asSingle(undecided)),
        cursor: cursorAt(undecided.id),
      },
      pending,
    },
  ]
}
