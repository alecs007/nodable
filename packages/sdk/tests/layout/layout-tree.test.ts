import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LAYOUT_OPTIONS,
  createSession,
  getTree,
  layoutTree,
  moveNode,
} from '../../src/index'

describe('layoutTree', () => {
  it('places one entry per node', () => {
    const layout = layoutTree(getTree(createSession('((¬p) ∨ q)')))

    expect(layout.nodes.map((entry) => entry.id)).toEqual(['root', 'root.0', 'root.0.0', 'root.1'])
  })

  it('connects every node to its parent', () => {
    const layout = layoutTree(getTree(createSession('(p ∧ q)')))

    expect(layout.edges.map((edge) => edge.id)).toEqual(['root.0', 'root.1'])
  })

  it('puts children below their parent', () => {
    const layout = layoutTree(getTree(createSession('(p ∧ q)')))
    const [root, left] = layout.nodes

    expect(left?.center.y).toBeGreaterThan(root?.center.y ?? 0)
  })

  it('keeps the whole tree inside the reported size', () => {
    const layout = layoutTree(getTree(createSession('((¬p) ∨ (q → r))')))
    const half = DEFAULT_LAYOUT_OPTIONS.nodeWidth / 2

    for (const entry of layout.nodes) {
      expect(entry.center.x - half).toBeGreaterThanOrEqual(0)
      expect(entry.center.x + half).toBeLessThanOrEqual(layout.width)
      expect(entry.center.y).toBeLessThanOrEqual(layout.height)
    }
  })

  it('applies the stored offset of a node', () => {
    const session = createSession('(p ∧ q)')
    const moved = moveNode(session, 'root.1', { x: 30, y: 10 })
    const before = layoutTree(getTree(session)).nodes[2]
    const after = layoutTree(getTree(moved)).nodes[2]

    expect((after?.center.x ?? 0) - (before?.center.x ?? 0)).toBe(30)
    expect((after?.center.y ?? 0) - (before?.center.y ?? 0)).toBe(10)
  })

  it('leaves the other nodes where they were when one node is moved', () => {
    const session = createSession('(p ∧ q)')
    const moved = moveNode(session, 'root.0', { x: -120, y: -40 })
    const before = layoutTree(getTree(session))
    const after = layoutTree(getTree(moved))

    expect(after.nodes[0]?.center).toEqual(before.nodes[0]?.center)
    expect(after.nodes[2]?.center).toEqual(before.nodes[2]?.center)
  })

  it('never shrinks below the size of the untouched layout', () => {
    const session = createSession('(p ∧ q)')
    const moved = moveNode(session, 'root.1', { x: -200, y: -80 })

    expect(layoutTree(getTree(moved)).width).toBe(layoutTree(getTree(session)).width)
  })

  it('points the cursor at the node it is on, from its right side', () => {
    const layout = layoutTree(getTree(createSession('(p ∧')))
    const target = layout.nodes.find((entry) => entry.id === 'root.1')

    expect(layout.cursor.isAboveRoot).toBe(false)
    expect(layout.cursor.direction).toBe('left')
    expect(layout.cursor.pointsAt).toEqual(target?.center)
    expect(layout.cursor.anchor.y).toBe(target?.center.y)
    expect(layout.cursor.anchor.x).toBeGreaterThan(target?.center.x ?? 0)
  })

  it('keeps the cursor arrow inside the drawing', () => {
    const layout = layoutTree(getTree(createSession('(p ∧')))

    expect(layout.cursor.anchor.x + layout.options.cursorLength).toBeLessThanOrEqual(layout.width)
    expect(layout.cursor.anchor.y).toBeGreaterThan(0)
  })

  it('points the cursor above the root once the formula is complete', () => {
    const layout = layoutTree(getTree(createSession('(p ∧ q)')))
    const [root] = layout.nodes

    expect(layout.cursor.isAboveRoot).toBe(true)
    expect(layout.cursor.direction).toBe('up')
    expect(layout.cursor.anchor.y).toBeGreaterThan(0)
    expect(layout.cursor.anchor.y).toBeLessThan(root?.center.y ?? 0)
  })

  it('accepts custom spacing', () => {
    const options = { ...DEFAULT_LAYOUT_OPTIONS, nodeWidth: 120 }
    const layout = layoutTree(getTree(createSession('(p ∧ q)')), options)

    expect(layout.options.nodeWidth).toBe(120)
    expect(layout.width).toBeGreaterThan(layoutTree(getTree(createSession('(p ∧ q)'))).width)
  })
})
