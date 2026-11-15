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

<details class="steps">
  <summary>
    <span>{locale.t('interpret.steps')}</span>
    <span class="count">{steps.length}</span>
  </summary>
  <ol class="list">
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
</details>

<style>
  .steps {
    border-block-start: 1px solid var(--color-border);
  }

  summary {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    padding: var(--space-2);
    color: var(--color-text-muted);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    list-style: none;
    user-select: none;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary::before {
    content: '';
    inline-size: 0.4rem;
    block-size: 0.4rem;
    border-block-end: 1.5px solid currentcolor;
    border-inline-end: 1.5px solid currentcolor;
    transform: rotate(-45deg);
    transition: transform var(--duration-short) var(--ease);
  }

  .steps[open] summary::before {
    transform: rotate(45deg);
  }

  summary:hover {
    color: var(--color-text);
  }

  .count {
    padding-inline: var(--space-2);
    border-radius: var(--radius-pill);
    background: var(--color-surface-sunken);
    font-size: 0.75rem;
  }

  .list {
    display: grid;
    gap: 2px;
    max-block-size: min(16rem, 30vh);
    margin: 0;
    padding: 0 0 var(--space-1);
    overflow-y: auto;
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
