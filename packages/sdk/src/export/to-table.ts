import { type TreeNode, type TruthTable, type TruthValue, valueOfVariable } from '@nodable/engine'
import { formulaOf } from './to-formula'
import { latexFormulaOf } from './to-latex'

export type TableLetters = {
  readonly true: string
  readonly false: string
}

export const DEFAULT_TABLE_LETTERS: TableLetters = { true: 'T', false: 'F' }

const BYTE_ORDER_MARK = '\uFEFF'

type Grid = {
  readonly header: readonly string[]
  readonly rows: readonly (readonly string[])[]
}

function letterOf(value: TruthValue, letters: TableLetters): string {
  return value ? letters.true : letters.false
}

function gridOf(
  table: TruthTable,
  letters: TableLetters,
  variableLabel: (name: string) => string,
  columnLabel: (column: TreeNode) => string,
): Grid {
  return {
    header: [...table.variables.map(variableLabel), ...table.columns.map(columnLabel)],
    rows: table.rows.map((row) => [
      ...table.variables.map((name) =>
        letterOf(valueOfVariable(row.interpretation, name) === true, letters),
      ),
      ...row.values.map((value) => letterOf(value, letters)),
    ]),
  }
}

function plainGrid(table: TruthTable, letters: TableLetters): Grid {
  return gridOf(table, letters, (name) => name, formulaOf)
}

function quoteCsv(cell: string): string {
  return /[",\n]/.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell
}

export function toTableCsv(
  table: TruthTable,
  letters: TableLetters = DEFAULT_TABLE_LETTERS,
): string {
  const grid = plainGrid(table, letters)

  return `${BYTE_ORDER_MARK}${[grid.header, ...grid.rows].map((row) => row.map(quoteCsv).join(',')).join('\n')}\n`
}

export function toTableMarkdown(
  table: TruthTable,
  letters: TableLetters = DEFAULT_TABLE_LETTERS,
): string {
  const grid = plainGrid(table, letters)
  const widths = grid.header.map((cell, column) =>
    Math.max(3, cell.length, ...grid.rows.map((row) => (row[column] ?? '').length)),
  )

  function line(cells: readonly string[]): string {
    return `| ${cells.map((cell, column) => cell.padEnd(widths[column] ?? 0)).join(' | ')} |`
  }

  const divider = `| ${widths.map((width) => `:${'-'.repeat(width - 2)}:`).join(' | ')} |`

  return `${[line(grid.header), divider, ...grid.rows.map(line)].join('\n')}\n`
}

export function toTableLatex(
  table: TruthTable,
  letters: TableLetters = DEFAULT_TABLE_LETTERS,
): string {
  const grid = gridOf(
    table,
    letters,
    (name) => `$${name}$`,
    (column) => `$${latexFormulaOf(column)}$`,
  )
  const variables = 'c'.repeat(table.variables.length)
  const spec =
    table.columns.length === 0 ? variables : `${variables}|${'c'.repeat(table.columns.length)}`

  return [
    `\\begin{tabular}{${spec}}`,
    `${grid.header.join(' & ')} \\\\`,
    '\\hline',
    ...grid.rows.map((row) => `${row.join(' & ')} \\\\`),
    '\\end{tabular}',
  ].join('\n')
}
