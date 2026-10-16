import { type SourceRange } from './source-range'
import { type Connective } from './symbols'

export type TokenKind = 'open-paren' | 'close-paren' | 'negation' | 'connective' | 'variable'

export type OpenParenToken = {
  readonly kind: 'open-paren'
  readonly range: SourceRange
}

export type CloseParenToken = {
  readonly kind: 'close-paren'
  readonly range: SourceRange
}

export type NegationToken = {
  readonly kind: 'negation'
  readonly range: SourceRange
}

export type ConnectiveToken = {
  readonly kind: 'connective'
  readonly symbol: Connective
  readonly range: SourceRange
}

export type VariableToken = {
  readonly kind: 'variable'
  readonly name: string
  readonly range: SourceRange
}

export type Token =
  OpenParenToken | CloseParenToken | NegationToken | ConnectiveToken | VariableToken

export const TOKEN_KINDS: readonly TokenKind[] = [
  'open-paren',
  'close-paren',
  'negation',
  'connective',
  'variable',
]
