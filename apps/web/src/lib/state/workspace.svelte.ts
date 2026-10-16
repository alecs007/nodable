import {
  type Session,
  type SessionId,
  createSession,
  normalizeFormula,
  updateInput,
} from '@nodable/sdk'

function createWorkspaceState(): {
  readonly sessions: readonly Session[]
  readonly activeId: SessionId
  readonly active: Session
  setInput: (input: string) => void
  select: (id: SessionId) => void
} {
  let sessions = $state<readonly Session[]>([createSession()])
  let activeId = $state<SessionId>(sessions[0]?.id ?? '')

  const active = $derived(sessions.find((session) => session.id === activeId) ?? sessions[0])

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
      return active ?? createSession()
    },
    setInput(input: string) {
      const current = active

      if (current !== undefined) {
        replace(updateInput(current, normalizeFormula(input)))
      }
    },
    select(id: SessionId) {
      activeId = id
    },
  }
}

export const workspace = createWorkspaceState()
