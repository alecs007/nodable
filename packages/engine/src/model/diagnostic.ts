import { type SourceRange } from './source-range'

export type DiagnosticCode =
  'NDB001' | 'NDB002' | 'NDB003' | 'NDB004' | 'NDB005' | 'NDB006' | 'NDB007'

export type DiagnosticSeverity = 'error' | 'warning'

export type DiagnosticMessageKey = `diagnostic.${Lowercase<DiagnosticCode>}`

export type Diagnostic = {
  readonly code: DiagnosticCode
  readonly severity: DiagnosticSeverity
  readonly range: SourceRange
  readonly messageKey: DiagnosticMessageKey
}

type DiagnosticDefinition = {
  readonly severity: DiagnosticSeverity
  readonly messageKey: DiagnosticMessageKey
}

const DIAGNOSTIC_DEFINITIONS: Record<DiagnosticCode, DiagnosticDefinition> = {
  NDB001: { severity: 'error', messageKey: 'diagnostic.ndb001' },
  NDB002: { severity: 'error', messageKey: 'diagnostic.ndb002' },
  NDB003: { severity: 'error', messageKey: 'diagnostic.ndb003' },
  NDB004: { severity: 'error', messageKey: 'diagnostic.ndb004' },
  NDB005: { severity: 'error', messageKey: 'diagnostic.ndb005' },
  NDB006: { severity: 'error', messageKey: 'diagnostic.ndb006' },
  NDB007: { severity: 'warning', messageKey: 'diagnostic.ndb007' },
}

export function createDiagnostic(code: DiagnosticCode, range: SourceRange): Diagnostic {
  const definition = DIAGNOSTIC_DEFINITIONS[code]

  return {
    code,
    severity: definition.severity,
    range,
    messageKey: definition.messageKey,
  }
}

export function hasError(diagnostics: readonly Diagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === 'error')
}
