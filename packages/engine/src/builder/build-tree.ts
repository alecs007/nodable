import { type Diagnostic } from '../model/diagnostic'
import { type Token } from '../model/token'
import { applyToken } from './apply-token'
import { type BuildResult, type BuildState, type BuildStep, createBuildState } from './build-state'

export function buildTree(tokens: readonly Token[]): BuildResult {
  let state: BuildState = createBuildState()
  const steps: BuildStep[] = [{ index: 0, token: null, tree: state.tree, cursor: state.cursor }]
  const diagnostics: Diagnostic[] = []

  for (const token of tokens) {
    const placement = applyToken(state, token)

    if (placement.kind === 'rejected') {
      diagnostics.push(placement.diagnostic)
      break
    }

    state = placement.state
    steps.push({ index: steps.length, token, tree: state.tree, cursor: state.cursor })
  }

  return { steps, tree: state.tree, cursor: state.cursor, diagnostics }
}
