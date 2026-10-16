import { applyToken } from '../builder/apply-token'
import { type BuildState } from '../builder/build-state'
import { CONJUNCTION } from '../model/symbols'
import { TOKEN_KINDS, type Token, type TokenKind } from '../model/token'

const PROBE_RANGE = { start: 0, end: 0 }

const PROBE_TOKENS: Record<TokenKind, Token> = {
  'open-paren': { kind: 'open-paren', range: PROBE_RANGE },
  'close-paren': { kind: 'close-paren', range: PROBE_RANGE },
  negation: { kind: 'negation', range: PROBE_RANGE },
  connective: { kind: 'connective', symbol: CONJUNCTION, range: PROBE_RANGE },
  variable: { kind: 'variable', name: 'p', range: PROBE_RANGE },
}

export function allowedNextTokens(state: BuildState): readonly TokenKind[] {
  return TOKEN_KINDS.filter((kind) => applyToken(state, PROBE_TOKENS[kind]).kind === 'placed')
}
