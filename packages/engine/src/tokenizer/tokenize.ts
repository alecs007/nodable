import { createDiagnostic, type Diagnostic } from '../model/diagnostic'
import { singleCharacterRange, type SourceRange } from '../model/source-range'
import {
  CLOSE_PAREN,
  CONNECTIVE_ALIASES,
  type Connective,
  NEGATION_ALIASES,
  OPEN_PAREN,
} from '../model/symbols'
import { type Token } from '../model/token'

const WHITESPACE = /\s/
const VARIABLE_START = /[A-Za-z]/
const DIGIT = /[0-9]/

export type TokenizeResult = {
  readonly tokens: readonly Token[]
  readonly diagnostics: readonly Diagnostic[]
}

type ConnectiveMatch = {
  readonly symbol: Connective
  readonly length: number
}

function matchConnective(input: string, index: number): ConnectiveMatch | undefined {
  for (const alias of CONNECTIVE_ALIASES) {
    if (input.startsWith(alias.text, index)) {
      return { symbol: alias.symbol, length: alias.text.length }
    }
  }

  return undefined
}

function readVariableEnd(input: string, start: number): number {
  let end = start + 1

  while (end < input.length && DIGIT.test(input.charAt(end))) {
    end += 1
  }

  return end
}

export function tokenize(input: string): TokenizeResult {
  const tokens: Token[] = []
  let index = 0

  while (index < input.length) {
    const character = input.charAt(index)

    if (WHITESPACE.test(character)) {
      index += 1
      continue
    }

    if (character === OPEN_PAREN) {
      tokens.push({ kind: 'open-paren', range: singleCharacterRange(index) })
      index += 1
      continue
    }

    if (character === CLOSE_PAREN) {
      tokens.push({ kind: 'close-paren', range: singleCharacterRange(index) })
      index += 1
      continue
    }

    if (NEGATION_ALIASES.includes(character)) {
      tokens.push({ kind: 'negation', range: singleCharacterRange(index) })
      index += 1
      continue
    }

    const connective = matchConnective(input, index)

    if (connective !== undefined) {
      const range: SourceRange = { start: index, end: index + connective.length }
      tokens.push({ kind: 'connective', symbol: connective.symbol, range })
      index += connective.length
      continue
    }

    if (VARIABLE_START.test(character)) {
      const end = readVariableEnd(input, index)
      const range: SourceRange = { start: index, end }
      tokens.push({ kind: 'variable', name: input.slice(index, end), range })
      index = end
      continue
    }

    return {
      tokens,
      diagnostics: [createDiagnostic('NDB001', singleCharacterRange(index))],
    }
  }

  return { tokens, diagnostics: [] }
}
