import { describe, expect, it } from 'vitest'
import {
  type TruthTable,
  createSession,
  exportTruthTable,
  latexFormulaOf,
  tabulateSession,
  toTableCsv,
  toTableLatex,
  toTableMarkdown,
} from '../../src/index'

function tableOf(input: string): TruthTable {
  const table = tabulateSession(createSession(input))

  if (table === undefined) {
    throw new Error(`no table for ${input}`)
  }

  return table
}

const ROMANIAN = { true: 'A', false: 'F' }

describe('tabulateSession', () => {
  it('tabulates a complete formula', () => {
    expect(tableOf('(p → q)').rows).toHaveLength(4)
  })

  it('gives no table for an unfinished formula', () => {
    expect(tabulateSession(createSession('(p →'))).toBeUndefined()
  })
})

describe('toTableMarkdown', () => {
  it('aligns the variables and every subformula in columns', () => {
    expect(toTableMarkdown(tableOf('((¬p) ∨ q)'))).toBe(
      [
        '| p   | q   | (¬p) | ((¬p) ∨ q) |',
        '| :-: | :-: | :--: | :--------: |',
        '| T   | T   | F    | T          |',
        '| T   | F   | F    | F          |',
        '| F   | T   | T    | T          |',
        '| F   | F   | T    | T          |',
        '',
      ].join('\n'),
    )
  })

  it('writes the letters it is given', () => {
    expect(toTableMarkdown(tableOf('p'), ROMANIAN)).toBe(
      ['| p   |', '| :-: |', '| A   |', '| F   |', ''].join('\n'),
    )
  })
})

describe('toTableCsv', () => {
  it('writes a header and one line per interpretation', () => {
    expect(toTableCsv(tableOf('(p ∧ q)'), ROMANIAN)).toBe(
      ['\uFEFFp,q,(p ∧ q)', 'A,A,A', 'A,F,F', 'F,A,F', 'F,F,F', ''].join('\n'),
    )
  })

  it('quotes a cell that holds a comma or a quote', () => {
    const table: TruthTable = { variables: ['a,b', 'c"d'], columns: [], rows: [] }

    expect(toTableCsv(table)).toBe('\uFEFF"a,b","c""d"\n')
  })
})

describe('toTableLatex', () => {
  it('separates the variables from the subformulas', () => {
    expect(toTableLatex(tableOf('(p ↔ (¬q))'))).toBe(
      [
        '\\begin{tabular}{cc|cc}',
        '$p$ & $q$ & $(\\lnot q)$ & $(p \\leftrightarrow (\\lnot q))$ \\\\',
        '\\hline',
        'T & T & F & F \\\\',
        'T & F & T & T \\\\',
        'F & T & F & T \\\\',
        'F & F & T & F \\\\',
        '\\end{tabular}',
      ].join('\n'),
    )
  })

  it('draws no separator when there are no subformulas', () => {
    expect(toTableLatex(tableOf('p'))).toContain('\\begin{tabular}{c}')
  })
})

describe('latexFormulaOf', () => {
  it('writes every connective as a LaTeX command', () => {
    expect(latexFormulaOf(createSession('((p ∧ q) → (r ∨ s))').analysis.tree)).toBe(
      '((p \\land q) \\rightarrow (r \\lor s))',
    )
  })

  it('marks what is still missing', () => {
    expect(latexFormulaOf(createSession('(p').analysis.tree)).toBe('(p \\square)')
    expect(latexFormulaOf(createSession('').analysis.tree)).toBe('\\square')
  })
})

describe('exportTruthTable', () => {
  const session = createSession('(p ∧ q)', 'Lecture 4')

  it('names the file after the formula', () => {
    expect(exportTruthTable(session, 'table-latex')).toMatchObject({
      kind: 'text',
      format: 'table-latex',
      fileName: 'lecture-4-table.tex',
      mimeType: 'text/x-tex',
    })
    expect(exportTruthTable(session, 'table-csv')?.fileName).toBe('lecture-4-table.csv')
    expect(exportTruthTable(session, 'table-markdown', ROMANIAN)).toMatchObject({
      fileName: 'lecture-4-table.md',
      mimeType: 'text/markdown',
    })
  })

  it('gives nothing for an unfinished formula', () => {
    expect(exportTruthTable(createSession('(p ∧'), 'table-csv')).toBeUndefined()
  })
})
