import { describe, expect, it } from 'vitest'
import {
  createSession,
  getAllowedNext,
  getDiagnostics,
  getStep,
  getSteps,
  getTree,
  moveNode,
  normalizeInput,
  renameSession,
  resetOffsets,
  restoreSession,
  updateInput,
} from '../../src/index'

describe('createSession', () => {
  it('starts empty with a unique identifier', () => {
    const first = createSession()
    const second = createSession()

    expect(first.input).toBe('')
    expect(first.id).not.toBe(second.id)
  })

  it('analyzes the input it is given', () => {
    expect(createSession('(p ∧ q)').analysis.isComplete).toBe(true)
  })
})

describe('updateInput', () => {
  it('re-analyzes the formula', () => {
    const session = updateInput(createSession(), '(p ∧ q)')

    expect(session.input).toBe('(p ∧ q)')
    expect(getDiagnostics(session)).toEqual([])
  })

  it('keeps the identifier and the offsets', () => {
    const session = moveNode(createSession('p'), 'root', { x: 10, y: 4 })
    const updated = updateInput(session, 'q')

    expect(updated.id).toBe(session.id)
    expect(updated.offsets).toEqual({ root: { x: 10, y: 4 } })
  })

  it('returns the same session when the input did not change', () => {
    const session = createSession('p')

    expect(updateInput(session, 'p')).toBe(session)
  })

  it('does not mutate the session it was given', () => {
    const session = createSession('p')
    updateInput(session, '(p ∧ q)')

    expect(session.input).toBe('p')
  })
})

describe('normalizeInput', () => {
  it('replaces aliases with canonical symbols', () => {
    expect(normalizeInput(createSession('(p -> q)')).input).toBe('(p → q)')
  })
})

describe('reading a session', () => {
  const session = createSession('(p ∧ q)')

  it('exposes the tree with the cursor and the offsets', () => {
    expect(getTree(session)).toMatchObject({
      cursor: { kind: 'above-root' },
      isComplete: true,
      offsets: {},
    })
  })

  it('exposes every build step', () => {
    expect(getSteps(session)).toHaveLength(6)
    expect(getStep(session, 0)).toMatchObject({ index: 0, token: null })
    expect(getStep(session, 99)).toBeUndefined()
  })

  it('exposes the diagnostics', () => {
    expect(getDiagnostics(createSession('(p ∧'))).toMatchObject([{ code: 'NDB007' }])
  })

  it('exposes the tokens allowed next', () => {
    expect(getAllowedNext(createSession('('))).toEqual(['open-paren', 'negation', 'variable'])
  })
})

describe('moveNode', () => {
  it('stores an offset for a node', () => {
    expect(moveNode(createSession('p'), 'root', { x: 8, y: -4 }).offsets).toEqual({
      root: { x: 8, y: -4 },
    })
  })

  it('drops the offset when the node is moved back to its place', () => {
    const moved = moveNode(createSession('p'), 'root', { x: 8, y: -4 })

    expect(moveNode(moved, 'root', { x: 0, y: 0 }).offsets).toEqual({})
  })

  it('does not mutate the session it was given', () => {
    const session = createSession('p')
    moveNode(session, 'root', { x: 8, y: -4 })

    expect(session.offsets).toEqual({})
  })
})

describe('resetOffsets', () => {
  it('removes every offset of the tree', () => {
    const moved = moveNode(createSession('(p ∧ q)'), 'root.0', { x: 8, y: 2 })

    expect(resetOffsets(moved).offsets).toEqual({})
  })
})

describe('renameSession', () => {
  it('starts without a name and takes one', () => {
    const session = createSession('p')

    expect(session.name).toBe('')
    expect(renameSession(session, 'Seminar 1').name).toBe('Seminar 1')
  })

  it('keeps the formula and the identifier', () => {
    const session = renameSession(createSession('p'), 'Seminar 1')

    expect(session.input).toBe('p')
  })
})

describe('restoreSession', () => {
  it('rebuilds the analysis from the stored input', () => {
    const session = restoreSession('saved-id', '(p ∧ q)', { root: { x: 1, y: 2 } })

    expect(session.id).toBe('saved-id')
    expect(session.analysis.isComplete).toBe(true)
    expect(session.offsets).toEqual({ root: { x: 1, y: 2 } })
  })
})
