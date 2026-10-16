import { describe, expect, it } from 'vitest'
import { type DiagnosticCode, createDiagnostic, hasError } from '../../src/index'

const ERROR_CODES: readonly DiagnosticCode[] = [
  'NDB001',
  'NDB002',
  'NDB003',
  'NDB004',
  'NDB005',
  'NDB006',
  'NDB008',
]

describe('diagnostics', () => {
  it.each(ERROR_CODES)('reports %s as an error', (code) => {
    expect(createDiagnostic(code, { start: 0, end: 1 }).severity).toBe('error')
  })

  it('reports an incomplete formula as a warning', () => {
    expect(createDiagnostic('NDB007', { start: 0, end: 1 }).severity).toBe('warning')
  })

  it('derives the translation key from the code', () => {
    expect(createDiagnostic('NDB003', { start: 1, end: 2 })).toEqual({
      code: 'NDB003',
      severity: 'error',
      range: { start: 1, end: 2 },
      messageKey: 'diagnostic.ndb003',
    })
  })

  it('detects whether a list contains an error', () => {
    expect(hasError([createDiagnostic('NDB007', { start: 0, end: 1 })])).toBe(false)
    expect(hasError([createDiagnostic('NDB002', { start: 0, end: 1 })])).toBe(true)
    expect(hasError([])).toBe(false)
  })
})
