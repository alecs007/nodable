<script lang="ts">
  import {
    CLOSE_PAREN,
    CONJUNCTION,
    DISJUNCTION,
    EQUIVALENCE,
    IMPLICATION,
    NEGATION,
    OPEN_PAREN,
    type TokenKind,
  } from '@nodable/sdk'
  import type { MessageKey } from '../i18n/messages'
  import { locale } from '../state/locale.svelte'

  type ToolbarButton = {
    readonly symbol: string
    readonly labelKey: MessageKey
    readonly kind: TokenKind
  }

  type Props = {
    allowedNext: readonly TokenKind[]
    oninsert: (symbol: string) => void
  }

  const { allowedNext, oninsert }: Props = $props()

  const buttons: readonly ToolbarButton[] = [
    { symbol: OPEN_PAREN, labelKey: 'toolbar.openparen', kind: 'open-paren' },
    { symbol: NEGATION, labelKey: 'toolbar.negation', kind: 'negation' },
    { symbol: CONJUNCTION, labelKey: 'toolbar.conjunction', kind: 'connective' },
    { symbol: DISJUNCTION, labelKey: 'toolbar.disjunction', kind: 'connective' },
    { symbol: IMPLICATION, labelKey: 'toolbar.implication', kind: 'connective' },
    { symbol: EQUIVALENCE, labelKey: 'toolbar.equivalence', kind: 'connective' },
    { symbol: CLOSE_PAREN, labelKey: 'toolbar.closeparen', kind: 'close-paren' },
  ]
</script>

<div class="toolbar" role="group" aria-label={locale.t('toolbar.label')}>
  {#each buttons as button (button.symbol)}
    <button
      type="button"
      class="key"
      class:suggested={allowedNext.includes(button.kind)}
      aria-label={locale.t(button.labelKey)}
      title={locale.t(button.labelKey)}
      onclick={() => {
        oninsert(button.symbol)
      }}
    >
      {button.symbol}
    </button>
  {/each}
</div>

<style>
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .key {
    min-inline-size: 2.75rem;
    min-block-size: 2.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-1);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: 1.125rem;
    cursor: pointer;
    transition:
      background var(--duration-short) ease,
      border-color var(--duration-short) ease;
  }

  .key:hover {
    background: var(--color-surface-sunken);
  }

  .suggested {
    border-color: var(--color-accent);
    background: var(--color-accent-soft);
    color: var(--color-accent);
    font-weight: 600;
  }
</style>
