import { describe, expect, it } from 'vitest'
import {
  assignVariable,
  classifySession,
  clearInterpretation,
  createSession,
  evaluateSession,
  getVariables,
  restoreSession,
  setInterpretation,
  updateInput,
} from '../../src/index'

describe('getVariables', () => {
  it('lists the variables of the formula in order of appearance', () => {
    expect(getVariables(createSession('((r ∧ p) → r)'))).toEqual(['r', 'p'])
  })
})

describe('assignVariable', () => {
  it('starts every session without an interpretation', () => {
    expect(createSession('p').interpretation).toEqual({})
  })

  it('sets the truth value of a variable', () => {
    const session = assignVariable(createSession('(p ∧ q)'), 'p', true)

    expect(session.interpretation).toEqual({ p: true })
  })

  it('replaces an earlier value', () => {
    const session = assignVariable(assignVariable(createSession('p'), 'p', true), 'p', false)

    expect(session.interpretation).toEqual({ p: false })
  })

  it('forgets a value when it is given none', () => {
    const session = assignVariable(assignVariable(createSession('p'), 'p', true), 'p', undefined)

    expect(session.interpretation).toEqual({})
  })

  it('keeps the values when the formula changes', () => {
    const session = updateInput(assignVariable(createSession('p'), 'p', true), '(p ∨ q)')

    expect(session.interpretation).toEqual({ p: true })
  })
})

describe('clearInterpretation', () => {
  it('forgets every value', () => {
    const session = assignVariable(createSession('(p ∧ q)'), 'q', false)

    expect(clearInterpretation(session).interpretation).toEqual({})
  })
})

describe('restoreSession', () => {
  it('restores a stored interpretation', () => {
    const session = restoreSession('a', '(p → q)', {}, '', { p: true, q: false })

    expect(evaluateSession(session).value).toBe(false)
  })
})

describe('evaluateSession', () => {
  it('evaluates the formula under the interpretation of the session', () => {
    const session = assignVariable(
      assignVariable(createSession('((¬p) ∨ q)'), 'p', false),
      'q',
      false,
    )

    expect(evaluateSession(session)).toMatchObject({
      value: true,
      values: { root: true, 'root.0': true, 'root.0.0': false, 'root.1': false },
    })
  })

  it('has no value until every variable is assigned', () => {
    expect(evaluateSession(assignVariable(createSession('(p ∧ q)'), 'p', true)).value).toBe(
      undefined,
    )
  })
})

describe('setInterpretation', () => {
  it('replaces every value at once', () => {
    const session = setInterpretation(assignVariable(createSession('(p ∧ q)'), 'p', true), {
      q: false,
    })

    expect(session.interpretation).toEqual({ q: false })
  })
})

describe('classifySession', () => {
  it('classifies the formula of the session', () => {
    expect(classifySession(createSession('(p ∨ (¬p))'))?.kind).toBe('valid')
  })

  it('has no classification while the formula is unfinished', () => {
    expect(classifySession(createSession('(p ∨'))).toBeUndefined()
  })
})
