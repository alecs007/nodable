<script lang="ts">
  import { locale } from '../state/locale.svelte'

  type Props = {
    value: string
    onchange: (value: string) => void
  }

  const { value, onchange }: Props = $props()
</script>

<input
  class="name"
  type="text"
  autocomplete="off"
  aria-label={locale.t('workspace.name')}
  placeholder={locale.t('workspace.nameplaceholder')}
  {value}
  oninput={(event) => {
    onchange(event.currentTarget.value)
  }}
/>

<style>
  .name {
    min-inline-size: 4rem;
    max-inline-size: 12rem;
    padding: var(--space-1) var(--space-2);
    border: 1px solid transparent;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: 0.9375rem;
    transition:
      background var(--duration-short) ease,
      border-color var(--duration-short) ease;
  }

  .name:hover {
    border-color: var(--color-border);
  }

  .name:focus {
    border-color: var(--color-accent);
    background: var(--color-surface-raised);
    outline: none;
  }

  .name::placeholder {
    color: var(--color-text-muted);
  }
</style>
