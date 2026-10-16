import { describe, expect, it } from 'vitest'
import {
  type ExportFormat,
  createSession,
  deserializeWorkspace,
  exportSession,
  moveNode,
} from '../../src/index'

const FORMULA = '((¬p) ∨ q)'

function exported(format: ExportFormat, input = FORMULA): ReturnType<typeof exportSession> {
  return exportSession(createSession(input), format)
}

function content(format: Exclude<ExportFormat, 'png'>, input = FORMULA): string {
  const result = exported(format, input)

  if (result.kind !== 'text') {
    throw new Error(`expected a text export for ${format}`)
  }

  return result.content
}

describe('exportSession', () => {
  it('names the file after the format', () => {
    expect(exported('svg').fileName).toBe('nodable-tree.svg')
    expect(exported('text').fileName).toBe('nodable-tree.txt')
    expect(exported('latex').fileName).toBe('nodable-tree.tex')
    expect(exported('json').fileName).toBe('nodable-tree.json')
    expect(exported('png').fileName).toBe('nodable-tree.png')
  })

  describe('plain text', () => {
    it('writes an indented tree', () => {
      expect(content('text')).toMatchSnapshot()
    })

    it('marks empty slots', () => {
      expect(content('text', '(p ∧')).toContain('□')
    })
  })

  describe('latex', () => {
    it('writes a forest environment', () => {
      expect(content('latex')).toMatchSnapshot()
    })

    it('uses a command for every connective', () => {
      expect(content('latex', '(p ∧ q)')).toContain('\\land')
      expect(content('latex', '(p ∨ q)')).toContain('\\lor')
      expect(content('latex', '(p → q)')).toContain('\\rightarrow')
      expect(content('latex', '(p ↔ q)')).toContain('\\leftrightarrow')
      expect(content('latex', '(¬p)')).toContain('\\lnot')
    })

    it('marks slots and pending groups', () => {
      expect(content('latex', '(p ∧')).toContain('\\square')
      expect(content('latex', '(p)')).toContain('(\\,)')
    })
  })

  describe('svg', () => {
    it('writes a standalone document', () => {
      expect(content('svg')).toMatchSnapshot()
    })

    it('escapes characters that are special in markup', () => {
      expect(content('svg', '(p ∧ q)')).not.toContain('<text class="nodable-label">&')
    })

    it('shows the choice between a double and a single node on a pending group', () => {
      expect(content('svg', '(p')).toContain('nodable-divider')
    })
  })

  describe('json', () => {
    it('writes a workspace that can be read back', () => {
      const result = deserializeWorkspace(content('json'))

      expect(result.ok && result.value.sessions[0]?.input).toBe(FORMULA)
    })

    it('keeps the node offsets', () => {
      const session = moveNode(createSession(FORMULA), 'root.1', { x: 5, y: 7 })
      const result = exportSession(session, 'json')
      const parsed = result.kind === 'text' ? deserializeWorkspace(result.content) : undefined

      expect(parsed?.ok === true && parsed.value.sessions[0]?.offsets).toEqual({
        'root.1': { x: 5, y: 7 },
      })
    })
  })

  describe('png', () => {
    it('hands the interface the markup and the pixel size to rasterize', () => {
      const result = exported('png')

      expect(result.kind).toBe('raster')

      if (result.kind !== 'raster') {
        return
      }

      expect(result.svg.startsWith('<svg')).toBe(true)
      expect(result.width).toBeGreaterThan(0)
      expect(result.height).toBeGreaterThan(0)
    })
  })
})
