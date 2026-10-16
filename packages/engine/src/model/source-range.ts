export type SourceRange = {
  readonly start: number
  readonly end: number
}

export function createRange(start: number, end: number): SourceRange {
  return { start, end }
}

export function singleCharacterRange(start: number): SourceRange {
  return { start, end: start + 1 }
}

export function mergeRanges(first: SourceRange, second: SourceRange): SourceRange {
  return {
    start: Math.min(first.start, second.start),
    end: Math.max(first.end, second.end),
  }
}
