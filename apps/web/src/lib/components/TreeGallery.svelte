<script lang="ts">
  import { type Session, getTree } from '@nodable/sdk'
  import { locale } from '../state/locale.svelte'
  import TreeCanvas from './TreeCanvas.svelte'

  type Props = {
    sessions: readonly Session[]
    activeId: string
    highlightLeaves: boolean
    onselect: (id: string) => void
  }

  const { sessions, activeId, highlightLeaves, onselect }: Props = $props()
</script>

<ul class="gallery">
  {#each sessions as session (session.id)}
    <li>
      <button
        type="button"
        class="card"
        class:active={session.id === activeId}
        aria-pressed={session.id === activeId}
        onclick={() => {
          onselect(session.id)
        }}
      >
        <span class="formula">{session.input === '' ? locale.t('input.label') : session.input}</span
        >
        <TreeCanvas snapshot={getTree(session)} {highlightLeaves} />
      </button>
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

  .card {
    display: grid;
    gap: var(--space-2);
    inline-size: 100%;
    padding: var(--space-3);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-2);
    background: var(--color-surface);
    color: var(--color-text);
    font-family: var(--font-sans);
    text-align: start;
    cursor: pointer;
    transition: border-color var(--duration-short) ease;
  }

  .card.active {
    border-color: var(--color-accent);
    background: var(--color-accent-soft);
  }

  .formula {
    font-family: var(--font-mono);
    font-size: 1rem;
    overflow-wrap: anywhere;
  }
</style>
