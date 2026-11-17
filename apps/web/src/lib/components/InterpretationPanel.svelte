<script lang="ts">
  import {
    type Classification,
    type Evaluation,
    type Interpretation,
    type Satisfiability,
    type Session,
    type TreeNode,
    type TruthValue,
    formulaOf,
    valueOfVariable,
  } from '@nodable/sdk'
  import type { MessageKey } from '../i18n/messages'
  import { isCompound } from '../interpretation/computation'
  import { locale } from '../state/locale.svelte'
  import EvaluationSteps from './EvaluationSteps.svelte'
  import Icon from './Icon.svelte'
  import Modal from './Modal.svelte'
  import TruthMark from './TruthMark.svelte'
  import TruthTableDialog from './TruthTableDialog.svelte'
  import TruthToggle from './TruthToggle.svelte'

  type Props = {
    session: Session
    root: TreeNode
    variables: readonly string[]
    interpretation: Interpretation
    evaluation: Evaluation
    classification?: Classification | undefined
    onassign: (name: string, value: TruthValue) => void
    onreset: () => void
    onuse: (interpretation: Interpretation) => void
    onedit: () => void
  }

  const {
    session,
    root,
    variables,
    interpretation,
    evaluation,
    classification,
    onassign,
    onreset,
    onuse,
    onedit,
  }: Props = $props()

  type Card = 'classification' | 'steps' | 'table'

  type Witness = {
    readonly id: string
    readonly labelKey: MessageKey
    readonly values: Interpretation
  }

  const NAME_KEYS: Record<Satisfiability, MessageKey> = {
    valid: 'class.valid',
    satisfiable: 'class.satisfiable',
    unsatisfiable: 'class.unsatisfiable',
  }

  const INFO_KEYS: Record<Satisfiability, MessageKey> = {
    valid: 'class.validinfo',
    satisfiable: 'class.satisfiableinfo',
    unsatisfiable: 'class.unsatisfiableinfo',
  }

  let open = $state<Card | undefined>(undefined)
  let formulaBox: HTMLElement | undefined = $state()
  let isClipped = $state(false)

  const formula = $derived(formulaOf(root))

  $effect(() => {
    const element = formulaBox
    const text = formula

    if (element === undefined || text === '') {
      return
    }

    function measure(): void {
      if (element !== undefined) {
        isClipped = element.scrollLeft + element.clientWidth < element.scrollWidth - 1
      }
    }

    const observer = new ResizeObserver(measure)

    measure()
    observer.observe(element)
    element.addEventListener('scroll', measure, { passive: true })

    return () => {
      observer.disconnect()
      element.removeEventListener('scroll', measure)
    }
  })

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

  const witnesses = $derived.by((): readonly Witness[] => {
    const found: Witness[] = []

    if (classification?.model !== undefined) {
      found.push({ id: 'model', labelKey: 'class.model', values: classification.model })
    }

    if (classification?.countermodel !== undefined) {
      found.push({
        id: 'countermodel',
        labelKey: 'class.countermodel',
        values: classification.countermodel,
      })
    }

    return found
  })

  function close(): void {
    open = undefined
  }
</script>

