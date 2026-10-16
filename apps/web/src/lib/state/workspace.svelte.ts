import {
  type NodeId,
  type Point,
  type Session,
  type SessionId,
  type TreeSnapshot,
  type Workspace,
  addPoints,
  createSession,
  createWorkspace,
  getStepTree,
  getTree,
  moveNode,
  normalizeFormula,
  resetOffsets,
  updateInput,
} from '@nodable/sdk'

export type WorkspaceView = 'single' | 'all'

export type WorkspaceState = {
  readonly sessions: readonly Session[]
  readonly activeId: SessionId
  readonly active: Session
  readonly snapshot: TreeSnapshot
  readonly stepIndex: number
  readonly lastStepIndex: number
  readonly isReplaying: boolean
  readonly view: WorkspaceView
  readonly highlightLeaves: boolean
  setInput: (input: string) => void
  select: (id: SessionId) => void
  addFormula: () => void
  removeActive: () => void
  showStep: (index: number) => void
  showLatestStep: () => void
  nudgeNode: (nodeId: NodeId, delta: Point) => void
  clearPositions: () => void
  setView: (next: WorkspaceView) => void
  toggleHighlightLeaves: () => void
  asWorkspace: () => Workspace
  restore: (workspace: Workspace) => void
}

function createWorkspaceState(): WorkspaceState {
  const first = createSession()

  let sessions = $state<readonly Session[]>([first])
  let activeId = $state<SessionId>(first.id)
  let pinnedStep = $state<number | undefined>(undefined)
  let view = $state<WorkspaceView>('single')
  let highlightLeaves = $state(false)
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
    get view() {
      return view
    },
    get highlightLeaves() {
      return highlightLeaves
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
      if (sessions.length < 2) {
        return
      }

      const remaining = sessions.filter((session) => session.id !== activeId)

      pinnedStep = undefined
      sessions = remaining
      activeId = remaining[0]?.id ?? first.id
    },
    showStep(index: number) {
      pinnedStep = index
    },
    showLatestStep() {
      pinnedStep = undefined
    },
    nudgeNode(nodeId: NodeId, delta: Point) {
      const current = active.offsets[nodeId] ?? { x: 0, y: 0 }

      replace(moveNode(active, nodeId, addPoints(current, delta)))
    },
    clearPositions() {
      replace(resetOffsets(active))
    },
    setView(next: WorkspaceView) {
      view = next
    },
    toggleHighlightLeaves() {
      highlightLeaves = !highlightLeaves
    },
    asWorkspace() {
      return createWorkspace(name, sessions)
    },
    restore(workspace: Workspace) {
      if (workspace.sessions.length === 0) {
        return
      }

      pinnedStep = undefined
      name = workspace.name
      sessions = workspace.sessions
      activeId = workspace.sessions[0]?.id ?? first.id
    },
  }
}

export const workspace = createWorkspaceState()
