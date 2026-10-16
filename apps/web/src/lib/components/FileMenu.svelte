<script lang="ts">
  import {
    type ExportFormat,
    deserializeWorkspace,
    exportSession,
    serializeWorkspace,
  } from '@nodable/sdk'
  import { copyExport, pickTextFile, saveExport } from '../export/files'
  import type { MessageKey } from '../i18n/messages'
  import { locale } from '../state/locale.svelte'
  import { persistence } from '../state/persistence.svelte'
  import { workspace } from '../state/workspace.svelte'
  import Icon from './Icon.svelte'

  type Entry = {
    readonly id: string
    readonly labelKey: MessageKey
    readonly run: () => void | Promise<void>
  }

  let open = $state(false)
  let container: HTMLDivElement | undefined = $state()

  function close(): void {
    open = false
  }

  function download(format: ExportFormat): () => Promise<void> {
    return () => saveExport(exportSession(workspace.active, format))
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

  const entries: readonly Entry[] = [
    { id: 'svg', labelKey: 'file.svg', run: download('svg') },
    { id: 'png', labelKey: 'file.png', run: download('png') },
    { id: 'latex', labelKey: 'file.latex', run: download('latex') },
    { id: 'text', labelKey: 'file.text', run: download('text') },
    {
      id: 'copy',
      labelKey: 'file.copy',
      run: () => copyExport(exportSession(workspace.active, 'text')),
    },
    { id: 'export', labelKey: 'file.export', run: exportWorkspace },
    { id: 'import', labelKey: 'file.import', run: importWorkspace },
    { id: 'clear', labelKey: 'file.clear', run: () => persistence.clear() },
  ]

  function onWindowPointerDown(event: PointerEvent): void {
    if (open && container !== undefined && !container.contains(event.target as Node)) {
      close()
    }
  }
</script>

<svelte:window
  onpointerdown={onWindowPointerDown}
  onkeydown={(event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      close()
    }
  }}
/>

<div class="menu" bind:this={container}>
  <button
    type="button"
    class="key"
    class:on={open}
    aria-haspopup="menu"
    aria-expanded={open}
    title={locale.t('file.label')}
    aria-label={locale.t('file.label')}
    onclick={() => {
      open = !open
    }}
  >
    <Icon name="save" />
  </button>

  {#if open}
    <ul class="list" role="menu" aria-label={locale.t('file.label')}>
      {#each entries as entry (entry.id)}
        <li role="none" class:divided={entry.id === 'export'}>
          <button
            type="button"
            class="entry"
            role="menuitem"
            onclick={() => {
              close()
              void entry.run()
            }}
          >
            {locale.t(entry.labelKey)}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .menu {
    position: relative;
  }

  .key {
    display: flex;
    align-items: center;
    justify-content: center;
    min-inline-size: 2.25rem;
    block-size: 2.25rem;
    border: none;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
  }

  .key:hover,
  .key.on {
    background: var(--color-surface-raised);
    color: var(--color-text);
  }

  .list {
    position: absolute;
    inset-block-start: calc(100% + var(--space-2));
    inset-inline-end: 0;
    z-index: 2;
    display: grid;
    gap: 2px;
    min-inline-size: 13rem;
    margin: 0;
    padding: var(--space-1);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-2);
    background: var(--color-surface-raised);
    list-style: none;
  }

  .divided {
    margin-block-start: var(--space-1);
    padding-block-start: var(--space-1);
    border-block-start: 1px solid var(--color-border);
  }

  .entry {
    inline-size: 100%;
    padding: var(--space-2) var(--space-3);
    border: none;
    border-radius: var(--radius-1);
    background: transparent;
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: 0.875rem;
    text-align: start;
    white-space: nowrap;
    cursor: pointer;
  }

  .entry:hover {
    background: var(--color-surface-sunken);
  }
</style>
