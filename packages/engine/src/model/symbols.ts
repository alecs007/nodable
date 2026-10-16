export const NEGATION = '¬'
export const CONJUNCTION = '∧'
export const DISJUNCTION = '∨'
export const IMPLICATION = '→'
export const EQUIVALENCE = '↔'
export const OPEN_PAREN = '('
export const CLOSE_PAREN = ')'

export type Negation = typeof NEGATION

export type Connective =
  typeof CONJUNCTION | typeof DISJUNCTION | typeof IMPLICATION | typeof EQUIVALENCE

export const CONNECTIVES: readonly Connective[] = [
  CONJUNCTION,
  DISJUNCTION,
  IMPLICATION,
  EQUIVALENCE,
]

export const NEGATION_ALIASES: readonly string[] = [NEGATION, '!', '~']

export type ConnectiveAlias = {
  readonly text: string
  readonly symbol: Connective
}

export const CONNECTIVE_ALIASES: readonly ConnectiveAlias[] = [
  { text: '<->', symbol: EQUIVALENCE },
  { text: '<=>', symbol: EQUIVALENCE },
  { text: '->', symbol: IMPLICATION },
  { text: '=>', symbol: IMPLICATION },
  { text: '/\\', symbol: CONJUNCTION },
  { text: '\\/', symbol: DISJUNCTION },
  { text: '&', symbol: CONJUNCTION },
  { text: '|', symbol: DISJUNCTION },
  { text: CONJUNCTION, symbol: CONJUNCTION },
  { text: DISJUNCTION, symbol: DISJUNCTION },
  { text: IMPLICATION, symbol: IMPLICATION },
  { text: EQUIVALENCE, symbol: EQUIVALENCE },
]

export function isConnective(value: string): value is Connective {
  return CONNECTIVES.some((connective) => connective === value)
}
