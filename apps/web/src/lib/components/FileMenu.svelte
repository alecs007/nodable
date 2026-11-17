<script lang="ts">
  import {
    type ExportFormat,
    type TableFormat,
    deserializeWorkspace,
    exportSession,
    exportTruthTable,
    serializeWorkspace,
    tabulateSession,
  } from '@nodable/sdk'
  import { prefersReducedMotion } from 'svelte/motion'
  import { SvelteMap } from 'svelte/reactivity'
  import { copyExport, pickTextFile, saveExport } from '../export/files'
  import type { MessageKey } from '../i18n/messages'
  import { locale } from '../state/locale.svelte'
  import { persistence } from '../state/persistence.svelte'
  import { workspace } from '../state/workspace.svelte'
  import Icon, { type IconName } from './Icon.svelte'
  import Modal from './Modal.svelte'

  type Group = 'formula' | 'table' | 'workspace' | 'danger'

  type Status = 'busy' | 'done' | 'failed'

  type Entry = {
    readonly id: string
    readonly group: Group
    readonly icon: IconName
    readonly labelKey: MessageKey
    readonly detail?: string
    readonly doneKey?: MessageKey
    readonly isDisabled?: boolean
    readonly closes?: boolean
    readonly run: () => void | Promise<void>
  }

  const MIN_BUSY = 500
  const DONE_FOR = 2400

  const GROUPS: readonly { readonly id: Group; readonly titleKey: MessageKey | undefined }[] = [
    { id: 'formula', titleKey: 'file.formula' },
    { id: 'table', titleKey: 'file.table' },
    { id: 'workspace', titleKey: 'file.workspace' },
    { id: 'danger', titleKey: undefined },
  ]

  let open = $state(false)
  let announcement = $state('')
  const statuses = new SvelteMap<string, Status>()
  const timers: Record<string, number> = {}

  function captions(): { readonly variants: readonly string[] } {
    return {
      variants: [
        locale.t('outcome.variant', { index: '1' }),
        locale.t('outcome.variant', { index: '2' }),
      ],
    }
  }

  const hasTable = $derived(tabulateSession(workspace.active) !== undefined)

  function downloadTable(format: TableFormat): () => Promise<void> {
    return async () => {
      const result = exportTruthTable(workspace.active, format, {
        true: locale.t('truth.trueletter'),
        false: locale.t('truth.falseletter'),
      })

      if (result === undefined) {
        throw new Error('The formula has no truth table')
      }

      await saveExport(result)
    }
  }

  function download(format: ExportFormat): () => Promise<void> {
    return () => saveExport(exportSession(workspace.active, format, undefined, captions()))
  }

  async function importWorkspace(): Promise<void> {
    const data = await pickTextFile('application/json')

    if (data === undefined) {
      return
    }

    const result = deserializeWorkspace(data)

    if (result.ok) {
      workspace.restore(result.value)
    }
  }

  function exportWorkspace(): Promise<void> {
    return saveExport({
      kind: 'text',
      format: 'json',
      fileName: 'nodable-workspace.json',
      mimeType: 'application/json',
      content: serializeWorkspace(workspace.asWorkspace()),
    })
  }

  const entries: readonly Entry[] = $derived([
    {
      id: 'svg',
      group: 'formula',
      icon: 'image',
      labelKey: 'file.svg',
      detail: '.svg',
      run: download('svg'),
    },
    {
      id: 'png',
      group: 'formula',
      icon: 'image',
      labelKey: 'file.png',
      detail: '.png',
      run: download('png'),
    },
    {
      id: 'latex',
      group: 'formula',
      icon: 'code',
      labelKey: 'file.latex',
      detail: '.tex',
      run: download('latex'),
    },
    {
      id: 'text',
      group: 'formula',
      icon: 'text',
      labelKey: 'file.text',
      detail: '.txt',
      run: download('text'),
    },
    {
      id: 'copy',
      group: 'formula',
      icon: 'copy',
      labelKey: 'file.copy',
      detail: locale.t('file.clipboard'),
      doneKey: 'file.copied',
      run: () => copyExport(exportSession(workspace.active, 'text')),
    },
    {
      id: 'table-latex',
      group: 'table',
      icon: 'table',
      labelKey: 'file.tablelatex',
      detail: hasTable ? '.tex' : locale.t('file.incomplete'),
      isDisabled: !hasTable,
      run: downloadTable('table-latex'),
    },
    {
      id: 'table-csv',
      group: 'table',
      icon: 'table',
      labelKey: 'file.tablecsv',
      detail: hasTable ? '.csv' : locale.t('file.incomplete'),
      isDisabled: !hasTable,
      run: downloadTable('table-csv'),
    },
    {
      id: 'table-markdown',
      group: 'table',
      icon: 'table',
      labelKey: 'file.tablemarkdown',
      detail: hasTable ? '.md' : locale.t('file.incomplete'),
      isDisabled: !hasTable,
      run: downloadTable('table-markdown'),
    },
    {
      id: 'export',
      group: 'workspace',
      icon: 'upload',
      labelKey: 'file.export',
      detail: '.json',
      run: exportWorkspace,
    },
    {
      id: 'import',
      group: 'workspace',
      icon: 'download',
      labelKey: 'file.import',
      detail: '.json',
      closes: true,
      run: importWorkspace,
    },
    {
      id: 'remove',
      group: 'danger',
      icon: 'trash',
      labelKey: 'workspace.remove',
      isDisabled: workspace.sessions.length < 2,
      closes: true,
      run: () => {
        workspace.removeActive()
      },
    },
    {
      id: 'clear',
      group: 'danger',
      icon: 'clear',
      labelKey: 'file.clear',
      closes: true,
      run: async () => {
        workspace.reset()
        await persistence.clear()
      },
    },
  ])

  function delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, milliseconds)
    })
  }

  function detailOf(entry: Entry): string {
    switch (statuses.get(entry.id)) {
      case 'busy':
        return locale.t('file.busy')
      case 'done':
        return locale.t(entry.doneKey ?? 'file.downloaded')
      case 'failed':
        return locale.t('file.failed')
      case undefined:
        return entry.detail ?? ''
    }
  }

  async function perform(entry: Entry, dismiss: () => void): Promise<void> {
    if (entry.closes === true) {
      dismiss()
      await entry.run()

      return
    }

    if (statuses.get(entry.id) === 'busy') {
      return
    }

    window.clearTimeout(timers[entry.id])
    statuses.set(entry.id, 'busy')
    announcement = locale.t('file.busy')

    const started = performance.now()
    let outcome: Status = 'done'

    try {
      await entry.run()
    } catch {
      outcome = 'failed'
    }

    const remaining = MIN_BUSY - (performance.now() - started)

    if (remaining > 0 && !prefersReducedMotion.current) {
      await delay(remaining)
    }

    statuses.set(entry.id, outcome)
    announcement = `${locale.t(entry.labelKey)}: ${detailOf(entry)}`
    timers[entry.id] = window.setTimeout(() => {
      statuses.delete(entry.id)
    }, DONE_FOR)
  }
