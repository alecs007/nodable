import {
  CONJUNCTION,
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
  readonly workingId: NodeId
  readonly isLabelKnown: boolean
}

function pendingGroupOf(root: TreeNode): GroupNode | undefined {
  return collectNodes(root).find(
    (node): node is GroupNode => node.kind === 'group' && !node.isClosed,
  )
}

export function pendingVariants(snapshot: TreeSnapshot): readonly FormulaVariant[] {
  const group = pendingGroupOf(snapshot.root)

  if (group === undefined) {
    return []
  }

  const asDouble: TreeNode = {
    kind: 'binary',
    id: group.id,
    symbol: CONJUNCTION,
    isClosed: false,
    left: group.first,
    right: createSlot(secondChildId(group.id)),
  }

  const asSingle: TreeNode = {
    kind: 'unary',
    id: group.id,
    symbol: NEGATION,
    isClosed: false,
    child: group.first,
  }

  const double: FormulaVariant = {
    kind: 'double',
    snapshot: { ...snapshot, root: replaceNode(snapshot.root, group.id, asDouble) },
    workingId: group.id,
    isLabelKnown: false,
  }

  if (group.first.kind !== 'slot') {
    return [double]
  }

  return [
    double,
    {
      kind: 'single',
      snapshot: { ...snapshot, root: replaceNode(snapshot.root, group.id, asSingle) },
      workingId: group.id,
      isLabelKnown: true,
    },
  ]
}
