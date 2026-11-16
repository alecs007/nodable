import {
  type Folder,
  type FolderColor,
  type FolderId,
  type Interpretation,
  type Placements,
  type Session,
  type SessionId,
  type TreeSnapshot,
  type TruthValue,
  type Workspace,
  addFolder,
  assignVariable,
  clearInterpretation,
  createSession,
  createFolder,
  createWorkspace,
  duplicateSession,
  placeSession,
  recolorFolder,
  removeFolder,
  removeSession,
  renameFolder,
  setInterpretation,
  getStepTree,
  getTree,
  normalizeFormula,
  renameSession,
  updateInput,
} from '@nodable/sdk'

export type WorkspaceView = 'build' | 'interpret'

export type WorkspaceState = {
  readonly sessions: readonly Session[]
  readonly folders: readonly Folder[]
  readonly placements: Placements
  readonly activeId: SessionId
  readonly active: Session
  readonly snapshot: TreeSnapshot
  readonly stepIndex: number
  readonly lastStepIndex: number
  readonly isReplaying: boolean
  readonly isInterpreting: boolean
  setInput: (input: string) => void
  select: (id: SessionId) => void
  addFormula: (folderId?: FolderId) => void
  removeActive: () => void
  remove: (id: SessionId) => void
  rename: (name: string) => void
  renameFormula: (id: SessionId, name: string) => void
  duplicate: (id: SessionId) => void
  moveFormula: (id: SessionId, folderId: FolderId | undefined) => void
  addFolder: (name: string, color?: FolderColor) => FolderId
  renameFolder: (id: FolderId, name: string) => void
  recolorFolder: (id: FolderId, color: FolderColor) => void
  removeFolder: (id: FolderId) => void
  reset: () => void
  showStep: (index: number) => void
  showLatestStep: () => void
  interpret: () => void
  edit: () => void
  assign: (name: string, value: TruthValue | undefined) => void
  clearValues: () => void
  useValues: (interpretation: Interpretation) => void
  asWorkspace: () => Workspace
  restore: (workspace: Workspace) => void
}

function createWorkspaceState(): WorkspaceState {
  const first = createSession()

  let sessions = $state<readonly Session[]>([first])
  let folders = $state<readonly Folder[]>([])
  let placements = $state<Placements>({})
  let activeId = $state<SessionId>(first.id)
  let pinnedStep = $state<number | undefined>(undefined)
  let name = $state('Workspace')
  let view = $state<WorkspaceView>('build')

  const active = $derived(sessions.find((session) => session.id === activeId) ?? first)
  const lastStepIndex = $derived(active.analysis.steps.length - 1)
  const stepIndex = $derived(Math.min(pinnedStep ?? lastStepIndex, lastStepIndex))
  const snapshot = $derived(getStepTree(active, stepIndex) ?? getTree(active))
  const isInterpreting = $derived(view === 'interpret' && active.analysis.isComplete)

  function replace(next: Session): void {
    sessions = sessions.map((session) => (session.id === next.id ? next : session))
  }

  function current(): Workspace {
    return createWorkspace(name, sessions, activeId, folders, placements)
  }

  function apply(change: (workspace: Workspace) => Workspace): Workspace {
    const next = change(current())

    sessions = next.sessions
    folders = next.folders
    placements = next.placements

    return next
  }

  return {
    get sessions() {
      return sessions
    },
    get folders() {
      return folders
    },
    get placements() {
      return placements
    },
    get activeId() {
      return activeId
    },
    get active() {
      return active
    },
    get snapshot() {
      return snapshot
    },
    get stepIndex() {
      return stepIndex
    },
    get lastStepIndex() {
      return lastStepIndex
    },
    get isReplaying() {
      return pinnedStep !== undefined && pinnedStep < lastStepIndex
    },
    get isInterpreting() {
      return isInterpreting
    },
    setInput(input: string) {
      pinnedStep = undefined
      replace(updateInput(active, normalizeFormula(input)))
    },
    select(id: SessionId) {
      pinnedStep = undefined
      view = 'build'
      activeId = id
    },
    addFormula(folderId?: FolderId) {
      const created = createSession()

      pinnedStep = undefined
      view = 'build'
      sessions = [...sessions, created]
      activeId = created.id

      if (folderId !== undefined) {
        apply((workspace) => placeSession(workspace, created.id, folderId))
      }
    },
    removeActive() {
      this.remove(activeId)
    },
    remove(id: SessionId) {
      if (sessions.length < 2) {
        return
      }

      const remaining = apply((workspace) => removeSession(workspace, id)).sessions

      pinnedStep = undefined

      if (id === activeId) {
        view = 'build'
        activeId = remaining[0]?.id ?? first.id
      }
    },
    reset() {
      const fresh = createSession()

      pinnedStep = undefined
      view = 'build'
      name = 'Workspace'
      sessions = [fresh]
      folders = []
      placements = {}
      activeId = fresh.id
    },
    rename(next: string) {
      replace(renameSession(active, next))
    },
    renameFormula(id: SessionId, next: string) {
      const session = sessions.find((candidate) => candidate.id === id)

      if (session !== undefined) {
        replace(renameSession(session, next))
      }
    },
    duplicate(id: SessionId) {
      const next = apply((workspace) => duplicateSession(workspace, id))

      pinnedStep = undefined
      view = 'build'
      activeId = next.activeId
    },
    moveFormula(id: SessionId, folderId: FolderId | undefined) {
      apply((workspace) => placeSession(workspace, id, folderId))
    },
    addFolder(folderName: string, color?: FolderColor) {
      const folder = createFolder(folderName, color)

      apply((workspace) => addFolder(workspace, folder))

      return folder.id
    },
    renameFolder(id: FolderId, folderName: string) {
      apply((workspace) => renameFolder(workspace, id, folderName))
    },
    recolorFolder(id: FolderId, color: FolderColor) {
      apply((workspace) => recolorFolder(workspace, id, color))
    },
    removeFolder(id: FolderId) {
      const next = apply((workspace) => removeFolder(workspace, id))

      if (next.activeId === activeId) {
        return
      }

      pinnedStep = undefined
      view = 'build'

      if (next.sessions.length === 0) {
        const fresh = createSession()

        sessions = [fresh]
        activeId = fresh.id
      } else {
        activeId = next.activeId
      }
    },
    showStep(index: number) {
      pinnedStep = index
    },
    showLatestStep() {
      pinnedStep = undefined
    },
    interpret() {
      pinnedStep = undefined
      view = 'interpret'
    },
    edit() {
      view = 'build'
    },
    assign(variable: string, value: TruthValue | undefined) {
      replace(assignVariable(active, variable, value))
    },
    clearValues() {
      replace(clearInterpretation(active))
    },
    useValues(interpretation: Interpretation) {
      replace(setInterpretation(active, interpretation))
    },
    asWorkspace() {
      return current()
    },
    restore(workspace: Workspace) {
      if (workspace.sessions.length === 0) {
        return
      }

      pinnedStep = undefined
      view = 'build'
      name = workspace.name
      sessions = workspace.sessions
      folders = workspace.folders
      placements = workspace.placements
      activeId =
        workspace.activeId === '' ? (workspace.sessions[0]?.id ?? first.id) : workspace.activeId
    },
  }
}

export const workspace = createWorkspaceState()