</script>

<button
  type="button"
  class="files"
  aria-haspopup="dialog"
  title={locale.t('file.label')}
  aria-label={locale.t('file.label')}
  onclick={() => {
    open = true
  }}
>
  <Icon name="transfer" />
  <span>{locale.t('file.label')}</span>
</button>

{#if open}
  <Modal
    title={locale.t('file.label')}
    onclose={() => {
      open = false
    }}
  >
    {#snippet children(dismiss: () => void)}
      {#each GROUPS as group (group.id)}
        <section class="group">
          {#if group.titleKey !== undefined}
            <h3 class="group-title">{locale.t(group.titleKey)}</h3>
          {/if}
          <div class="options {group.id}" class:danger={group.id === 'danger'}>
            {#each entries.filter((entry) => entry.group === group.id) as entry (entry.id)}
              {@const status = statuses.get(entry.id)}
              {@const detail = detailOf(entry)}
              <button
                type="button"
                class="option {status ?? ''}"
                disabled={entry.isDisabled === true}
                aria-busy={status === 'busy'}
                onclick={() => {
                  void perform(entry, dismiss)
                }}
              >
                <span class="glyph" aria-hidden="true">
                  {#if status === 'busy'}
                    <span class="spinner"></span>
                  {:else if status === 'done'}
                    <svg class="check" viewBox="0 0 24 24" focusable="false">
                      <path d="m5 12.5 4.5 4.5L19 7.5" />
                    </svg>
                  {:else if status === 'failed'}
                    <Icon name="clear" />
                  {:else}
                    <Icon name={entry.icon} />
                  {/if}
                </span>
                <span class="text">
                  <span class="label">{locale.t(entry.labelKey)}</span>
                  {#if detail !== ''}
                    <span class="detail">{detail}</span>
                  {/if}
                </span>
              </button>
            {/each}
          </div>
        </section>
      {/each}
      <p class="sr-only" aria-live="polite">{announcement}</p>
    {/snippet}
  </Modal>
{/if}

<style>
  .files {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    block-size: 2.5rem;
    padding-inline: var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    background: var(--color-surface-sunken);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: 0.875rem;
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
    transition:
      background var(--duration-short) var(--ease),
      border-color var(--duration-short) var(--ease);
  }

  @media (hover: hover) {
    .files:hover {
      border-color: var(--color-accent);
      color: var(--color-accent);
    }
  }

  .group {
    display: grid;
    gap: var(--space-2);
  }

  .group-title {
    margin: 0;
    padding-inline: var(--space-1);
    color: var(--color-text-muted);
    font-size: 0.8125rem;
    font-weight: 600;
  }

  .options {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-1);
    padding: var(--space-1);
    border-radius: var(--radius-3);
    background: var(--color-surface-sunken);
  }

  .option {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--space-3);
    align-items: center;
    min-block-size: 3.25rem;
    padding: var(--space-2) var(--space-3);
    border: 1px solid transparent;
    border-radius: var(--radius-2);
    background: transparent;
    color: var(--color-text);
    font-family: var(--font-sans);
    text-align: start;
    cursor: pointer;
    transition:
      background var(--duration-short) var(--ease),
      border-color var(--duration-short) var(--ease);
  }

  .option:hover:not(:disabled) {
    background: var(--color-surface-raised);
  }

  .option:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .option.busy {
    cursor: progress;
  }

  .option.done {
    border-color: var(--color-true);
    background: var(--color-true-soft);
  }

  .option.failed {
    border-color: var(--color-false);
    background: var(--color-false-soft);
  }

  .glyph {
    display: grid;
    place-items: center;
    inline-size: 2.25rem;
    block-size: 2.25rem;
    border-radius: 50%;
    background: var(--color-surface-raised);
    color: var(--color-accent);
    transition:
      background var(--duration-short) var(--ease),
      color var(--duration-short) var(--ease);
  }

  .done .glyph {
    background: var(--color-true);
    color: var(--color-surface-raised);
  }

  .failed .glyph {
    background: var(--color-false);
    color: var(--color-surface-raised);
  }

  .danger .glyph,
  .danger .label {
    color: var(--color-error);
  }

  .spinner {
    inline-size: 1.125rem;
    block-size: 1.125rem;
    border: 2px solid var(--color-border);
    border-block-start-color: var(--color-accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  .check {
    inline-size: 1.125rem;
    block-size: 1.125rem;
    fill: none;
    stroke: currentcolor;
    stroke-width: 2.6;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 24;
    animation: draw 320ms var(--ease) both;
  }

  .text {
    display: grid;
    gap: 1px;
    min-inline-size: 0;
  }

  .label {
    overflow: hidden;
    font-size: 0.9375rem;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .detail {
    overflow: hidden;
    color: var(--color-text-muted);
    font-size: 0.8125rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .done .detail {
    color: var(--color-true);
    font-weight: 600;
  }

  .failed .detail {
    color: var(--color-false);
    font-weight: 600;
  }

  @keyframes spin {
    to {
      rotate: 360deg;
    }
  }

  @keyframes draw {
    from {
      stroke-dashoffset: 24;
    }

    to {
      stroke-dashoffset: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .spinner {
      animation-duration: 2s;
    }

    .check {
      animation: none;
    }
  }

  @media (width <= 48rem) {
    .files {
      flex: 1 1 auto;
      justify-content: center;
      min-inline-size: 2.25rem;
      block-size: 2.25rem;
      padding-inline: var(--space-2);
    }

    .files :global(.icon) {
      flex: none;
    }

    .files span {
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  @media (width <= 30rem) {
    .files span {
      display: none;
    }
  }

  @media (width <= 40rem) {
    .options {
      grid-template-columns: minmax(0, 1fr);
    }

    .options.formula,
    .options.table {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .option {
      gap: var(--space-2);
      min-block-size: 2.75rem;
      padding: var(--space-1) var(--space-2);
    }

    .glyph {
      inline-size: 2rem;
      block-size: 2rem;
    }

    .label {
      font-size: 0.875rem;
    }

    .detail {
      font-size: 0.75rem;
    }
  }
</style>
