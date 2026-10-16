import { type TreeNode } from '@nodable/engine'
import { type LayoutNode, type TreeLayout } from '../layout/layout-tree'
import { nodeLabel } from './labels'

const STYLE = `
  .nodable-surface { fill: #ffffff }
  .nodable-edge { stroke: #5b6b7c; stroke-width: 1.5; fill: none }
  .nodable-box { fill: #ffffff; stroke: #1f2933; stroke-width: 1.5; rx: 8 }
  .nodable-box-slot { fill: none; stroke-dasharray: 4 4; stroke: #8595a6 }
  .nodable-box-leaf { fill: #eef4fb }
  .nodable-label { font: 500 18px system-ui, sans-serif; fill: #1f2933; text-anchor: middle }
  .nodable-divider { stroke: #8595a6; stroke-width: 1; stroke-dasharray: 4 4 }
  .nodable-choice { font: 500 11px system-ui, sans-serif; fill: #5b6b7c; text-anchor: middle }
  .nodable-cursor { fill: #c1452b }
`.trim()

function escapeText(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function boxClass(node: TreeNode): string {
  switch (node.kind) {
    case 'slot':
      return 'nodable-box nodable-box-slot'
    case 'leaf':
      return 'nodable-box nodable-box-leaf'
    case 'group':
    case 'unary':
    case 'binary':
      return 'nodable-box'
  }
}

function renderNode(entry: LayoutNode, layout: TreeLayout): readonly string[] {
  const { nodeWidth, nodeHeight } = layout.options
  const x = entry.center.x - nodeWidth / 2
  const y = entry.center.y - nodeHeight / 2
  const box = `<rect class="${boxClass(entry.node)}" x="${String(x)}" y="${String(y)}" width="${String(nodeWidth)}" height="${String(nodeHeight)}" />`

  if (entry.node.kind === 'group') {
    return [
      box,
      `<line class="nodable-divider" x1="${String(entry.center.x)}" y1="${String(y)}" x2="${String(entry.center.x)}" y2="${String(y + nodeHeight)}" />`,
      `<text class="nodable-choice" x="${String(x + nodeWidth / 4)}" y="${String(entry.center.y + 5)}">A</text>`,
      `<text class="nodable-choice" x="${String(x + (nodeWidth * 3) / 4)}" y="${String(entry.center.y + 5)}">B</text>`,
    ]
  }

  if (entry.node.kind === 'slot') {
    return [box]
  }

  return [
    box,
    `<text class="nodable-label" x="${String(entry.center.x)}" y="${String(entry.center.y + 6)}">${escapeText(nodeLabel(entry.node))}</text>`,
  ]
}

function renderCursor(layout: TreeLayout): string {
  const { anchor, direction } = layout.cursor
  const body =
    direction === 'left' ? 'l 11 -7 v 4 h 13 v 6 h -13 v 4 z' : 'l -7 11 h 4 v 13 h 6 v -13 h 4 z'
  const arrow = `M ${String(anchor.x)} ${String(anchor.y)} ${body}`

  return `<path class="nodable-cursor" d="${arrow}" />`
}

export function toSvg(layout: TreeLayout): string {
  const edges = layout.edges.map(
    (edge) =>
      `<line class="nodable-edge" x1="${String(edge.from.x)}" y1="${String(edge.from.y)}" x2="${String(edge.to.x)}" y2="${String(edge.to.y)}" />`,
  )
  const nodes = layout.nodes.flatMap((entry) => renderNode(entry, layout))

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${String(layout.width)}" height="${String(layout.height)}" viewBox="0 0 ${String(layout.width)} ${String(layout.height)}">`,
    `<style>${STYLE}</style>`,
    `<rect class="nodable-surface" width="100%" height="100%" />`,
    ...edges,
    ...nodes,
    renderCursor(layout),
    '</svg>',
  ].join('\n')
}
