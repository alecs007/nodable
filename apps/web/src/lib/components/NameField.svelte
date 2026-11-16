<script lang="ts">
  import { locale } from '../state/locale.svelte'
  import { focusFormula } from '../state/overlay.svelte'

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
  enterkeyhint="next"
  oninput={(event) => {
    onchange(event.currentTarget.value)
  }}
  onkeydown={(event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      focusFormula()
    }
  }}
/>

<style>
  .name {
    min-inline-size: 4rem;
    max-inline-size: 12rem;
    block-size: 1.875rem;
    padding: 0 var(--space-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: 1rem;
    line-height: normal;
    appearance: none;
    transition:
      background var(--duration-short) var(--ease),
      border-color var(--duration-short) var(--ease);
  }

  .name:hover {
    border-color: var(--color-border-strong);
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
