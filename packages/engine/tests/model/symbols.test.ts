import { describe, expect, it } from 'vitest'
import { CONJUNCTION, CONNECTIVES, NEGATION, isConnective } from '../../src/index'

describe('symbols', () => {
  it('lists the four binary connectives', () => {
    expect(CONNECTIVES).toHaveLength(4)
    expect(CONNECTIVES).toContain(CONJUNCTION)
  })

  it('recognizes a canonical connective symbol', () => {
    expect(isConnective(CONJUNCTION)).toBe(true)
  })

  it('rejects a symbol that is not a binary connective', () => {
    expect(isConnective(NEGATION)).toBe(false)
  })
})
