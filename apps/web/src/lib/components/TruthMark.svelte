<script lang="ts">
  import { type TruthValue } from '@nodable/sdk'
  import { letterOf } from '../interpretation/computation'
  import { locale } from '../state/locale.svelte'

  type Props = {
    value: TruthValue | undefined
    isLarge?: boolean | undefined
  }

  const { value, isLarge = false }: Props = $props()

  const letter = $derived(
    letterOf(value, { true: locale.t('truth.trueletter'), false: locale.t('truth.falseletter') }),
  )

  const label = $derived.by(() => {
    if (value === undefined) {
      return letter
    }

    return locale.t(value ? 'truth.true' : 'truth.false')
  })
</script>

<span
  class="mark"
  class:large={isLarge}
  class:true={value === true}
  class:false={value === false}
  title={label}
>
  <span class="letter" aria-hidden="true">{letter}</span>
  <span class="sr-only">{label}</span>
</span>

<style>
  .mark {
    display: inline-grid;
    flex: 0 0 auto;
    place-items: center;
    min-inline-size: 1.5rem;
    block-size: 1.5rem;
    padding-inline: var(--space-1);
    border: 1px dashed var(--color-border-strong);
    border-radius: var(--radius-pill);
    color: var(--color-text-muted);
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 700;
    line-height: 1;
  }

  .letter {
    display: block;
    text-box: trim-both cap alphabetic;
  }

  .mark.large {
    min-inline-size: 2rem;
    block-size: 2rem;
    font-size: 1rem;
  }

  .mark.true {
    border: 1px solid var(--color-true);
    background: var(--color-true-soft);
    color: var(--color-true);
  }

  .mark.false {
    border: 1px solid var(--color-false);
    background: var(--color-false-soft);
    color: var(--color-false);
  }
</style>
