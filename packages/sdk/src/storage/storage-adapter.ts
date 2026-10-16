import { type Diagnostic } from '@nodable/engine'
import { type Workspace, deserializeWorkspace, serializeWorkspace } from '../workspace/workspace'
import { type Result, ok } from '../workspace/result'

export type StorageAdapter = {
  readonly read: () => Promise<string | undefined>
  readonly write: (data: string) => Promise<void>
  readonly clear: () => Promise<void>
}

export async function saveWorkspace(adapter: StorageAdapter, workspace: Workspace): Promise<void> {
  await adapter.write(serializeWorkspace(workspace))
}

export async function loadWorkspace(
  adapter: StorageAdapter,
): Promise<Result<Workspace | undefined, Diagnostic>> {
  const data = await adapter.read()

  if (data === undefined) {
    return ok(undefined)
  }

  return deserializeWorkspace(data)
}

export async function clearWorkspace(adapter: StorageAdapter): Promise<void> {
  await adapter.clear()
}