<section class="panel" aria-label={locale.t('interpret.label')}>
  <p class="expression" title={verdict}>
    <code bind:this={formulaBox} class="formula" class:clipped={isClipped} title={formula}
      >{formula}</code
    >
    <span class="equals" aria-hidden="true">=</span>
    <TruthMark value={evaluation.value} />
  </p>

  <div class="toolbar">
    {#if classification !== undefined}
      <button
        type="button"
        class="action classify"
        aria-haspopup="dialog"
        title={locale.t(NAME_KEYS[classification.kind])}
        onclick={() => {
          open = 'classification'
        }}
      >
        <Icon name="examples" />
        <span>{locale.t('class.label')}</span>
      </button>
    {/if}
    {#if compound.length > 0}
      <button
        type="button"
        class="action"
        aria-haspopup="dialog"
        onclick={() => {
          open = 'steps'
        }}
      >
        <Icon name="steps" />
        <span class="full">{locale.t('interpret.steps')}</span>
        <span class="short" aria-hidden="true">{locale.t('interpret.stepsshort')}</span>
      </button>
    {/if}
    <button
      type="button"
      class="action"
      aria-haspopup="dialog"
      onclick={() => {
        open = 'table'
      }}
    >
      <Icon name="table" />
      <span class="full">{locale.t('table.open')}</span>
      <span class="short" aria-hidden="true">{locale.t('table.short')}</span>
    </button>
    <button type="button" class="action" onclick={onedit}>
      <Icon name="edit" />
      <span class="full">{locale.t('interpret.edit')}</span>
      <span class="short" aria-hidden="true">{locale.t('interpret.editshort')}</span>
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

  <p class="sr-only" aria-live="polite">{verdict}</p>

  {#if open === 'classification' && classification !== undefined}
    <Modal
      title={locale.t(NAME_KEYS[classification.kind])}
      tone={classification.kind}
      onclose={close}
    >
      {#snippet children(dismiss: () => void)}
        <p class="card-text">
          {locale.t(INFO_KEYS[classification.kind])}. {locale.t('class.count', {
            models: String(classification.models),
            total: String(classification.interpretations),
          })}.
        </p>
        <p class="card-text">{locale.t('class.exampleshint')}</p>
        <div class="witnesses">
          {#each witnesses as witness (witness.id)}
            <button
              type="button"
              class="witness"
              title={locale.t('class.use')}
              onclick={() => {
                onuse(witness.values)
                dismiss()
              }}
            >
              <span class="tag">{locale.t(witness.labelKey)}</span>
              <span class="pairs">
                {#each variables as name (name)}
                  <span class="pair">
                    <code>{name}</code>
                    <TruthMark value={valueOfVariable(witness.values, name)} />
                  </span>
                {/each}
              </span>
            </button>
          {/each}
        </div>
      {/snippet}
    </Modal>
  {/if}

  {#if open === 'table'}
    <TruthTableDialog {session} {interpretation} {onuse} onclose={close} />
  {/if}

  {#if open === 'steps'}
    <Modal title={locale.t('interpret.steps')} onclose={close}>
      <EvaluationSteps steps={compound} />
    </Modal>
  {/if}
</section>

<style>
  .panel {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-3);
    min-inline-size: 0;
    padding-block-start: var(--space-2);
  }

  .expression {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    min-inline-size: 0;
    margin: 0;
    padding-inline: var(--space-2);
  }

  .formula {
    flex: 0 1 auto;
    min-inline-size: 0;
    overflow-x: auto;
    color: var(--color-text);
    font-family: var(--font-mono);
    font-size: 1.0625rem;
    white-space: nowrap;
    scrollbar-width: none;
  }

  .formula.clipped {
    mask-image: linear-gradient(to right, #000 calc(100% - 2rem), transparent);
  }

  .formula::-webkit-scrollbar {
    display: none;
  }

  .equals {
    flex: 0 0 auto;
    color: var(--color-text-muted);
    font-size: 0.875rem;
    white-space: nowrap;
  }

  .toolbar {
    display: flex;
    gap: var(--space-2);
  }

  .action {
    position: relative;
    display: inline-flex;
    flex: 1 1 0;
    gap: var(--space-2);
    align-items: center;
    justify-content: center;
    min-inline-size: 0;
    block-size: 2.25rem;
    padding-inline: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    background: var(--color-surface-sunken);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: 0.8125rem;
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
    transition:
      border-color var(--duration-short) var(--ease),
      color var(--duration-short) var(--ease),
      box-shadow var(--duration-short) var(--ease);
  }

  .action :global(.icon) {
    flex: 0 0 auto;
  }

  .action span {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .action .full {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }

  @media (hover: hover) {
    .action:hover {
      border-color: var(--color-accent);
      color: var(--color-accent);
    }
  }

  .variables {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
    padding: var(--space-2);
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

  .card-text {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.9375rem;
  }

  .witnesses {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--space-2);
    align-content: start;
  }

  .witness {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
    gap: var(--space-3);
    align-items: center;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-2);
    background: var(--color-surface);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: 0.8125rem;
    text-align: start;
    cursor: pointer;
    transition: border-color var(--duration-short) var(--ease);
  }

  .witness:hover {
    border-color: var(--color-accent);
  }

  .tag {
    justify-self: start;
    padding: 0.125rem var(--space-2);
    border-radius: var(--radius-pill);
    background: var(--color-surface-sunken);
    color: var(--color-text-muted);
    font-weight: 600;
  }

  .pairs {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-3);
    min-inline-size: 0;
  }

  .pair {
    display: inline-flex;
    gap: var(--space-1);
    align-items: center;
  }

  .pair code {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    font-weight: 600;
  }

  @media (width <= 30rem) {
    .toolbar {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--space-1);
    }

    .action {
      flex: 1 1 auto;
      gap: var(--space-1);
      padding-inline: var(--space-2);
      font-size: 0.75rem;
    }

    .variables {
      gap: var(--space-1);
      padding: var(--space-1);
    }
  }
</style>
