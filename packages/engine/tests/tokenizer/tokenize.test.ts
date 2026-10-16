import { describe, expect, it } from 'vitest'
import {
  CONJUNCTION,
  DISJUNCTION,
  EQUIVALENCE,
  IMPLICATION,
  type Token,
  tokenize,
} from '../../src/index'

function kinds(input: string): readonly string[] {
  return tokenize(input).tokens.map((token) => token.kind)
}

function only(input: string): Token {
  const [token] = tokenize(input).tokens

  if (token === undefined) {
    throw new Error(`expected one token for ${input}`)
  }

  return token
}

describe('tokenize', () => {
  it('returns no tokens for an empty input', () => {
    expect(tokenize('')).toEqual({ tokens: [], diagnostics: [] })
  })

  it('ignores whitespace between tokens', () => {
    expect(kinds('  (  p  )  ')).toEqual(['open-paren', 'variable', 'close-paren'])
  })

  it('reads parentheses with their source range', () => {
    expect(tokenize('()').tokens).toEqual([
      { kind: 'open-paren', range: { start: 0, end: 1 } },
      { kind: 'close-paren', range: { start: 1, end: 2 } },
    ])
  })

  it('reads a variable as a lowercase letter followed by digits', () => {
    expect(only('r12')).toEqual({ kind: 'variable', name: 'r12', range: { start: 0, end: 3 } })
  })

  it('reads adjacent letters as separate variables', () => {
    expect(tokenize('pq').tokens).toEqual([
      { kind: 'variable', name: 'p', range: { start: 0, end: 1 } },
      { kind: 'variable', name: 'q', range: { start: 1, end: 2 } },
    ])
  })

  it.each(['¬', '!', '~'])('reads %s as a negation', (alias) => {
    expect(only(alias)).toEqual({ kind: 'negation', range: { start: 0, end: 1 } })
  })

  it.each([
    ['∧', CONJUNCTION],
    ['&', CONJUNCTION],
    ['/\\', CONJUNCTION],
    ['∨', DISJUNCTION],
    ['|', DISJUNCTION],
    ['\\/', DISJUNCTION],
    ['→', IMPLICATION],
    ['->', IMPLICATION],
    ['=>', IMPLICATION],
    ['↔', EQUIVALENCE],
    ['<->', EQUIVALENCE],
    ['<=>', EQUIVALENCE],
  ])('reads %s as the connective %s', (alias, symbol) => {
    expect(only(alias)).toEqual({
      kind: 'connective',
      symbol,
      range: { start: 0, end: alias.length },
    })
  })

  it('prefers the longest matching connective alias', () => {
    expect(only('<->')).toMatchObject({ symbol: EQUIVALENCE })
    expect(only('<=>')).toMatchObject({ symbol: EQUIVALENCE })
  })

  it('reports an unknown character and stops', () => {
    const result = tokenize('p # q')

    expect(result.tokens.map((token) => token.kind)).toEqual(['variable'])
    expect(result.diagnostics).toEqual([
      {
        code: 'NDB001',
        severity: 'error',
        range: { start: 2, end: 3 },
        messageKey: 'diagnostic.ndb001',
      },
    ])
  })

  it('reads an uppercase letter as a variable', () => {
    expect(only('P1')).toEqual({ kind: 'variable', name: 'P1', range: { start: 0, end: 2 } })
  })

  it('reports a digit without a preceding letter as an unknown character', () => {
    expect(tokenize('1').diagnostics[0]?.code).toBe('NDB001')
  })

  it('tokenizes a full formula', () => {
    expect(kinds('((¬p) ∨ q)')).toEqual([
      'open-paren',
      'open-paren',
      'negation',
      'variable',
      'close-paren',
      'connective',
      'variable',
      'close-paren',
    ])
  })
})
