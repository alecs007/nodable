export type NodeId = string

export const ROOT_ID: NodeId = 'root'

export function childId(parent: NodeId, index: number): NodeId {
  return `${parent}.${String(index)}`
}

export function parentId(id: NodeId): NodeId | undefined {
  const separator = id.lastIndexOf('.')

  return separator === -1 ? undefined : id.slice(0, separator)
}

export function isDescendantId(candidate: NodeId, ancestor: NodeId): boolean {
  return candidate.startsWith(`${ancestor}.`)
}

export function depthOf(id: NodeId): number {
  return id.split('.').length - 1
}
