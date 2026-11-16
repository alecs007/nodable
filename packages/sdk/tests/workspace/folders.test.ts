import { describe, expect, it } from 'vitest'
import {
  type Folder,
  type Workspace,
  addFolder,
  addSession,
  createFolder,
  createSession,
  createWorkspace,
  deserializeWorkspace,
  duplicateSession,
  folderOf,
  placeSession,
  recolorFolder,
  removeFolder,
  removeSession,
  renameFolder,
  serializeWorkspace,
} from '../../src/index'

const first = createSession('(p ∧ q)', 'First')
const second = createSession('(r → s)')
const lecture: Folder = { id: 'lecture', name: 'Lecture 4', color: 'green' }
const seminar: Folder = { id: 'seminar', name: 'Seminar', color: 'blue' }

function sample(): Workspace {
  const base = createWorkspace('Course', [first, second], first.id, [lecture, seminar])

  return placeSession(base, first.id, lecture.id)
}

describe('folders', () => {
  it('creates a folder with a fresh id', () => {
    const one = createFolder('A')
    const two = createFolder('A')

    expect(one).toMatchObject({ name: 'A', color: 'blue' })
    expect(createFolder('B', 'red').color).toBe('red')
    expect(one.id).not.toBe(two.id)
  })

  it('starts a workspace without folders', () => {
    expect(createWorkspace()).toMatchObject({ folders: [], placements: {} })
  })

  it('adds and renames a folder', () => {
    const added = addFolder(createWorkspace(), lecture)

    expect(renameFolder(added, lecture.id, 'Lecture 5').folders).toEqual([
      { ...lecture, name: 'Lecture 5' },
    ])
    expect(renameFolder(added, 'unknown', 'X').folders).toEqual([lecture])
  })

  it('changes the color of a folder', () => {
    const recolored = recolorFolder(sample(), lecture.id, 'purple')

    expect(recolored.folders).toEqual([{ ...lecture, color: 'purple' }, seminar])
  })

  it('places a formula in a folder and takes it out again', () => {
    const workspace = sample()

    expect(folderOf(workspace, first.id)).toBe(lecture.id)
    expect(folderOf(workspace, second.id)).toBeUndefined()
    expect(folderOf(placeSession(workspace, first.id, seminar.id), first.id)).toBe(seminar.id)
    expect(folderOf(placeSession(workspace, first.id, undefined), first.id)).toBeUndefined()
  })

  it('ignores a folder that does not exist', () => {
    expect(placeSession(sample(), second.id, 'unknown').placements).toEqual({
      [first.id]: lecture.id,
    })
  })

  it('removes a folder together with its formulas', () => {
    const removed = removeFolder(sample(), lecture.id)

    expect(removed.folders).toEqual([seminar])
    expect(removed.sessions.map((session) => session.id)).toEqual([second.id])
    expect(removed.activeId).toBe(second.id)
    expect(removed.placements).toEqual({})
  })

  it('keeps the active formula when it lies outside the removed folder', () => {
    const outside = { ...sample(), activeId: second.id }

    expect(removeFolder(outside, lecture.id).activeId).toBe(second.id)
  })

  it('leaves no active formula when the folder held them all', () => {
    const all = placeSession(sample(), second.id, lecture.id)
    const removed = removeFolder(all, lecture.id)

    expect(removed.sessions).toEqual([])
    expect(removed.activeId).toBe('')
  })

  it('puts a new folder first', () => {
    expect(addFolder(sample(), createFolder('Newest')).folders[0]?.name).toBe('Newest')
  })

  it('adds a formula straight into a folder', () => {
    const third = createSession('t')

    expect(folderOf(addSession(sample(), third, seminar.id), third.id)).toBe(seminar.id)
  })

  it('forgets the folder of a removed formula', () => {
    expect(removeSession(sample(), first.id).placements).toEqual({})
  })
})

describe('duplicateSession', () => {
  it('copies a formula next to the original, in the same folder, and selects it', () => {
    const duplicated = duplicateSession(sample(), first.id)
    const copy = duplicated.sessions[1]

    expect(duplicated.sessions).toHaveLength(3)
    expect(copy).toMatchObject({ name: 'First', input: '(p ∧ q)' })
    expect(copy?.id).not.toBe(first.id)
    expect(duplicated.activeId).toBe(copy?.id)
    expect(folderOf(duplicated, copy?.id ?? '')).toBe(lecture.id)
  })

  it('copies a formula outside any folder', () => {
    const duplicated = duplicateSession(sample(), second.id)

    expect(folderOf(duplicated, duplicated.activeId)).toBeUndefined()
  })

  it('leaves the workspace alone for an unknown formula', () => {
    const workspace = sample()

    expect(duplicateSession(workspace, 'unknown')).toBe(workspace)
  })
})

describe('saving folders', () => {
  it('keeps folders and placements through a round trip', () => {
    const result = deserializeWorkspace(serializeWorkspace(sample()))

    expect(result.ok && result.value.folders).toEqual([lecture, seminar])
    expect(result.ok && result.value.placements).toEqual({ [first.id]: lecture.id })
  })

  it('reads a workspace saved before folders existed', () => {
    const result = deserializeWorkspace(
      JSON.stringify({
        version: 1,
        name: 'Old',
        activeId: 'a',
        sessions: [{ id: 'a', input: 'p' }],
      }),
    )

    expect(result.ok && result.value).toMatchObject({ folders: [], placements: {} })
  })

  it('drops malformed folders and placements in unknown folders', () => {
    const result = deserializeWorkspace(
      JSON.stringify({
        version: 1,
        name: 'Mixed',
        activeId: 'a',
        folders: [
          { id: 'f', name: 'Kept', color: 'teal' },
          { id: 'g', name: 'Plain', color: 'pink' },
          { id: 3 },
          'loose',
        ],
        sessions: [
          { id: 'a', input: 'p', folder: 'f' },
          { id: 'b', input: 'q', folder: 'missing' },
        ],
      }),
    )

    expect(result.ok && result.value.folders).toEqual([
      { id: 'f', name: 'Kept', color: 'teal' },
      { id: 'g', name: 'Plain', color: 'blue' },
    ])
    expect(result.ok && result.value.placements).toEqual({ a: 'f' })
  })
})
