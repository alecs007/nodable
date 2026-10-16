import {
  type Session,
  type SessionId,
  type TreeSnapshot,
  type Workspace,
  createSession,
  createWorkspace,
  getStepTree,
  getTree,
  normalizeFormula,
  renameSession,
  updateInput,
} from '@nodable/sdk'

export type WorkspaceState = {
  readonly sessions: readonly Session[]
  readonly activeId: SessionId
  readonly active: Session
  readonly snapshot: TreeSnapshot
  readonly stepIndex: number
  readonly lastStepIndex: number
  readonly isReplaying: boolean
  setInput: (input: string) => void
  select: (id: SessionId) => void
  addFormula: () => void
  removeActive: () => void
  remove: (id: SessionId) => void
  rename: (name: string) => void
  showStep: (index: number) => void
  showLatestStep: () => void
  asWorkspace: () => Workspace
  restore: (workspace: Workspace) => void
}

function createWorkspaceState(): WorkspaceState {
  const first = createSession()

  let sessions = $state<readonly Session[]>([first])
  let activeId = $state<SessionId>(first.id)
  let pinnedStep = $state<number | undefined>(undefined)
  let name = $state('Workspace')

  const active = $derived(sessions.find((session) => session.id === activeId) ?? first)
  const lastStepIndex = $derived(active.analysis.steps.length - 1)
  const stepIndex = $derived(Math.min(pinnedStep ?? lastStepIndex, lastStepIndex))
  const snapshot = $derived(getStepTree(active, stepIndex) ?? getTree(active))

  function replace(next: Session): void {
    sessions = sessions.map((session) => (session.id === next.id ? next : session))
  }

  return {
    get sessions() {
      return sessions
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
    setInput(input: string) {
      pinnedStep = undefined
      replace(updateInput(active, normalizeFormula(input)))
    },
    select(id: SessionId) {
      pinnedStep = undefined
      activeId = id
    },
    addFormula() {
      const created = createSession()

      pinnedStep = undefined
      sessions = [...sessions, created]
      activeId = created.id
    },
    removeActive() {
      this.remove(activeId)
    },
    remove(id: SessionId) {
      if (sessions.length < 2) {
        return
      }

      const remaining = sessions.filter((session) => session.id !== id)

      pinnedStep = undefined
      sessions = remaining

      if (id === activeId) {
        activeId = remaining[0]?.id ?? first.id
      }
    },
    rename(next: string) {
      replace(renameSession(active, next))
    },
    showStep(index: number) {
      pinnedStep = index
    },
    showLatestStep() {
      pinnedStep = undefined
    },
    asWorkspace() {
      return createWorkspace(name, sessions, activeId)
    },
    restore(workspace: Workspace) {
      if (workspace.sessions.length === 0) {
        return
      }

      pinnedStep = undefined
      name = workspace.name
      sessions = workspace.sessions
      activeId =
        workspace.activeId === '' ? (workspace.sessions[0]?.id ?? first.id) : workspace.activeId
    },
  }
}

export const workspace = createWorkspaceState()
