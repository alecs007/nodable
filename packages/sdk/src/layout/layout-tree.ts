import { type Cursor, type NodeId, type TreeNode, childrenOf, collectNodes } from '@nodable/engine'
import { hierarchy, tree } from 'd3-hierarchy'
import { type NodeOffsets, type Point } from '../session/point'
import { type TreeSnapshot } from '../session/session'

export type LayoutOptions = {
  readonly nodeWidth: number
  readonly nodeHeight: number
  readonly horizontalGap: number
  readonly verticalGap: number
  readonly padding: number
  readonly cursorGap: number
  readonly cursorLength: number
}

export const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
  nodeWidth: 72,
  nodeHeight: 44,
  horizontalGap: 28,
  verticalGap: 56,
  padding: 40,
  cursorGap: 10,
  cursorLength: 26,
}

export type LayoutNode = {
  readonly id: NodeId
  readonly node: TreeNode
  readonly depth: number
  readonly center: Point
}

export type LayoutEdge = {
  readonly id: string
  readonly from: Point
  readonly to: Point
}

export type CursorDirection = 'left' | 'up'

export type LayoutCursor = {
  readonly isAboveRoot: boolean
  readonly direction: CursorDirection
  readonly pointsAt: Point
  readonly anchor: Point
}

export type TreeLayout = {
  readonly nodes: readonly LayoutNode[]
  readonly edges: readonly LayoutEdge[]
  readonly cursor: LayoutCursor
  readonly width: number
  readonly height: number
  readonly options: LayoutOptions
}

type PlacedNode = {
  readonly id: NodeId
  readonly node: TreeNode
  readonly depth: number
  readonly x: number
  readonly y: number
  readonly parentId: NodeId | undefined
}

function offsetOf(offsets: NodeOffsets, id: NodeId): Point {
  return offsets[id] ?? { x: 0, y: 0 }
}

function placeNodes(root: TreeNode, options: LayoutOptions): PlacedNode[] {
  const roots = hierarchy<TreeNode>(root, (node) => [...childrenOf(node)])
  const layout = tree<TreeNode>().nodeSize([
    options.nodeWidth + options.horizontalGap,
    options.nodeHeight + options.verticalGap,
  ])

  const documentOrder = new Map(collectNodes(root).map((node, index) => [node.id, index]))

  return layout(roots)
    .descendants()
    .map((point) => ({
      id: point.data.id,
      node: point.data,
      depth: point.depth,
      x: point.x,
      y: point.y,
      parentId: point.parent?.data.id,
    }))
    .toSorted(
      (left, right) => (documentOrder.get(left.id) ?? 0) - (documentOrder.get(right.id) ?? 0),
    )
}

function arrowSpace(options: LayoutOptions): number {
  return options.cursorGap + options.cursorLength
}

function translationOf(placed: readonly PlacedNode[], options: LayoutOptions): Point {
  const halfWidth = options.nodeWidth / 2
  const left = Math.min(...placed.map((node) => node.x - halfWidth))
  const top = Math.min(...placed.map((node) => node.y - options.nodeHeight / 2))

  return { x: options.padding + arrowSpace(options) - left, y: options.padding - top }
}

function clipToBox(from: Point, to: Point, options: LayoutOptions): Point {
  const dx = to.x - from.x
  const dy = to.y - from.y

  if (dx === 0 && dy === 0) {
    return from
  }

  const horizontal = dx === 0 ? Number.POSITIVE_INFINITY : options.nodeWidth / 2 / Math.abs(dx)
  const vertical = dy === 0 ? Number.POSITIVE_INFINITY : options.nodeHeight / 2 / Math.abs(dy)
  const ratio = Math.min(horizontal, vertical, 1)

  return { x: from.x + dx * ratio, y: from.y + dy * ratio }
}

function sizeOf(points: readonly Point[], options: LayoutOptions): Point {
  const right = Math.max(...points.map((point) => point.x + options.nodeWidth / 2))
  const bottom = Math.max(...points.map((point) => point.y + options.nodeHeight / 2))

  return { x: right + arrowSpace(options) + options.padding, y: bottom + options.padding }
}

function cursorOf(
  nodes: readonly LayoutNode[],
  cursor: Cursor,
  options: LayoutOptions,
): LayoutCursor {
  const rootCenter = nodes[0]?.center ?? { x: options.padding, y: options.padding }

  if (cursor.kind === 'above-root') {
    const above = rootCenter.y - options.nodeHeight / 2 - options.cursorGap

    return {
      isAboveRoot: true,
      direction: 'up',
      pointsAt: { x: rootCenter.x, y: above },
      anchor: { x: rootCenter.x, y: above - options.cursorLength },
    }
  }

  const center = nodes.find((node) => node.id === cursor.nodeId)?.center ?? rootCenter

  return {
    isAboveRoot: false,
    direction: 'left',
    pointsAt: center,
    anchor: { x: center.x + options.nodeWidth / 2 + options.cursorGap, y: center.y },
  }
}

export function layoutTree(
  snapshot: TreeSnapshot,
  options: LayoutOptions = DEFAULT_LAYOUT_OPTIONS,
): TreeLayout {
  const placed = placeNodes(snapshot.root, options)
  const translation = translationOf(placed, options)
  const centers = new Map<NodeId, Point>()

  const nodes: LayoutNode[] = placed.map((node) => {
    const shift = offsetOf(snapshot.offsets, node.id)
    const center = { x: node.x + translation.x + shift.x, y: node.y + translation.y + shift.y }
    centers.set(node.id, center)

    return { id: node.id, node: node.node, depth: node.depth, center }
  })

  const edges: LayoutEdge[] = placed.flatMap((node) => {
    const from = node.parentId === undefined ? undefined : centers.get(node.parentId)
    const to = centers.get(node.id)

    if (from === undefined || to === undefined) {
      return []
    }

    return [
      {
        id: node.id,
        from: clipToBox(from, to, options),
        to: clipToBox(to, from, options),
      },
    ]
  })

  const anchored = placed.map((node) => ({
    x: node.x + translation.x,
    y: node.y + translation.y,
  }))
  const cursor = cursorOf(nodes, snapshot.cursor, options)
  const size = sizeOf([...anchored, ...nodes.map((node) => node.center)], options)

  return {
    nodes,
    edges,
    cursor,
    width: size.x,
    height: size.y,
    options,
  }
}
