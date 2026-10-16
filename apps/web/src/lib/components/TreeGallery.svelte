<script lang="ts">
  import { type Session, getTree } from '@nodable/sdk'
  import { locale } from '../state/locale.svelte'
  import Icon from './Icon.svelte'
  import TreeCanvas from './TreeCanvas.svelte'

  type Props = {
    sessions: readonly Session[]
    activeId: string
    highlightLeaves: boolean
    onselect: (id: string) => void
    ondelete: (id: string) => void
  }

  const { sessions, activeId, highlightLeaves, onselect, ondelete }: Props = $props()

  function titleOf(session: Session): string {
    if (session.name !== '') {
      return session.name
    }

    return session.input === '' ? locale.t('workspace.empty') : session.input
  }
</script>

<ul class="gallery">
  {#each sessions as session (session.id)}
    <li class="cell" class:active={session.id === activeId}>
      <button
        type="button"
        class="select"
        aria-pressed={session.id === activeId}
        onclick={() => {
          onselect(session.id)
        }}
      >
        <span class="title">{titleOf(session)}</span>
        <TreeCanvas snapshot={getTree(session)} {highlightLeaves} />
      </button>

      {#if sessions.length > 1}
        <button
          type="button"
          class="delete"
          title={locale.t('workspace.delete')}
          aria-label={locale.t('workspace.delete')}
          onclick={() => {
            ondelete(session.id)
          }}
        >
          <Icon name="trash" />
        </button>
      {/if}
    </li>
  {/each}
</ul>

<style>
  .gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
    gap: var(--space-4);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .cell {
    position: relative;
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-3);
    background: var(--color-glass);
    backdrop-filter: var(--glass-blur);
    transition:
      border-color var(--duration-medium) var(--ease),
      background var(--duration-medium) var(--ease);
  }

  .cell.active {
    border-color: var(--color-accent);
    background: var(--color-accent-soft);
  }

  .select {
    display: grid;
    gap: var(--space-2);
    inline-size: 100%;
    padding: var(--space-3);
    border: none;
    border-radius: var(--radius-3);
    background: transparent;
    color: var(--color-text);
    font-family: var(--font-sans);
    text-align: start;
    cursor: pointer;
  }

  .title {
    padding-inline-end: 2rem;
    font-family: var(--font-mono);
    font-size: 1rem;
    overflow-wrap: anywhere;
  }

  .delete {
    position: absolute;
    inset-block-start: var(--space-2);
    inset-inline-end: var(--space-2);
    display: flex;
    align-items: center;
    justify-content: center;
    inline-size: 2rem;
    block-size: 2rem;
    border: none;
    border-radius: var(--radius-pill);
    background: var(--color-surface-sunken);
    color: var(--color-text-muted);
    cursor: pointer;
    transition:
      background var(--duration-short) var(--ease),
      color var(--duration-short) var(--ease);
  }

  .delete:hover {
    background: var(--color-error-soft);
    color: var(--color-error);
  }
</style>
