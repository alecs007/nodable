import { type TreeNode, childrenOf } from '@nodable/engine'
import { nodeLabel } from './labels'

const BRANCH = '├── '
const LAST_BRANCH = '└── '
const TRUNK = '│   '
const SPACER = '    '

function renderChildren(node: TreeNode, prefix: string): readonly string[] {
  const children = childrenOf(node)

  return children.flatMap((child, index) => {
    const isLast = index === children.length - 1

    return [
      `${prefix}${isLast ? LAST_BRANCH : BRANCH}${nodeLabel(child)}`,
      ...renderChildren(child, `${prefix}${isLast ? SPACER : TRUNK}`),
    ]
  })
}

export function toText(root: TreeNode): string {
  return [nodeLabel(root), ...renderChildren(root, '')].join('\n')
}
