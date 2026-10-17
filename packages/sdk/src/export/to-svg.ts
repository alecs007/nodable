import { type NodeId, type TreeNode } from '@nodable/engine'
import { type LayoutNode, type TreeLayout } from '../layout/layout-tree'
import { nodeLabel } from './labels'

const STYLE = `
  .nodable-surface { fill: #ffffff }
  .nodable-edge { stroke: #5b6b7c; stroke-width: 1.5; fill: none }
  .nodable-box { fill: #ffffff; stroke: #1f2933; stroke-width: 1.5; rx: 8 }
  .nodable-box-slot { fill: none; stroke-dasharray: 4 4; stroke: #8595a6 }
  .nodable-box-leaf { fill: #eef4fb }
  .nodable-label { font: 500 18px system-ui, sans-serif; fill: #1f2933; text-anchor: middle }
  .nodable-title { font: 600 18px ui-monospace, consolas, monospace; fill: #1f2933; text-anchor: middle }
  .nodable-caption { font: 500 13px system-ui, sans-serif; fill: #5b6b7c; text-anchor: middle }
  .nodable-frame { fill: none; stroke: #c9d2dc; stroke-width: 1; stroke-dasharray: 4 4; rx: 16 }
  .nodable-cursor { fill: #c1452b }
`.trim()

const TITLE_HEIGHT = 44
const CAPTION_HEIGHT = 26
const PANEL_GAP = 40
const MARGIN = 24

export type SvgPanel = {
  readonly layout: TreeLayout
  readonly caption: string
  readonly unlabelled: readonly NodeId[]
}

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

function renderNode(entry: LayoutNode, panel: SvgPanel): readonly string[] {
  const { nodeWidth, nodeHeight } = panel.layout.options
  const x = entry.center.x - nodeWidth / 2
  const y = entry.center.y - nodeHeight / 2
  const box = `<rect class="${boxClass(entry.node)}" x="${String(x)}" y="${String(y)}" width="${String(nodeWidth)}" height="${String(nodeHeight)}" />`
  const isLabelled =
    entry.node.kind !== 'slot' &&
    entry.node.kind !== 'group' &&
    !panel.unlabelled.includes(entry.id)

  if (!isLabelled) {
    return [box]
  }

  return [
    box,
    `<text class="nodable-label" x="${String(entry.center.x)}" y="${String(entry.center.y + 6)}">${escapeText(nodeLabel(entry.node))}</text>`,
  ]
}

function renderCursor(layout: TreeLayout): readonly string[] {
  if (layout.cursor.isAboveRoot) {
    return []
  }

  const { anchor } = layout.cursor
  const arrow = `M ${String(anchor.x)} ${String(anchor.y)} l 11 -7 v 4 h 13 v 6 h -13 v 4 z`

  return [`<path class="nodable-cursor" d="${arrow}" />`]
}

function renderPanel(panel: SvgPanel, offsetX: number, offsetY: number): readonly string[] {
  const { layout } = panel
  const hasCaption = panel.caption !== ''
  const top = hasCaption ? CAPTION_HEIGHT : 0
  const caption = hasCaption
    ? [
        `<rect class="nodable-frame" x="0" y="0" width="${String(layout.width)}" height="${String(layout.height + top)}" />`,
        `<text class="nodable-caption" x="${String(layout.width / 2)}" y="18">${escapeText(panel.caption)}</text>`,
      ]
    : []

  const edges = layout.edges.map(
    (edge) =>
      `<line class="nodable-edge" x1="${String(edge.from.x)}" y1="${String(edge.from.y)}" x2="${String(edge.to.x)}" y2="${String(edge.to.y)}" />`,
  )

  return [
    `<g transform="translate(${String(offsetX)}, ${String(offsetY)})">`,
    ...caption,
    `<g transform="translate(0, ${String(top)})">`,
    ...edges,
    ...layout.nodes.flatMap((entry) => renderNode(entry, panel)),
    ...renderCursor(layout),
    '</g>',
    '</g>',
  ]
}

function panelHeight(panel: SvgPanel): number {
  return panel.layout.height + (panel.caption === '' ? 0 : CAPTION_HEIGHT)
}

export type SvgDrawing = {
  readonly markup: string
  readonly width: number
  readonly height: number
}

export function drawSvg(panels: readonly SvgPanel[], title = ''): SvgDrawing {
  const widths = panels.map((panel) => panel.layout.width)
  const board = widths.reduce((total, width) => total + width, 0) + PANEL_GAP * (panels.length - 1)
  const tallest = Math.max(...panels.map(panelHeight))
  const top = title === '' ? MARGIN : MARGIN + TITLE_HEIGHT
  const width = board + MARGIN * 2
  const height = top + tallest + MARGIN

  const heading =
    title === ''
      ? []
      : [
          `<text class="nodable-title" x="${String(width / 2)}" y="${String(MARGIN + 22)}">${escapeText(title)}</text>`,
        ]

  let cursor = MARGIN

  const drawn = panels.flatMap((panel) => {
    const markup = renderPanel(panel, cursor, top + (tallest - panelHeight(panel)) / 2)
    cursor += panel.layout.width + PANEL_GAP

    return markup
  })

  const markup = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${String(width)}" height="${String(height)}" viewBox="0 0 ${String(width)} ${String(height)}">`,
    `<style>${STYLE}</style>`,
    `<rect class="nodable-surface" width="100%" height="100%" />`,
    ...heading,
    ...drawn,
    '</svg>',
  ].join('\n')

  return { markup, width, height }
}

export function toSvg(panels: readonly SvgPanel[], title = ''): string {
  return drawSvg(panels, title).markup
}
