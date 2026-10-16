import {
  CONJUNCTION,
  type Connective,
  DISJUNCTION,
  EQUIVALENCE,
  IMPLICATION,
  type TreeNode,
  childrenOf,
} from '@nodable/engine'

const CONNECTIVE_COMMANDS: Record<Connective, string> = {
  [CONJUNCTION]: '\\land',
  [DISJUNCTION]: '\\lor',
  [IMPLICATION]: '\\rightarrow',
  [EQUIVALENCE]: '\\leftrightarrow',
}

const PREAMBLE = 'for tree={draw, rounded corners, s sep=6mm, l sep=8mm, align=center}'

function latexLabel(node: TreeNode): string {
  switch (node.kind) {
    case 'slot':
      return '\\square'
    case 'group':
      return '(\\,)'
    case 'unary':
      return '\\lnot'
    case 'binary':
      return CONNECTIVE_COMMANDS[node.symbol]
    case 'leaf':
      return node.name
  }
}

function renderNode(node: TreeNode, indent: string): readonly string[] {
  const children = childrenOf(node)
  const head = `${indent}[{$${latexLabel(node)}$}`

  if (children.length === 0) {
    return [`${head}]`]
  }

  return [head, ...children.flatMap((child) => renderNode(child, `${indent}  `)), `${indent}]`]
}

export function toLatex(root: TreeNode): string {
  return ['\\begin{forest}', PREAMBLE, ...renderNode(root, ''), '\\end{forest}'].join('\n')
}
