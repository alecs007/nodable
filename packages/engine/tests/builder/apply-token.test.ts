import { describe, expect, it } from 'vitest'
import {
  type BuildState,
  type Placement,
  applyToken,
  buildTree,
  createBuildState,
  createSlot,
  cursorAt,
  tokenize,
} from '../../src/index'

function stateAfter(input: string): BuildState {
  const result = buildTree(tokenize(input).tokens)

  return { tree: result.tree, cursor: result.cursor, openDepth: 1 }
}

function place(state: BuildState, input: string): Placement {
  const [token] = tokenize(input).tokens

  if (token === undefined) {
    throw new Error(`expected one token for ${input}`)
  }

  return applyToken(state, token)
}

describe('applyToken', () => {
  it('rejects a negation when the cursor is not on a slot', () => {
    expect(place(stateAfter('(p'), '¬')).toEqual({
      kind: 'rejected',
      diagnostic: {
        code: 'NDB005',
        severity: 'error',
        range: { start: 0, end: 1 },
        messageKey: 'diagnostic.ndb005',
      },
    })
  })

  it('rejects a connective when the first operand of the group is not complete', () => {
    const pending = stateAfter('(')
    const state: BuildState = { ...pending, cursor: cursorAt('root') }

    expect(place(state, '∧')).toMatchObject({ kind: 'rejected', diagnostic: { code: 'NDB002' } })
  })

  it('rejects a negation when the parent of the slot is not in the tree', () => {
    const state: BuildState = {
      tree: createSlot('root.0'),
      cursor: cursorAt('root.0'),
      openDepth: 1,
    }

    expect(place(state, '¬')).toMatchObject({ kind: 'rejected', diagnostic: { code: 'NDB005' } })
  })

  it('throws when the cursor points outside the tree', () => {
    const state: BuildState = { ...createBuildState(), cursor: cursorAt('root.7') }

    expect(() => place(state, 'p')).toThrow('root.7')
  })
})
