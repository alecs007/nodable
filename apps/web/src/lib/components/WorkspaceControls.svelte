<script lang="ts">
  import { locale } from '../state/locale.svelte'
  import { type WorkspaceView, workspace } from '../state/workspace.svelte'

  const views: readonly WorkspaceView[] = ['single', 'all']
</script>

<div class="controls">
  <div class="group" role="group" aria-label={locale.t('view.label')}>
    {#each views as view (view)}
      <button
        type="button"
        class="toggle"
        class:active={workspace.view === view}
        aria-pressed={workspace.view === view}
        onclick={() => {
          workspace.setView(view)
        }}
      >
        {view === 'single' ? locale.t('view.single') : locale.t('view.all')}
      </button>
    {/each}
  </div>

  <label class="switch">
    <input
      type="checkbox"
      checked={workspace.highlightLeaves}
      onchange={() => {
        workspace.toggleHighlightLeaves()
      }}
    />
    <span>{locale.t('view.highlightleaves')}</span>
  </label>

  <div class="group">
    <button
      type="button"
      class="action"
      onclick={() => {
        workspace.addFormula()
      }}
    >
      {locale.t('workspace.add')}
    </button>
    <button
      type="button"
      class="action"
      disabled={workspace.sessions.length < 2}
      onclick={() => {
        workspace.removeActive()
      }}
    >
      {locale.t('workspace.remove')}
    </button>
    <button
      type="button"
      class="action"
      onclick={() => {
        workspace.clearPositions()
      }}
    >
      {locale.t('workspace.resetpositions')}
    </button>
  </div>
</div>

<style>
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    align-items: center;
  }

  .group {
    display: flex;
    gap: var(--space-2);
  }

  .toggle,
  .action {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-1);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: 0.875rem;
    cursor: pointer;
  }

  .toggle.active {
    border-color: var(--color-accent);
    background: var(--color-accent-soft);
    color: var(--color-accent);
    font-weight: 600;
  }

  .action:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .switch {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    font-size: 0.875rem;
  }

  .switch input {
    inline-size: 1.125rem;
    block-size: 1.125rem;
    accent-color: var(--color-accent);
  }
</style>
