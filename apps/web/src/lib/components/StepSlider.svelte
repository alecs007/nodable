<script lang="ts">
  import { type BuildStep } from '@nodable/sdk'
  import { locale } from '../state/locale.svelte'

  type Props = {
    steps: readonly BuildStep[]
    index: number
    onselect: (index: number) => void
  }

  const { steps, index, onselect }: Props = $props()

  const last = $derived(steps.length - 1)
  const position = $derived(
    locale.t('replay.position', { index: String(index), last: String(last) }),
  )
</script>

<div class="replay">
  <label class="field" for="replay-step">
    <span class="caption">{locale.t('replay.label')}</span>
    <input
      id="replay-step"
      type="range"
      min="0"
      max={last}
      step="1"
      value={index}
      disabled={last === 0}
      aria-valuetext={position}
      oninput={(event) => {
        onselect(event.currentTarget.valueAsNumber)
      }}
    />
  </label>
  <p class="position">{position}</p>
</div>

<style>
  .replay {
    display: grid;
    gap: var(--space-1);
    min-inline-size: 14rem;
  }

  .field {
    display: grid;
    gap: var(--space-1);
  }

  .caption {
    color: var(--color-text-muted);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  input {
    inline-size: 100%;
    accent-color: var(--color-accent);
  }

  .position {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.8125rem;
  }
</style>
