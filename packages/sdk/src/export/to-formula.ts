import { NEGATION, type TreeNode } from '@nodable/engine'
import { SLOT_LABEL } from './labels'

export function formulaOf(node: TreeNode): string {
  switch (node.kind) {
    case 'leaf':
      return node.name
    case 'unary':
      return `(${NEGATION}${formulaOf(node.child)})`
    case 'binary':
      return `(${formulaOf(node.left)} ${node.symbol} ${formulaOf(node.right)})`
    case 'group':
      return `(${formulaOf(node.first)} ${SLOT_LABEL})`
    case 'slot':
      return SLOT_LABEL
  }
}
