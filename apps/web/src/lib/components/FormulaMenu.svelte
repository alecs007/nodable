<script lang="ts">
  import { type Session } from '@nodable/sdk'
  import { prefersReducedMotion } from 'svelte/motion'
  import { fly } from 'svelte/transition'
  import { locale } from '../state/locale.svelte'

  type Props = {
    sessions: readonly Session[]
    activeId: string
    onselect: (id: string) => void
  }

  const { sessions, activeId, onselect }: Props = $props()

  const duration = $derived(prefersReducedMotion.current ? 0 : 160)

  let open = $state(false)
  let container: HTMLDivElement | undefined = $state()

  const active = $derived(sessions.find((session) => session.id === activeId))
  function titleOf(session: Session): string {
    if (session.name !== '') {
      return session.name
    }

    return session.input === '' ? locale.t('workspace.empty') : session.input
  }

  const label = $derived(active === undefined ? locale.t('workspace.empty') : titleOf(active))

  function close(): void {
    open = false
  }

  function choose(id: string): void {
    onselect(id)
    close()
  }

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
    class="trigger"
    aria-haspopup="listbox"
    aria-expanded={open}
    title={locale.t('workspace.label')}
    onclick={() => {
      open = !open
    }}
  >
    <span class="current">{label}</span>
    <span class="count">{sessions.length}</span>
    <svg class="chevron" class:up={open} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m7 10 5 5 5-5" />
    </svg>
  </button>

  {#if open}
    <ul
      class="list"
      role="listbox"
      aria-label={locale.t('workspace.label')}
      transition:fly={{ y: -6, duration }}
    >
      {#each sessions as session (session.id)}
        <li role="option" aria-selected={session.id === activeId}>
          <button
            type="button"
            class="option"
            class:on={session.id === activeId}
            onclick={() => {
              choose(session.id)
            }}
          >
            {titleOf(session)}
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

  .trigger {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    max-inline-size: 14rem;
    block-size: 2.25rem;
    padding-inline: var(--space-3);
    border: none;
    border-radius: var(--radius-pill);
    background: var(--color-surface-sunken);
    color: var(--color-text);
    font-family: var(--font-mono);
    font-size: 0.875rem;
    cursor: pointer;
  }

  .current {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .count {
    padding-inline: var(--space-2);
    border-radius: var(--radius-pill);
    background: var(--color-accent-soft);
    color: var(--color-accent);
    font-family: var(--font-sans);
    font-size: 0.75rem;
    font-weight: 600;
  }

  .chevron {
    inline-size: 1rem;
    block-size: 1rem;
    flex: none;
    fill: none;
    stroke: currentcolor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: transform var(--duration-short) ease;
  }

  .chevron.up {
    transform: rotate(180deg);
  }

  .list {
    position: absolute;
    inset-block-end: calc(100% + var(--space-2));
    inset-inline-start: 0;
    z-index: 2;
    display: grid;
    gap: 2px;
    min-inline-size: 100%;
    max-block-size: min(16rem, 40vh);
    margin: 0;
    padding: var(--space-1);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-2);
    background: var(--color-surface-raised);
    list-style: none;
    overflow-y: auto;
  }

  .option {
    inline-size: 100%;
    padding: var(--space-2) var(--space-3);
    border: none;
    border-radius: var(--radius-1);
    background: transparent;
    color: var(--color-text);
    font-family: var(--font-mono);
    font-size: 0.875rem;
    text-align: start;
    white-space: nowrap;
    cursor: pointer;
  }

  .option:hover {
    background: var(--color-surface-sunken);
  }

  .option.on {
    background: var(--color-accent-soft);
    color: var(--color-accent);
  }
</style>
