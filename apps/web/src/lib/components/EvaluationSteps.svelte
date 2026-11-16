<script lang="ts">
  import { type EvaluationStep, formulaOf } from '@nodable/sdk'
  import { computationOf } from '../interpretation/computation'
  import { locale } from '../state/locale.svelte'
  import TruthMark from './TruthMark.svelte'

  type Props = {
    steps: readonly EvaluationStep[]
  }

  const { steps }: Props = $props()

  const letters = $derived({
    true: locale.t('truth.trueletter'),
    false: locale.t('truth.falseletter'),
  })
</script>

<ol class="list" aria-label={locale.t('interpret.steps')}>
  {#each steps as step, index (step.node.id)}
    <li class="step" class:final={index === steps.length - 1}>
      <span class="index">{index + 1}</span>
      <code class="formula">{formulaOf(step.node)}</code>
      <span class="result">
        <code class="calc">{computationOf(step, letters)}</code>
        <span class="equals" aria-hidden="true">=</span>
        <TruthMark value={step.value} />
      </span>
    </li>
  {/each}
</ol>

<style>
  .list {
    display: grid;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .step {
    display: grid;
    grid-template-columns: 1.5rem minmax(0, 1fr) auto;
    gap: var(--space-3);
    align-items: center;
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-1);
  }

  .step:nth-child(odd) {
    background: var(--color-surface-sunken);
  }

  .final .formula,
  .final .calc {
    font-weight: 700;
  }

  .index {
    color: var(--color-text-muted);
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
    text-align: end;
  }

  .formula,
  .calc {
    font-family: var(--font-mono);
    font-size: 0.875rem;
  }

  .formula {
    overflow-wrap: anywhere;
    color: var(--color-text);
  }

  .result {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    white-space: nowrap;
  }

  .calc {
    color: var(--color-text-muted);
  }

  .equals {
    color: var(--color-text-muted);
  }

  @media (width <= 30rem) {
    .step {
      grid-template-columns: 1.25rem minmax(0, 1fr);
      gap: var(--space-1) var(--space-2);
    }

    .result {
      grid-column: 2;
    }
  }
</style>
