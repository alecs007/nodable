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
  <input
    id="replay-step"
    type="range"
    min="0"
    max={last}
    step="1"
    value={index}
    aria-label={locale.t('replay.label')}
    aria-valuetext={position}
    oninput={(event) => {
      onselect(event.currentTarget.valueAsNumber)
    }}
  />
  <span class="count">{index}/{last}</span>
</div>

<style>
  .replay {
    display: flex;
    gap: var(--space-3);
    align-items: center;
  }

  input {
    inline-size: 10rem;
    accent-color: var(--color-accent);
  }

  .count {
    color: var(--color-text-muted);
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-variant-numeric: tabular-nums;
  }
</style>
