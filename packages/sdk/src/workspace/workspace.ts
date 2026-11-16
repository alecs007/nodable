import { type Diagnostic, type Interpretation, createDiagnostic } from '@nodable/engine'
import { type NodeOffsets, type Point } from '../session/point'
import {
  type Session,
  type SessionId,
  createSession,
  createSessionId,
  restoreSession,
} from '../session/session'
import { type Result, fail, ok } from './result'

export const WORKSPACE_VERSION = 1

export type FolderId = string

export const FOLDER_COLORS = ['blue', 'green', 'amber', 'red', 'purple', 'teal'] as const

export type FolderColor = (typeof FOLDER_COLORS)[number]

export type Folder = {
  readonly id: FolderId
  readonly name: string
  readonly color: FolderColor
}

export type Placements = Readonly<Record<SessionId, FolderId>>

export type Workspace = {
  readonly version: number
  readonly name: string
  readonly activeId: SessionId
  readonly sessions: readonly Session[]
  readonly folders: readonly Folder[]
  readonly placements: Placements
}

type SerializedSession = {
  readonly id: SessionId
  readonly name: string
  readonly input: string
  readonly offsets: NodeOffsets
  readonly interpretation: Interpretation
  readonly folder?: FolderId
}

type SerializedWorkspace = {
  readonly version: number
  readonly name: string
  readonly activeId: SessionId
  readonly folders: readonly Folder[]
  readonly sessions: readonly SerializedSession[]
}

export function createWorkspace(
  name = 'Workspace',
  sessions?: readonly Session[],
  activeId?: SessionId,
  folders: readonly Folder[] = [],
  placements: Placements = {},
): Workspace {
  const members = sessions ?? [createSession()]

  return {
    version: WORKSPACE_VERSION,
    name,
    activeId: activeId ?? members[0]?.id ?? '',
    sessions: members,
    folders,
    placements,
  }
}

export function addSession(workspace: Workspace, session: Session, folderId?: FolderId): Workspace {
  const added = { ...workspace, sessions: [...workspace.sessions, session] }

  return folderId === undefined ? added : placeSession(added, session.id, folderId)
}

function withoutKey<T>(record: Readonly<Record<string, T>>, key: string): Record<string, T> {
  return Object.fromEntries(Object.entries(record).filter(([candidate]) => candidate !== key))
}

export function removeSession(workspace: Workspace, id: SessionId): Workspace {
  return {
    ...workspace,
    sessions: workspace.sessions.filter((session) => session.id !== id),
    placements: withoutKey(workspace.placements, id),
  }
}

export function duplicateSession(workspace: Workspace, id: SessionId): Workspace {
  const index = workspace.sessions.findIndex((session) => session.id === id)
  const original = workspace.sessions[index]

  if (original === undefined) {
    return workspace
  }

  const copy = restoreSession(
    createSessionId(),
    original.input,
    original.offsets,
    original.name,
    original.interpretation,
  )
  const folderId = folderOf(workspace, id)
  const sessions = [
    ...workspace.sessions.slice(0, index + 1),
    copy,
    ...workspace.sessions.slice(index + 1),
  ]
  const duplicated = { ...workspace, sessions, activeId: copy.id }

  return folderId === undefined ? duplicated : placeSession(duplicated, copy.id, folderId)
}

export function createFolder(name: string, color: FolderColor = 'blue'): Folder {
  return { id: createSessionId(), name, color }
}

export function addFolder(workspace: Workspace, folder: Folder): Workspace {
  return { ...workspace, folders: [folder, ...workspace.folders] }
}

export function renameFolder(workspace: Workspace, id: FolderId, name: string): Workspace {
  return {
    ...workspace,
    folders: workspace.folders.map((folder) => (folder.id === id ? { ...folder, name } : folder)),
  }
}

export function recolorFolder(workspace: Workspace, id: FolderId, color: FolderColor): Workspace {
  return {
    ...workspace,
    folders: workspace.folders.map((folder) => (folder.id === id ? { ...folder, color } : folder)),
  }
}

export function removeFolder(workspace: Workspace, id: FolderId): Workspace {
  const sessions = workspace.sessions.filter((session) => folderOf(workspace, session.id) !== id)
  const isActiveKept = sessions.some((session) => session.id === workspace.activeId)

  return {
    ...workspace,
    activeId: isActiveKept ? workspace.activeId : (sessions[0]?.id ?? ''),
    sessions,
    folders: workspace.folders.filter((folder) => folder.id !== id),
    placements: Object.fromEntries(
      Object.entries(workspace.placements).filter(([, folderId]) => folderId !== id),
    ),
  }
}

export function placeSession(
  workspace: Workspace,
  id: SessionId,
  folderId: FolderId | undefined,
): Workspace {
  const known = workspace.folders.some((folder) => folder.id === folderId)
  const placements = withoutKey(workspace.placements, id)

  return {
    ...workspace,
    placements: folderId !== undefined && known ? { ...placements, [id]: folderId } : placements,
  }
}

export function folderOf(workspace: Workspace, id: SessionId): FolderId | undefined {
  return Object.hasOwn(workspace.placements, id) ? workspace.placements[id] : undefined
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
    activeId: workspace.activeId,
    folders: workspace.folders,
    sessions: workspace.sessions.map((session) => {
      const folder = folderOf(workspace, session.id)
      const serialized: SerializedSession = {
        id: session.id,
        name: session.name,
        input: session.input,
        offsets: session.offsets,
        interpretation: session.interpretation,
      }

      return folder === undefined ? serialized : { ...serialized, folder }
    }),
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

function readInterpretation(value: unknown): Interpretation {
  if (!isRecord(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, boolean] => typeof entry[1] === 'boolean',
    ),
  )
}

function readSession(value: unknown): Session | undefined {
  if (!isRecord(value) || typeof value['id'] !== 'string' || typeof value['input'] !== 'string') {
    return undefined
  }

  const name = typeof value['name'] === 'string' ? value['name'] : ''

  return restoreSession(
    value['id'],
    value['input'],
    readOffsets(value['offsets']),
    name,
    readInterpretation(value['interpretation']),
  )
}

function isFolderColor(value: unknown): value is FolderColor {
  return FOLDER_COLORS.some((color) => color === value)
}

function readFolders(value: unknown): readonly Folder[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((candidate: unknown) => {
    if (
      !isRecord(candidate) ||
      typeof candidate['id'] !== 'string' ||
      typeof candidate['name'] !== 'string'
    ) {
      return []
    }

    const color = isFolderColor(candidate['color']) ? candidate['color'] : 'blue'

    return [{ id: candidate['id'], name: candidate['name'], color }]
  })
}

function readPlacements(sessions: readonly unknown[], folders: readonly Folder[]): Placements {
  const placements: Record<SessionId, FolderId> = {}

  for (const candidate of sessions) {
    if (
      isRecord(candidate) &&
      typeof candidate['id'] === 'string' &&
      folders.some((folder) => folder.id === candidate['folder'])
    ) {
      placements[candidate['id']] = String(candidate['folder'])
    }
  }

  return placements
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
  const members = sessions.filter((session) => session !== undefined)
  const stored = parsed['activeId']
  const known = members.some((session) => session.id === stored)

  const folders = readFolders(parsed['folders'])

  return ok({
    version: WORKSPACE_VERSION,
    name,
    activeId: known && typeof stored === 'string' ? stored : (members[0]?.id ?? ''),
    sessions: members,
    folders,
    placements: readPlacements(parsed['sessions'], folders),
  })
}
