import { type Diagnostic, createDiagnostic } from '@nodable/engine'
import { type NodeOffsets, type Point } from '../session/point'
import { type Session, type SessionId, createSession, restoreSession } from '../session/session'
import { type Result, fail, ok } from './result'

export const WORKSPACE_VERSION = 1

export type Workspace = {
  readonly version: number
  readonly name: string
  readonly sessions: readonly Session[]
}

type SerializedSession = {
  readonly id: SessionId
  readonly name: string
  readonly input: string
  readonly offsets: NodeOffsets
}

type SerializedWorkspace = {
  readonly version: number
  readonly name: string
  readonly sessions: readonly SerializedSession[]
}

export function createWorkspace(name = 'Workspace', sessions?: readonly Session[]): Workspace {
  return {
    version: WORKSPACE_VERSION,
    name,
    sessions: sessions ?? [createSession()],
  }
}

export function addSession(workspace: Workspace, session: Session): Workspace {
  return { ...workspace, sessions: [...workspace.sessions, session] }
}

export function removeSession(workspace: Workspace, id: SessionId): Workspace {
  return { ...workspace, sessions: workspace.sessions.filter((session) => session.id !== id) }
}

export function replaceSession(workspace: Workspace, session: Session): Workspace {
  return {
    ...workspace,
    sessions: workspace.sessions.map((current) => (current.id === session.id ? session : current)),
  }
}

export function serializeWorkspace(workspace: Workspace): string {
  const data: SerializedWorkspace = {
    version: WORKSPACE_VERSION,
    name: workspace.name,
    sessions: workspace.sessions.map((session) => ({
      id: session.id,
      name: session.name,
      input: session.input,
      offsets: session.offsets,
    })),
  }

  return JSON.stringify(data, null, 2)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readPoint(value: unknown): Point | undefined {
  if (!isRecord(value) || typeof value['x'] !== 'number' || typeof value['y'] !== 'number') {
    return undefined
  }

  return { x: value['x'], y: value['y'] }
}

function readOffsets(value: unknown): NodeOffsets {
  if (!isRecord(value)) {
    return {}
  }

  const offsets: Record<string, Point> = {}

  for (const [id, candidate] of Object.entries(value)) {
    const point = readPoint(candidate)

    if (point !== undefined) {
      offsets[id] = point
    }
  }

  return offsets
}

function readSession(value: unknown): Session | undefined {
  if (!isRecord(value) || typeof value['id'] !== 'string' || typeof value['input'] !== 'string') {
    return undefined
  }

  const name = typeof value['name'] === 'string' ? value['name'] : ''

  return restoreSession(value['id'], value['input'], readOffsets(value['offsets']), name)
}

function parseJson(data: string): unknown {
  try {
    return JSON.parse(data)
  } catch {
    return undefined
  }
}

function unreadable(length: number): Diagnostic {
  return createDiagnostic('NDB008', { start: 0, end: length })
}

export function deserializeWorkspace(data: string): Result<Workspace, Diagnostic> {
  const parsed = parseJson(data)

  if (!isRecord(parsed) || !Array.isArray(parsed['sessions'])) {
    return fail(unreadable(data.length))
  }

  const sessions = parsed['sessions'].map(readSession)

  if (sessions.includes(undefined)) {
    return fail(unreadable(data.length))
  }

  const name = typeof parsed['name'] === 'string' ? parsed['name'] : 'Workspace'

  return ok({
    version: WORKSPACE_VERSION,
    name,
    sessions: sessions.filter((session) => session !== undefined),
  })
}
