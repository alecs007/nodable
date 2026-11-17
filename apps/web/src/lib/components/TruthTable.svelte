<script lang="ts">
  import {
    type Interpretation,
    type TruthTable,
    type TruthTableRow,
    type TruthValue,
    formulaOf,
    valueOfVariable,
  } from '@nodable/sdk'
  import type { TruthLetters } from '../interpretation/computation'
  import { locale } from '../state/locale.svelte'

  type Props = {
    table: TruthTable
    interpretation: Interpretation
    letters: TruthLetters
    onuse: (interpretation: Interpretation) => void
  }

  const { table, interpretation, letters, onuse }: Props = $props()

  const last = $derived(table.columns.length - 1)

  function isCurrent(row: TruthTableRow): boolean {
    return table.variables.every(
      (name) => valueOfVariable(interpretation, name) === valueOfVariable(row.interpretation, name),
    )
  }

  function letterOf(value: TruthValue): string {
    return value ? letters.true : letters.false
  }
</script>

<div class="scroller">
  <table class="table">
    <thead>
      <tr>
        <th scope="col" class="index"><span class="sr-only">#</span></th>
        {#each table.variables as name (name)}
          <th scope="col" class="variable">{name}</th>
        {/each}
        {#each table.columns as column, index (column.id)}
          <th scope="col" class:split={index === 0} class:final={index === last}>
            {formulaOf(column)}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each table.rows as row, index (index)}
        <tr class:current={isCurrent(row)}>
          <th scope="row" class="index">
            <button
              type="button"
              class="load"
              title={locale.t('table.use')}
              onclick={() => {
                onuse(row.interpretation)
              }}
            >
              {index + 1}
            </button>
          </th>
          {#each table.variables as name (name)}
            {@const value = valueOfVariable(row.interpretation, name) === true}
            <td class="variable" class:yes={value} class:no={!value}>{letterOf(value)}</td>
          {/each}
          {#each row.values as value, column (column)}
            <td
              class:split={column === 0}
              class:final={column === last}
              class:yes={value}
              class:no={!value}
            >
              {letterOf(value)}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .scroller {
    max-block-size: min(30rem, calc(100dvh - 15rem));
    overflow: auto;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-2);
    overscroll-behavior: contain;
  }

  .table {
    min-inline-size: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-family: var(--font-mono);
    font-size: 0.875rem;
    text-align: center;
  }

  th,
  td {
    padding: var(--space-2) var(--space-3);
    border-block-end: 1px solid var(--color-border);
    white-space: nowrap;
  }

  thead th {
    position: sticky;
    inset-block-start: 0;
    z-index: 1;
    background: var(--color-surface-sunken);
    color: var(--color-text);
    font-weight: 600;
  }

  tbody tr {
    position: relative;
    transition: background var(--duration-short) var(--ease);
  }

  tbody tr:last-child th,
  tbody tr:last-child td {
    border-block-end: none;
  }

  @media (hover: hover) {
    tbody tr:hover {
      background: var(--color-surface-sunken);
    }
  }

  tbody tr.current {
    background: var(--color-accent-soft);
  }

  .index {
    inline-size: 1%;
    padding-inline: var(--space-2);
    color: var(--color-text-muted);
    font-family: var(--font-sans);
    font-size: 0.75rem;
    font-weight: 500;
  }

  .load {
    padding: 0;
    border: none;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  .load::after {
    position: absolute;
    inset: 0;
    content: '';
  }

  .load:focus-visible {
    outline: none;
  }

  tbody tr:has(.load:focus-visible) {
    outline: 2px solid var(--color-focus);
    outline-offset: -2px;
  }

  .variable {
    font-weight: 600;
  }

  .split {
    border-inline-start: 2px solid var(--color-border-strong);
  }

  .yes {
    color: var(--color-true);
  }

  .no {
    color: var(--color-false);
  }

  td.final {
    background: color-mix(in srgb, var(--color-accent-soft) 60%, transparent);
    font-weight: 700;
  }

  thead th.final {
    color: var(--color-accent);
  }

  @media (width <= 40rem) {
    .scroller {
      max-block-size: calc(80dvh - 12rem);
    }

    th,
    td {
      padding: var(--space-2);
      font-size: 0.8125rem;
    }
  }
</style>
