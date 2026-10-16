import { describe, expect, it } from 'vitest'
import { ROOT_ID, childId, depthOf, isDescendantId, parentId } from '../../src/index'

describe('node identifiers', () => {
  it('derives a child identifier from the parent path', () => {
    expect(childId(ROOT_ID, 0)).toBe('root.0')
    expect(childId('root.1', 1)).toBe('root.1.1')
  })

  it('returns the parent path of a child identifier', () => {
    expect(parentId('root.1.0')).toBe('root.1')
  })

  it('reports no parent for the root', () => {
    expect(parentId(ROOT_ID)).toBeUndefined()
  })

  it('recognizes descendants', () => {
    expect(isDescendantId('root.0.1', ROOT_ID)).toBe(true)
    expect(isDescendantId(ROOT_ID, ROOT_ID)).toBe(false)
    expect(isDescendantId('root.0', 'root.1')).toBe(false)
  })

  it('measures depth as the number of path segments below the root', () => {
    expect(depthOf(ROOT_ID)).toBe(0)
    expect(depthOf('root.0.1')).toBe(2)
  })
})
