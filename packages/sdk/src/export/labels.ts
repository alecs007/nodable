import { type TreeNode } from '@nodable/engine'

export const SLOT_LABEL = '□'
export const GROUP_LABEL = '( )'

export function nodeLabel(node: TreeNode): string {
  switch (node.kind) {
    case 'slot':
      return SLOT_LABEL
    case 'group':
      return GROUP_LABEL
    case 'unary':
    case 'binary':
      return node.symbol
    case 'leaf':
      return node.name
  }
}
