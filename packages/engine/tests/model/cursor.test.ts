import { describe, expect, it } from 'vitest'
import {
  ABOVE_ROOT,
  ROOT_ID,
  cursorAbove,
  cursorAt,
  cursorNodeId,
  isComplete,
} from '../../src/index'

describe('cursor', () => {
  it('points at a node', () => {
    expect(cursorAt('root.0')).toEqual({ kind: 'node', nodeId: 'root.0' })
  })

  it('moves up to the parent node', () => {
    expect(cursorAbove('root.1.0')).toEqual({ kind: 'node', nodeId: 'root.1' })
  })

  it('moves above the root when leaving the root node', () => {
    expect(cursorAbove(ROOT_ID)).toEqual(ABOVE_ROOT)
  })

  it('treats a cursor above the root as a complete formula', () => {
    expect(isComplete(ABOVE_ROOT)).toBe(true)
    expect(isComplete(cursorAt(ROOT_ID))).toBe(false)
  })

  it('exposes the node identifier only while inside the tree', () => {
    expect(cursorNodeId(cursorAt('root.0'))).toBe('root.0')
    expect(cursorNodeId(ABOVE_ROOT)).toBeUndefined()
  })
})
