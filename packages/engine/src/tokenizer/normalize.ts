import { CONNECTIVE_ALIASES, NEGATION, NEGATION_ALIASES } from '../model/symbols'

export function normalizeFormula(input: string): string {
  let result = ''
  let index = 0

  while (index < input.length) {
    const character = input.charAt(index)
    const alias = CONNECTIVE_ALIASES.find((candidate) => input.startsWith(candidate.text, index))

    if (alias !== undefined) {
      result += alias.symbol
      index += alias.text.length
      continue
    }

    result += NEGATION_ALIASES.includes(character) ? NEGATION : character
    index += 1
  }

  return result
}
