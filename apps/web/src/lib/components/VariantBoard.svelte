<script lang="ts">
  import { type FormulaVariant } from '@nodable/sdk'
  import { locale } from '../state/locale.svelte'
  import TreeCanvas from './TreeCanvas.svelte'

  type Props = {
    variants: readonly FormulaVariant[]
    highlightLeaves: boolean
  }

  const { variants, highlightLeaves }: Props = $props()
</script>

<div class="board" aria-label={locale.t('outcome.label')}>
  {#each variants as variant, index (variant.kind)}
    <section class="variant">
      <h2 class="caption">{locale.t('outcome.variant', { index: String(index + 1) })}</h2>
      <TreeCanvas
        snapshot={variant.snapshot}
        {highlightLeaves}
        hideLabelFor={variant.isLabelKnown ? undefined : variant.workingId}
      />
    </section>
  {/each}
</div>

<style>
  .board {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-5);
    align-items: flex-start;
    justify-content: center;
  }

  .variant {
    display: grid;
    gap: var(--space-2);
    justify-items: center;
    padding: var(--space-3);
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-3);
    transition: border-color var(--duration-medium) ease;
  }

  .caption {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.8125rem;
    font-weight: 500;
  }
</style>
