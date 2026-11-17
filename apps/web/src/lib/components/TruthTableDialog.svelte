<script lang="ts">
  import {
    type Interpretation,
    type Session,
    type TableFormat,
    MAX_TABLE_VARIABLES,
    exportTruthTable,
    tabulateSession,
  } from '@nodable/sdk'
  import { SvelteSet } from 'svelte/reactivity'
  import { saveExport } from '../export/files'
  import type { MessageKey } from '../i18n/messages'
  import { locale } from '../state/locale.svelte'
  import Icon, { type IconName } from './Icon.svelte'
  import Modal from './Modal.svelte'
  import TruthTable from './TruthTable.svelte'

  type Props = {
    session: Session
    interpretation: Interpretation
    onuse: (interpretation: Interpretation) => void
    onclose: () => void
  }

  const { session, interpretation, onuse, onclose }: Props = $props()

  const SAVED_FOR = 1800

  type Format = {
    readonly format: TableFormat
    readonly icon: IconName
    readonly labelKey: MessageKey
  }

  const FORMATS: readonly Format[] = [
    { format: 'table-latex', icon: 'code', labelKey: 'file.latex' },
    { format: 'table-csv', icon: 'table', labelKey: 'table.csv' },
    { format: 'table-markdown', icon: 'text', labelKey: 'table.markdown' },
  ]

  const saved = new SvelteSet<TableFormat>()
  const table = $derived(tabulateSession(session))
  const letters = $derived({
    true: locale.t('truth.trueletter'),
    false: locale.t('truth.falseletter'),
  })

  async function save(format: TableFormat): Promise<void> {
    const result = exportTruthTable(session, format, letters)

    if (result === undefined) {
      return
    }

    await saveExport(result)
    saved.add(format)
    window.setTimeout(() => {
      saved.delete(format)
    }, SAVED_FOR)
  }
</script>

<Modal title={locale.t('table.open')} isWide {onclose}>
  {#snippet children(dismiss: () => void)}
    {#if table === undefined}
      <p class="note">{locale.t('table.toomany', { max: String(MAX_TABLE_VARIABLES) })}</p>
    {:else}
      <div class="tools">
        <span class="label">{locale.t('table.export')}</span>
        {#each FORMATS as entry (entry.format)}
          <button
            type="button"
            class="chip"
            class:saved={saved.has(entry.format)}
            onclick={() => {
              void save(entry.format)
            }}
          >
            <Icon name={saved.has(entry.format) ? 'check' : entry.icon} />
            {locale.t(entry.labelKey)}
          </button>
        {/each}
      </div>
      <TruthTable
        {table}
        {interpretation}
        {letters}
        onuse={(values: Interpretation) => {
          onuse(values)
          dismiss()
        }}
      />
    {/if}
  {/snippet}
</Modal>

<style>
  .note {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.9375rem;
  }

  .tools {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
  }

  .label {
    margin-inline-end: var(--space-1);
    color: var(--color-text-muted);
    font-size: 0.8125rem;
    font-weight: 600;
  }

  .chip {
    display: inline-flex;
    gap: var(--space-1);
    align-items: center;
    block-size: 2rem;
    padding-inline: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      border-color var(--duration-short) var(--ease),
      background var(--duration-short) var(--ease),
      color var(--duration-short) var(--ease);
  }

  @media (hover: hover) {
    .chip:hover {
      border-color: var(--color-accent);
      color: var(--color-accent);
    }
  }

  .chip.saved {
    border-color: var(--color-true);
    background: var(--color-true-soft);
    color: var(--color-true);
  }
</style>
