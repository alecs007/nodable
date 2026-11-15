<script lang="ts">
  import {
    type Evaluation,
    type Interpretation,
    type TreeNode,
    type TruthValue,
    formulaOf,
    valueOfVariable,
  } from '@nodable/sdk'
  import { isCompound } from '../interpretation/computation'
  import { locale } from '../state/locale.svelte'
  import EvaluationSteps from './EvaluationSteps.svelte'
  import Icon from './Icon.svelte'
  import TruthMark from './TruthMark.svelte'
  import TruthToggle from './TruthToggle.svelte'

  type Props = {
    root: TreeNode
    variables: readonly string[]
    interpretation: Interpretation
    evaluation: Evaluation
    onassign: (name: string, value: TruthValue) => void
    onreset: () => void
    onedit: () => void
  }

  const { root, variables, interpretation, evaluation, onassign, onreset, onedit }: Props = $props()

  const remaining = $derived(
    variables.filter((name) => valueOfVariable(interpretation, name) === undefined).length,
  )
  const hasValues = $derived(remaining < variables.length)
  const compound = $derived(evaluation.steps.filter(isCompound))

  const verdict = $derived.by(() => {
    if (evaluation.value === undefined) {
      return locale.t('interpret.remaining', { count: String(remaining) })
    }

    return locale.t(evaluation.value ? 'interpret.true' : 'interpret.false')
  })
</script>

<section class="panel" aria-label={locale.t('interpret.label')}>
  <div class="head">
    <div class="title">
      <span class="eyebrow">{locale.t('interpret.label')}</span>
      <code class="formula">{formulaOf(root)}</code>
    </div>
    <button
      type="button"
      class="edit"
      title={locale.t('interpret.edit')}
      aria-label={locale.t('interpret.edit')}
      onclick={onedit}
    >
      <Icon name="edit" />
      <span>{locale.t('interpret.edit')}</span>
    </button>
  </div>

  <div class="variables" role="group" aria-label={locale.t('interpret.variables')}>
    {#each variables as name, index (name)}
      <TruthToggle
        {name}
        group="truth-{index}"
        value={valueOfVariable(interpretation, name)}
        onchange={(value: TruthValue) => {
          onassign(name, value)
        }}
      />
    {/each}
    <button
      type="button"
      class="reset"
      disabled={!hasValues}
      title={locale.t('interpret.reset')}
      aria-label={locale.t('interpret.reset')}
      onclick={onreset}
    >
      <Icon name="reset" />
    </button>
  </div>

  <p
    class="verdict"
    class:true={evaluation.value === true}
    class:false={evaluation.value === false}
    aria-live="polite"
  >
    <TruthMark value={evaluation.value} isLarge />
    <span>{verdict}</span>
  </p>

  {#if compound.length > 0}
    <EvaluationSteps steps={compound} />
  {/if}
</section>

<style>
  .panel {
    display: grid;
    gap: var(--space-3);
    padding-block-start: var(--space-1);
  }

  .head {
    display: flex;
    gap: var(--space-3);
    align-items: center;
    justify-content: space-between;
    padding-inline: var(--space-2);
  }

  .title {
    display: grid;
    min-inline-size: 0;
  }

  .eyebrow {
    color: var(--color-text-muted);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .formula {
    overflow-wrap: anywhere;
    color: var(--color-text);
    font-family: var(--font-mono);
    font-size: 1.0625rem;
  }

  .edit {
    display: flex;
    flex: 0 0 auto;
    gap: var(--space-2);
    align-items: center;
    block-size: 2.25rem;
    padding-inline: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    background: var(--color-surface-sunken);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: 0.875rem;
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
    transition:
      border-color var(--duration-short) var(--ease),
      color var(--duration-short) var(--ease);
  }

  .edit:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .variables {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
    padding: var(--space-3);
    border-radius: var(--radius-3);
    background: var(--color-surface-sunken);
  }

  .reset {
    display: grid;
    place-items: center;
    inline-size: 2.25rem;
    block-size: 2.25rem;
    margin-inline-start: auto;
    border: none;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition:
      background var(--duration-short) var(--ease),
      color var(--duration-short) var(--ease);
  }

  .reset:hover:not(:disabled) {
    background: var(--color-surface-raised);
    color: var(--color-text);
  }

  .reset:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .verdict {
    display: flex;
    gap: var(--space-3);
    align-items: center;
    margin: 0;
    padding-inline: var(--space-2);
    color: var(--color-text-muted);
    font-size: 0.9375rem;
  }

  .verdict.true {
    color: var(--color-true);
    font-weight: 600;
  }

  .verdict.false {
    color: var(--color-false);
    font-weight: 600;
  }

  @media (width <= 48rem) {
    .edit span {
      display: none;
    }

    .edit {
      justify-content: center;
      inline-size: 2.25rem;
      padding-inline: 0;
    }

    .variables {
      padding: var(--space-2);
    }
  }
</style>
