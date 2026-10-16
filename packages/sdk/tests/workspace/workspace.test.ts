import { describe, expect, it } from 'vitest'
import {
  type Workspace,
  addSession,
  createSession,
  createWorkspace,
  deserializeWorkspace,
  moveNode,
  removeSession,
  replaceSession,
  serializeWorkspace,
  updateInput,
} from '../../src/index'

function sample(): Workspace {
  const first = moveNode(createSession('((¬p) ∨ q)', 'First'), 'root.0', { x: 12, y: -6 })
  const second = createSession('(r → s)')

  return createWorkspace('Seminar 3', [first, second])
}

describe('createWorkspace', () => {
  it('starts with one empty session', () => {
    const workspace = createWorkspace()

    expect(workspace.sessions).toHaveLength(1)
    expect(workspace.sessions[0]?.input).toBe('')
  })

  it('takes a name and existing sessions', () => {
    expect(sample()).toMatchObject({ name: 'Seminar 3', version: 1 })
  })
})

describe('changing a workspace', () => {
  it('adds a session', () => {
    expect(addSession(sample(), createSession('t')).sessions).toHaveLength(3)
  })

  it('removes a session by identifier', () => {
    const workspace = sample()
    const [first] = workspace.sessions

    expect(removeSession(workspace, first?.id ?? '').sessions).toHaveLength(1)
  })

  it('replaces a session in place', () => {
    const workspace = sample()
    const [first] = workspace.sessions

    if (first === undefined) {
      throw new Error('expected a session')
    }

    const replaced = replaceSession(workspace, updateInput(first, 'p'))

    expect(replaced.sessions[0]?.input).toBe('p')
    expect(replaced.sessions[1]?.input).toBe('(r → s)')
  })
})

describe('serializeWorkspace', () => {
  it('writes only the data needed to rebuild the workspace', () => {
    const data: unknown = JSON.parse(serializeWorkspace(sample()))

    expect(data).toEqual({
      version: 1,
      name: 'Seminar 3',
      sessions: [
        {
          id: expect.any(String) as unknown,
          name: 'First',
          input: '((¬p) ∨ q)',
          offsets: { 'root.0': { x: 12, y: -6 } },
        },
        { id: expect.any(String) as unknown, name: '', input: '(r → s)', offsets: {} },
      ],
    })
  })
})

describe('deserializeWorkspace', () => {
  it('round-trips a workspace', () => {
    const workspace = sample()
    const result = deserializeWorkspace(serializeWorkspace(workspace))

    if (!result.ok) {
      throw new Error('expected the workspace to be read')
    }

    expect(result.value.name).toBe(workspace.name)
    expect(result.value.sessions.map((session) => session.input)).toEqual(['((¬p) ∨ q)', '(r → s)'])
    expect(result.value.sessions[0]?.offsets).toEqual({ 'root.0': { x: 12, y: -6 } })
    expect(result.value.sessions[0]?.id).toBe(workspace.sessions[0]?.id)
  })

  it('keeps the name of every session', () => {
    const result = deserializeWorkspace(serializeWorkspace(sample()))

    expect(result.ok && result.value.sessions[0]?.name).toBe('First')
  })

  it('rebuilds the analysis of every session', () => {
    const result = deserializeWorkspace(serializeWorkspace(sample()))

    expect(result.ok && result.value.sessions[0]?.analysis.isComplete).toBe(true)
  })

  it('falls back to a default name when none was stored', () => {
    const result = deserializeWorkspace('{"sessions":[]}')

    expect(result.ok && result.value.name).toBe('Workspace')
  })

  it('ignores offsets that are not points', () => {
    const data = '{"sessions":[{"id":"a","input":"p","offsets":{"root":{"x":1},"root.0":null}}]}'
    const result = deserializeWorkspace(data)

    expect(result.ok && result.value.sessions[0]?.offsets).toEqual({})
  })

  it('treats a missing offsets field as no offsets', () => {
    const result = deserializeWorkspace('{"sessions":[{"id":"a","input":"p"}]}')

    expect(result.ok && result.value.sessions[0]?.offsets).toEqual({})
  })

  it.each([
    ['malformed json', 'not json at all'],
    ['a json array', '[]'],
    ['an object without sessions', '{"name":"x"}'],
    ['a session without an identifier', '{"sessions":[{"input":"p"}]}'],
    ['a session without an input', '{"sessions":[{"id":"a"}]}'],
    ['a session that is not an object', '{"sessions":[42]}'],
  ])('reports %s as unreadable', (_description, data) => {
    const result = deserializeWorkspace(data)

    expect(result.ok).toBe(false)
    expect(result.ok ? undefined : result.error).toMatchObject({
      code: 'NDB008',
      severity: 'error',
      messageKey: 'diagnostic.ndb008',
    })
  })
})
