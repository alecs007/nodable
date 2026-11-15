import {
  type Analysis,
  type BuildStep,
  type Cursor,
  type Diagnostic,
  type Evaluation,
  type Interpretation,
  type NodeId,
  type TokenKind,
  type TreeNode,
  type TruthValue,
  analyzeFormula,
  evaluateTree,
  isComplete,
  normalizeFormula,
  variablesOf,
} from '@nodable/engine'
import { type NodeOffsets, type Point, isOrigin } from './point'

export type SessionId = string

export type Session = {
  readonly id: SessionId
  readonly name: string
  readonly input: string
  readonly analysis: Analysis
  readonly offsets: NodeOffsets
  readonly interpretation: Interpretation
}

export type TreeSnapshot = {
  readonly root: TreeNode
  readonly cursor: Cursor
  readonly offsets: NodeOffsets
  readonly isComplete: boolean
}

export function createSessionId(): SessionId {
  return crypto.randomUUID()
}

export function createSession(input = '', name = ''): Session {
  return {
    id: createSessionId(),
    name,
    input,
    analysis: analyzeFormula(input),
    offsets: {},
    interpretation: {},
  }
}

export function restoreSession(
  id: SessionId,
  input: string,
  offsets: NodeOffsets,
  name = '',
  interpretation: Interpretation = {},
): Session {
  return { id, name, input, analysis: analyzeFormula(input), offsets, interpretation }
}

export function renameSession(session: Session, name: string): Session {
  return { ...session, name }
}

export function updateInput(session: Session, input: string): Session {
  return input === session.input ? session : { ...session, input, analysis: analyzeFormula(input) }
}

export function normalizeInput(session: Session): Session {
  return updateInput(session, normalizeFormula(session.input))
}

export function getTree(session: Session): TreeSnapshot {
  return {
    root: session.analysis.tree,
    cursor: session.analysis.cursor,
    offsets: session.offsets,
    isComplete: session.analysis.isComplete,
  }
}

export function getSteps(session: Session): readonly BuildStep[] {
  return session.analysis.steps
}

export function getStep(session: Session, index: number): BuildStep | undefined {
  return session.analysis.steps[index]
}

export function getStepTree(session: Session, index: number): TreeSnapshot | undefined {
  const step = session.analysis.steps[index]

  if (step === undefined) {
    return undefined
  }

  return {
    root: step.tree,
    cursor: step.cursor,
    offsets: session.offsets,
    isComplete: isComplete(step.cursor),
  }
}

export function getDiagnostics(session: Session): readonly Diagnostic[] {
  return session.analysis.diagnostics
}

export function getAllowedNext(session: Session): readonly TokenKind[] {
  return session.analysis.allowedNext
}

export function moveNode(session: Session, nodeId: NodeId, offset: Point): Session {
  const kept = Object.entries(session.offsets).filter(([id]) => id !== nodeId)
  const entries = isOrigin(offset) ? kept : [...kept, [nodeId, offset] as const]

  return { ...session, offsets: Object.fromEntries(entries) }
}

export function resetOffsets(session: Session): Session {
  return { ...session, offsets: {} }
}

export function getVariables(session: Session): readonly string[] {
  return variablesOf(session.analysis.tree)
}

export function assignVariable(
  session: Session,
  name: string,
  value: TruthValue | undefined,
): Session {
  const kept = Object.entries(session.interpretation).filter(([variable]) => variable !== name)
  const entries = value === undefined ? kept : [...kept, [name, value] as const]

  return { ...session, interpretation: Object.fromEntries(entries) }
}

export function clearInterpretation(session: Session): Session {
  return { ...session, interpretation: {} }
}

export function evaluateSession(session: Session): Evaluation {
  return evaluateTree(session.analysis.tree, session.interpretation)
}
