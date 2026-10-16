import { type Workspace, clearWorkspace, loadWorkspace, saveWorkspace } from '@nodable/sdk'
import { indexedDbAdapter } from '../storage/indexeddb-adapter'

const SAVE_DELAY = 500

export type PersistenceState = {
  readonly isReady: boolean
  readonly hasFailed: boolean
  start: (restore: (workspace: Workspace) => void) => Promise<void>
  schedule: (workspace: Workspace) => void
  clear: () => Promise<void>
}

function createPersistenceState(): PersistenceState {
  let isReady = $state(false)
  let hasFailed = $state(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  async function write(workspace: Workspace): Promise<void> {
    try {
      await saveWorkspace(indexedDbAdapter, workspace)
      hasFailed = false
    } catch {
      hasFailed = true
    }
  }

  return {
    get isReady() {
      return isReady
    },
    get hasFailed() {
      return hasFailed
    },
    async start(restore: (workspace: Workspace) => void) {
      try {
        const result = await loadWorkspace(indexedDbAdapter)

        if (result.ok && result.value !== undefined) {
          restore(result.value)
        }
      } catch {
        hasFailed = true
      } finally {
        isReady = true
      }
    },
    schedule(workspace: Workspace) {
      clearTimeout(timer)
      timer = setTimeout(() => {
        void write(workspace)
      }, SAVE_DELAY)
    },
    async clear() {
      clearTimeout(timer)

      try {
        await clearWorkspace(indexedDbAdapter)
      } catch {
        hasFailed = true
      }
    },
  }
}

export const persistence = createPersistenceState()
