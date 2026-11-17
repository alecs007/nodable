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

  let body: HTMLTableSectionElement | undefined = $state()
  let head: HTMLTableRowElement | undefined = $state()
  let offsets = $state<readonly number[]>([])

  $effect(() => {
    const row = head
    const pinned = table.variables.length + 1

    if (row === undefined) {
      return
    }

    function measure(): void {
      if (row === undefined) {
        return
      }

      const cells = [...row.children].slice(0, pinned) as HTMLElement[]
      let left = 0

      offsets = cells.map((cell) => {
        const start = left

        left += cell.offsetWidth

        return start
      })
    }

    const observer = new ResizeObserver(measure)

    measure()
    observer.observe(row)

    return () => {
      observer.disconnect()
    }
  })

  function leftOf(column: number): string | undefined {
    const left = offsets[column]

    return left === undefined ? undefined : `${String(left)}px`
  }

  $effect(() => {
    const rows = body

    if (rows === undefined) {
      return
    }

    function onRowClick(event: MouseEvent): void {
      const row = (event.target as Element).closest<HTMLElement>('tr[data-row]')
      const picked = table.rows[Number(row?.dataset['row'])]

      if (picked !== undefined) {
        onuse(picked.interpretation)
      }
    }

    rows.addEventListener('click', onRowClick)

    return () => {
      rows.removeEventListener('click', onRowClick)
    }
  })

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
      <tr bind:this={head}>
        <th scope="col" class="index pin" style:left={leftOf(0)}>
          <span class="sr-only">#</span>
        </th>
        {#each table.variables as name, column (name)}
          <th
            scope="col"
            class="variable pin"
            class:edge={column === table.variables.length - 1}
            style:left={leftOf(column + 1)}
          >
            {name}
          </th>
        {/each}
        {#each table.columns as column, index (column.id)}
          <th scope="col" class:final={index === last}>
            {formulaOf(column)}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody bind:this={body}>
      {#each table.rows as row, index (index)}
        <tr class:current={isCurrent(row)} data-row={index}>
          <th scope="row" class="index pin" style:left={leftOf(0)}>
            <button type="button" class="load" title={locale.t('table.use')}>
              {index + 1}
            </button>
          </th>
          {#each table.variables as name, column (name)}
            {@const value = valueOfVariable(row.interpretation, name) === true}
            <td
              class="variable pin"
              class:edge={column === table.variables.length - 1}
              class:yes={value}
              class:no={!value}
              style:left={leftOf(column + 1)}
            >
              {letterOf(value)}
            </td>
          {/each}
          {#each row.values as value, column (column)}
            <td class:final={column === last} class:yes={value} class:no={!value}>
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
    cursor: pointer;
    transition: background var(--duration-short) var(--ease);
  }

  tbody tr:last-child th,
  tbody tr:last-child td {
    border-block-end: none;
  }

  @media (hover: hover) {
    tbody tr:hover,
    tbody tr:hover .pin {
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

  .pin {
    position: sticky;
    z-index: 1;
  }

  thead .pin {
    z-index: 2;
  }

  tbody .pin {
    background: var(--color-surface-raised);
    transition: background var(--duration-short) var(--ease);
  }

  tbody tr.current .pin {
    background: var(--color-accent-soft);
  }

  .edge {
    box-shadow: inset -2px 0 0 var(--color-border-strong);
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
