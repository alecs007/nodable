import { describe, expect, it } from 'vitest'
import {
  type StorageAdapter,
  clearWorkspace,
  createWorkspace,
  loadWorkspace,
  saveWorkspace,
} from '../../src/index'

function memoryAdapter(
  initial?: string,
): StorageAdapter & { readonly read: () => Promise<string | undefined> } {
  let stored = initial

  return {
    read: () => Promise.resolve(stored),
    write: (data: string) => {
      stored = data

      return Promise.resolve()
    },
    clear: () => {
      stored = undefined

      return Promise.resolve()
    },
  }
}

describe('workspace storage', () => {
  it('writes a workspace through the adapter', async () => {
    const adapter = memoryAdapter()
    await saveWorkspace(adapter, createWorkspace('Seminar 1'))

    expect(await adapter.read()).toContain('Seminar 1')
  })

  it('reads a workspace back', async () => {
    const adapter = memoryAdapter()
    await saveWorkspace(adapter, createWorkspace('Seminar 1'))
    const result = await loadWorkspace(adapter)

    expect(result.ok && result.value?.name).toBe('Seminar 1')
  })

  it('reports nothing stored as an empty result', async () => {
    const result = await loadWorkspace(memoryAdapter())

    expect(result).toEqual({ ok: true, value: undefined })
  })

  it('reports stored data that cannot be read', async () => {
    const result = await loadWorkspace(memoryAdapter('broken'))

    expect(result.ok ? undefined : result.error.code).toBe('NDB008')
  })

  it('clears what was stored', async () => {
    const adapter = memoryAdapter()
    await saveWorkspace(adapter, createWorkspace())
    await clearWorkspace(adapter)

    expect(await adapter.read()).toBeUndefined()
  })
})
