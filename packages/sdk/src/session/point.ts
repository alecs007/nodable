import { type NodeId } from '@nodable/engine'

export type Point = {
  readonly x: number
  readonly y: number
}

export type NodeOffsets = Readonly<Record<NodeId, Point>>

export const ORIGIN: Point = { x: 0, y: 0 }

export function addPoints(first: Point, second: Point): Point {
  return { x: first.x + second.x, y: first.y + second.y }
}

export function isOrigin(point: Point): boolean {
  return point.x === 0 && point.y === 0
}
