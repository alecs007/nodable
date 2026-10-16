import { describe, expect, it } from 'vitest'
import {
  type BuildResult,
  type Cursor,
  type TreeNode,
  buildTree,
  findNode,
  tokenize,
} from '../../src/index'

function build(input: string): BuildResult {
  return buildTree(tokenize(input).tokens)
}

function cursorOf(input: string): Cursor {
  return build(input).cursor
}

function nodeAt(input: string, id: string): TreeNode | undefined {
  return findNode(build(input).tree, id)
}

function codes(input: string): readonly string[] {
  return build(input).diagnostics.map((diagnostic) => diagnostic.code)
}

describe('buildTree', () => {
  it('starts with a single root slot and the cursor on it', () => {
    const result = build('')

    expect(result.tree).toEqual({ kind: 'slot', id: 'root' })
    expect(result.cursor).toEqual({ kind: 'node', nodeId: 'root' })
    expect(result.steps).toHaveLength(1)
    expect(result.steps[0]).toMatchObject({ index: 0, token: null })
  })

  it('records one step per accepted token', () => {
    expect(build('(p ∧ q)').steps).toHaveLength(6)
  })

  describe('open parenthesis', () => {
    it('turns the current slot into a group and moves the cursor down', () => {
      expect(nodeAt('(', 'root')).toMatchObject({ kind: 'group', isClosed: false })
      expect(nodeAt('(', 'root.0')).toEqual({ kind: 'slot', id: 'root.0' })
      expect(cursorOf('(')).toEqual({ kind: 'node', nodeId: 'root.0' })
    })

    it('is rejected when the cursor is not on a slot', () => {
      expect(codes('(p(')).toEqual(['NDB002'])
    })
  })

  describe('variable', () => {
    it('fills the slot as a leaf and moves the cursor up', () => {
      expect(nodeAt('(p', 'root.0')).toEqual({ kind: 'leaf', id: 'root.0', name: 'p' })
      expect(cursorOf('(p')).toEqual({ kind: 'node', nodeId: 'root' })
    })

    it('completes the formula when it fills the root slot', () => {
      expect(nodeAt('p', 'root')).toEqual({ kind: 'leaf', id: 'root', name: 'p' })
      expect(cursorOf('p')).toEqual({ kind: 'above-root' })
    })

    it('leaves the parent group pending until the next token decides it', () => {
      expect(nodeAt('(p', 'root')).toMatchObject({ kind: 'group' })
    })

    it('is rejected when the cursor is not on a slot', () => {
      expect(codes('(pp')).toEqual(['NDB002'])
    })
  })

  describe('negation', () => {
    it('resolves the parent group to a single node and keeps the cursor on the child slot', () => {
      expect(nodeAt('(¬', 'root')).toMatchObject({ kind: 'unary', symbol: '¬', isClosed: false })
      expect(cursorOf('(¬')).toEqual({ kind: 'node', nodeId: 'root.0' })
    })

    it('is rejected when it does not follow an open parenthesis', () => {
      expect(codes('¬p')).toEqual(['NDB005'])
      expect(codes('(p ∧ ¬q)')).toEqual(['NDB005'])
    })

    it('is rejected on the second operand slot of a binary node', () => {
      expect(codes('(p ∧ ¬')).toEqual(['NDB005'])
    })
  })

  describe('binary connective', () => {
    it('resolves the group to a double node and moves the cursor down', () => {
      expect(nodeAt('(p ∧', 'root')).toMatchObject({ kind: 'binary', symbol: '∧', isClosed: false })
      expect(nodeAt('(p ∧', 'root.1')).toEqual({ kind: 'slot', id: 'root.1' })
      expect(cursorOf('(p ∧')).toEqual({ kind: 'node', nodeId: 'root.1' })
    })

    it('keeps the first operand as the left child', () => {
      expect(nodeAt('(p ∧', 'root.0')).toEqual({ kind: 'leaf', id: 'root.0', name: 'p' })
    })

    it('reports a missing left operand when the cursor is on a slot', () => {
      expect(codes('(∧')).toEqual(['NDB006'])
    })

    it('is rejected when the cursor is on a node that is not a group', () => {
      expect(codes('(¬p ∧')).toEqual(['NDB002'])
    })
  })

  describe('close parenthesis', () => {
    it('closes a single node and moves the cursor up', () => {
      expect(nodeAt('(¬p)', 'root')).toMatchObject({ kind: 'unary', isClosed: true })
      expect(cursorOf('(¬p)')).toEqual({ kind: 'above-root' })
    })

    it('closes a double node and moves the cursor up', () => {
      expect(nodeAt('(p ∧ q)', 'root')).toMatchObject({ kind: 'binary', isClosed: true })
      expect(cursorOf('(p ∧ q)')).toEqual({ kind: 'above-root' })
    })

    it('closes a nested node and moves the cursor to its parent', () => {
      expect(nodeAt('((¬p)', 'root.0')).toMatchObject({ kind: 'unary', isClosed: true })
      expect(cursorOf('((¬p)')).toEqual({ kind: 'node', nodeId: 'root' })
    })

    it('reports an unmatched close parenthesis', () => {
      expect(codes(')')).toEqual(['NDB003'])
    })

    it('is rejected while a slot is still empty', () => {
      expect(codes('(p ∧ )')).toEqual(['NDB002'])
      expect(codes('()')).toEqual(['NDB002'])
    })
  })

  describe('completion', () => {
    it('rejects any token after the formula is complete', () => {
      expect(codes('p q')).toEqual(['NDB004'])
      expect(codes('(p ∧ q))')).toEqual(['NDB004'])
    })

    it('keeps the last valid tree when a token is rejected', () => {
      const result = build('(p ∧ q))')

      expect(result.steps).toHaveLength(6)
      expect(result.tree).toMatchObject({ kind: 'binary', isClosed: true })
    })

    it('stops applying tokens after the first error', () => {
      expect(codes(')))')).toEqual(['NDB003'])
    })
  })

  describe('worked example', () => {
    it('replays the example from the course notes', () => {
      expect(build('((¬p) ∨ q)').steps.map((step) => step.cursor)).toEqual([
        { kind: 'node', nodeId: 'root' },
        { kind: 'node', nodeId: 'root.0' },
        { kind: 'node', nodeId: 'root.0.0' },
        { kind: 'node', nodeId: 'root.0.0' },
        { kind: 'node', nodeId: 'root.0' },
        { kind: 'node', nodeId: 'root' },
        { kind: 'node', nodeId: 'root.1' },
        { kind: 'node', nodeId: 'root' },
        { kind: 'above-root' },
      ])
    })

    it('reports no diagnostics', () => {
      expect(build('((¬p) ∨ q)').diagnostics).toEqual([])
    })

    it('produces the expected tree', () => {
      expect(build('((¬p) ∨ q)').tree).toEqual({
        kind: 'binary',
        id: 'root',
        symbol: '∨',
        isClosed: true,
        left: {
          kind: 'unary',
          id: 'root.0',
          symbol: '¬',
          isClosed: true,
          child: { kind: 'leaf', id: 'root.0.0', name: 'p' },
        },
        right: { kind: 'leaf', id: 'root.1', name: 'q' },
      })
    })
  })

  it('accepts a group closed around a single operand', () => {
    expect(nodeAt('(p)', 'root')).toMatchObject({ kind: 'group', isClosed: true })
    expect(cursorOf('(p)')).toEqual({ kind: 'above-root' })
  })

  it('builds a deeply nested formula', () => {
    const result = build('((¬p) ∨ (q → r))')

    expect(result.diagnostics).toEqual([])
    expect(result.cursor).toEqual({ kind: 'above-root' })
    expect(findNode(result.tree, 'root.1')).toMatchObject({ kind: 'binary', symbol: '→' })
  })
})
