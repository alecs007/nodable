<script lang="ts">
  import {
    type ExportFormat,
    deserializeWorkspace,
    exportSession,
    serializeWorkspace,
  } from '@nodable/sdk'
  import { copyExport, pickTextFile, saveExport } from '../export/files'
  import type { MessageKey } from '../i18n/messages'
  import { prefersReducedMotion } from 'svelte/motion'
  import { fly } from 'svelte/transition'
  import { locale } from '../state/locale.svelte'
  import { persistence } from '../state/persistence.svelte'
  import { workspace } from '../state/workspace.svelte'
  import Icon, { type IconName } from './Icon.svelte'

  type Entry = {
    readonly id: string
    readonly icon: IconName
    readonly labelKey: MessageKey
    readonly isDisabled?: boolean
    readonly run: () => void | Promise<void>
  }

  const duration = $derived(prefersReducedMotion.current ? 0 : 160)

  let open = $state(false)
  let container: HTMLDivElement | undefined = $state()

  function close(): void {
    open = false
  }

  function captions(): { readonly variants: readonly string[] } {
    return {
      variants: [
        locale.t('outcome.variant', { index: '1' }),
        locale.t('outcome.variant', { index: '2' }),
      ],
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
    { id: 'svg', icon: 'image', labelKey: 'file.svg', run: download('svg') },
    { id: 'png', icon: 'image', labelKey: 'file.png', run: download('png') },
    { id: 'latex', icon: 'code', labelKey: 'file.latex', run: download('latex') },
    { id: 'text', icon: 'text', labelKey: 'file.text', run: download('text') },
    {
      id: 'copy',
      icon: 'copy',
      labelKey: 'file.copy',
      run: () => copyExport(exportSession(workspace.active, 'text')),
    },
    {
      id: 'remove',
      icon: 'trash',
      labelKey: 'workspace.remove',
      isDisabled: workspace.sessions.length < 2,
      run: () => {
        workspace.removeActive()
      },
    },
    { id: 'export', icon: 'upload', labelKey: 'file.export', run: exportWorkspace },
    { id: 'import', icon: 'download', labelKey: 'file.import', run: importWorkspace },
    {
      id: 'clear',
      icon: 'clear',
      labelKey: 'file.clear',
      run: async () => {
        workspace.reset()
        await persistence.clear()
      },
    },
  ])

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
    class="files"
    class:on={open}
    aria-haspopup="menu"
    aria-expanded={open}
    title={locale.t('file.label')}
    aria-label={locale.t('file.label')}
    onclick={() => {
      open = !open
    }}
  >
    <Icon name="transfer" />
    <span>{locale.t('file.label')}</span>
  </button>

  {#if open}
    <ul
      class="list"
      role="menu"
      aria-label={locale.t('file.label')}
      transition:fly={{ y: -6, duration }}
    >
      {#each entries as entry (entry.id)}
        <li role="none" class:divided={entry.id === 'export'}>
          <button
            type="button"
            class="entry"
            role="menuitem"
            disabled={entry.isDisabled === true}
            onclick={() => {
              close()
              void entry.run()
            }}
          >
            <Icon name={entry.icon} />
            <span>{locale.t(entry.labelKey)}</span>
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

  .files:hover,
  .files.on {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .list {
    position: absolute;
    inset-block-end: calc(100% + var(--space-2));
    inset-inline-end: 0;
    z-index: 2;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 2px;
    inline-size: 14rem;
    max-inline-size: calc(100vw - var(--space-5));
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
    display: flex;
    gap: var(--space-3);
    align-items: center;
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

  .entry:hover:not(:disabled) {
    background: var(--color-surface-sunken);
  }

  .entry:disabled {
    opacity: 0.45;
    cursor: default;
  }
  @media (width <= 48rem) {
    .list {
      position: fixed;
      inset-block-end: calc(var(--dock-space, 7rem) + var(--space-2));
      inset-inline: var(--space-3);
      inline-size: auto;
      max-inline-size: none;
      max-block-size: 50vh;
    }
  }
</style>
