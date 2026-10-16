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
}

export const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
  nodeWidth: 72,
  nodeHeight: 44,
  horizontalGap: 28,
  verticalGap: 56,
  padding: 40,
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

export type LayoutCursor = {
  readonly isAboveRoot: boolean
  readonly target: Point
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

function placeNodes(root: TreeNode, offsets: NodeOffsets, options: LayoutOptions): PlacedNode[] {
  const roots = hierarchy<TreeNode>(root, (node) => [...childrenOf(node)])
  const layout = tree<TreeNode>().nodeSize([
    options.nodeWidth + options.horizontalGap,
    options.nodeHeight + options.verticalGap,
  ])

  const documentOrder = new Map(collectNodes(root).map((node, index) => [node.id, index]))

  return layout(roots)
    .descendants()
    .map((point) => {
      const shift = offsetOf(offsets, point.data.id)

      return {
        id: point.data.id,
        node: point.data,
        depth: point.depth,
        x: point.x + shift.x,
        y: point.y + shift.y,
        parentId: point.parent?.data.id,
      }
    })
    .toSorted(
      (left, right) => (documentOrder.get(left.id) ?? 0) - (documentOrder.get(right.id) ?? 0),
    )
}

function translationOf(placed: readonly PlacedNode[], options: LayoutOptions): Point {
  const halfWidth = options.nodeWidth / 2
  const left = Math.min(...placed.map((node) => node.x - halfWidth))
  const top = Math.min(...placed.map((node) => node.y - options.nodeHeight / 2))

  return { x: options.padding - left, y: options.padding + options.verticalGap - top }
}

function sizeOf(nodes: readonly LayoutNode[], options: LayoutOptions): Point {
  const right = Math.max(...nodes.map((node) => node.center.x + options.nodeWidth / 2))
  const bottom = Math.max(...nodes.map((node) => node.center.y + options.nodeHeight / 2))

  return { x: right + options.padding, y: bottom + options.padding }
}

function cursorOf(
  nodes: readonly LayoutNode[],
  cursor: Cursor,
  options: LayoutOptions,
): LayoutCursor {
  const rootCenter = nodes[0]?.center ?? { x: options.padding, y: options.padding }

  if (cursor.kind === 'above-root') {
    return {
      isAboveRoot: true,
      target: { x: rootCenter.x, y: rootCenter.y - options.verticalGap },
    }
  }

  const target = nodes.find((node) => node.id === cursor.nodeId)

  return { isAboveRoot: false, target: target?.center ?? rootCenter }
}

export function layoutTree(
  snapshot: TreeSnapshot,
  options: LayoutOptions = DEFAULT_LAYOUT_OPTIONS,
): TreeLayout {
  const placed = placeNodes(snapshot.root, snapshot.offsets, options)
  const translation = translationOf(placed, options)
  const centers = new Map<NodeId, Point>()

  const nodes: LayoutNode[] = placed.map((node) => {
    const center = { x: node.x + translation.x, y: node.y + translation.y }
    centers.set(node.id, center)

    return { id: node.id, node: node.node, depth: node.depth, center }
  })

  const edges: LayoutEdge[] = placed.flatMap((node) => {
    const from = node.parentId === undefined ? undefined : centers.get(node.parentId)
    const to = centers.get(node.id)

    return from === undefined || to === undefined ? [] : [{ id: node.id, from, to }]
  })

  const size = sizeOf(nodes, options)

  return {
    nodes,
    edges,
    cursor: cursorOf(nodes, snapshot.cursor, options),
    width: size.x,
    height: size.y,
    options,
  }
}
