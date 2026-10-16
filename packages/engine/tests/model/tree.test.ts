import { describe, expect, it } from 'vitest'
import {
  type BinaryNode,
  type GroupNode,
  type LeafNode,
  type TreeNode,
  type UnaryNode,
  CONJUNCTION,
  NEGATION,
  ROOT_ID,
  areChildrenComplete,
  childrenOf,
  collectNodes,
  createRootSlot,
  createSlot,
  findNode,
  firstChildId,
  isNodeComplete,
  leavesOf,
  replaceNode,
  secondChildId,
} from '../../src/index'

function leaf(id: string, name: string): LeafNode {
  return { kind: 'leaf', id, name }
}

const closedGroup: GroupNode = {
  kind: 'group',
  id: ROOT_ID,
  isClosed: true,
  first: leaf('root.0', 'p'),
}

const unary: UnaryNode = {
  kind: 'unary',
  id: ROOT_ID,
  symbol: NEGATION,
  isClosed: false,
  child: leaf('root.0', 'p'),
}

const binary: BinaryNode = {
  kind: 'binary',
  id: ROOT_ID,
  symbol: CONJUNCTION,
  isClosed: true,
  left: leaf('root.0', 'p'),
  right: createSlot('root.1'),
}

describe('tree nodes', () => {
  it('creates a root slot', () => {
    expect(createRootSlot()).toEqual({ kind: 'slot', id: ROOT_ID })
  })

  it('derives the child identifiers of a node', () => {
    expect(firstChildId(ROOT_ID)).toBe('root.0')
    expect(secondChildId(ROOT_ID)).toBe('root.1')
  })

  it('lists the children of each node kind', () => {
    expect(childrenOf(createRootSlot())).toEqual([])
    expect(childrenOf(leaf(ROOT_ID, 'p'))).toEqual([])
    expect(childrenOf(closedGroup)).toHaveLength(1)
    expect(childrenOf(unary)).toHaveLength(1)
    expect(childrenOf(binary)).toHaveLength(2)
  })

  it('treats a leaf as complete and a slot as incomplete', () => {
    expect(isNodeComplete(leaf(ROOT_ID, 'p'))).toBe(true)
    expect(isNodeComplete(createRootSlot())).toBe(false)
  })

  it('treats a group, unary or binary node as complete once it is closed', () => {
    expect(isNodeComplete(closedGroup)).toBe(true)
    expect(isNodeComplete({ ...closedGroup, isClosed: false })).toBe(false)
    expect(isNodeComplete(unary)).toBe(false)
    expect(isNodeComplete({ ...unary, isClosed: true })).toBe(true)
    expect(isNodeComplete(binary)).toBe(true)
  })

  it('reports whether every child is complete', () => {
    expect(areChildrenComplete(closedGroup)).toBe(true)
    expect(areChildrenComplete(binary)).toBe(false)
    expect(areChildrenComplete(createRootSlot())).toBe(false)
  })

  it('finds a node by its identifier', () => {
    expect(findNode(binary, 'root.0')).toEqual(leaf('root.0', 'p'))
    expect(findNode(binary, ROOT_ID)).toBe(binary)
  })

  it('returns nothing when the identifier is outside the subtree', () => {
    expect(findNode(binary, 'other.0')).toBeUndefined()
    expect(findNode(binary, 'root.5')).toBeUndefined()
    expect(findNode(leaf(ROOT_ID, 'p'), 'root.0')).toBeUndefined()
  })

  it('replaces a node and leaves the rest of the tree alone', () => {
    const replaced = replaceNode(binary, 'root.1', leaf('root.1', 'q'))

    expect(findNode(replaced, 'root.1')).toEqual(leaf('root.1', 'q'))
    expect(findNode(replaced, 'root.0')).toEqual(leaf('root.0', 'p'))
  })

  it('replaces the root itself', () => {
    const next = createRootSlot()

    expect(replaceNode(binary, ROOT_ID, next)).toBe(next)
  })

  it('returns the tree unchanged when the identifier does not belong to it', () => {
    expect(replaceNode(binary, 'other', createSlot('other'))).toBe(binary)
    expect(replaceNode(leaf(ROOT_ID, 'p'), 'root.0', createSlot('root.0'))).toEqual(
      leaf(ROOT_ID, 'p'),
    )
    expect(replaceNode(createRootSlot(), 'root.0', createSlot('root.0'))).toEqual(createRootSlot())
  })

  it('replaces a node inside a group and inside a unary node', () => {
    const inGroup = replaceNode(closedGroup, 'root.0', leaf('root.0', 'q'))
    const inUnary = replaceNode(unary, 'root.0', leaf('root.0', 'q'))

    expect(findNode(inGroup, 'root.0')).toEqual(leaf('root.0', 'q'))
    expect(findNode(inUnary, 'root.0')).toEqual(leaf('root.0', 'q'))
  })

  it('collects every node in document order', () => {
    const nodes: readonly TreeNode[] = collectNodes(binary)

    expect(nodes.map((node) => node.id)).toEqual([ROOT_ID, 'root.0', 'root.1'])
  })

  it('collects the leaves of a tree', () => {
    expect(leavesOf(binary)).toEqual([leaf('root.0', 'p')])
  })
})
