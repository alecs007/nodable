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
    normalizeFormula,
  } from '@nodable/sdk'
  import type { MessageKey } from '../i18n/messages'
  import { locale } from '../state/locale.svelte'
  import Icon from './Icon.svelte'

  type SymbolKey = {
    readonly symbol: string
    readonly labelKey: MessageKey
    readonly kind: TokenKind
  }

  type Props = {
    value: string
    hasError: boolean
    allowedNext: readonly TokenKind[]
    onchange: (value: string) => void
    onsubmit?: () => void
  }

  const { value, hasError, allowedNext, onchange, onsubmit }: Props = $props()

  const keys: readonly SymbolKey[] = [
    { symbol: OPEN_PAREN, labelKey: 'toolbar.openparen', kind: 'open-paren' },
    { symbol: NEGATION, labelKey: 'toolbar.negation', kind: 'negation' },
    { symbol: CONJUNCTION, labelKey: 'toolbar.conjunction', kind: 'connective' },
    { symbol: DISJUNCTION, labelKey: 'toolbar.disjunction', kind: 'connective' },
    { symbol: IMPLICATION, labelKey: 'toolbar.implication', kind: 'connective' },
    { symbol: EQUIVALENCE, labelKey: 'toolbar.equivalence', kind: 'connective' },
    { symbol: CLOSE_PAREN, labelKey: 'toolbar.closeparen', kind: 'close-paren' },
  ]

  let field: HTMLInputElement | undefined = $state()

  function setValue(next: string, caret: number): void {
    onchange(next)

    if (field !== undefined) {
      field.value = next
      field.setSelectionRange(caret, caret)
    }
  }

  function onInput(event: Event & { currentTarget: HTMLInputElement }): void {
    const raw = event.currentTarget.value
    const caret = event.currentTarget.selectionStart ?? raw.length
    const normalized = normalizeFormula(raw)

    setValue(normalized, caret - (raw.length - normalized.length))
  }

  function insert(symbol: string): void {
    const caret = field?.selectionStart ?? value.length

    setValue(`${value.slice(0, caret)}${symbol}${value.slice(caret)}`, caret + symbol.length)
    field?.focus()
  }

  function clear(): void {
    setValue('', 0)
    field?.focus()
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault()
      onsubmit?.()

      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      clear()
    }
  }
</script>

<div class="bar">
  <div class="field" class:invalid={hasError}>
    <input
      bind:this={field}
      id="formula"
      class="input"
      type="text"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      aria-label={locale.t('input.label')}
      aria-invalid={hasError}
      aria-describedby="formula-hint"
      placeholder={locale.t('input.placeholder')}
      {value}
      oninput={onInput}
      onkeydown={onKeyDown}
    />
    <button
      type="button"
      class="clear"
      hidden={value.length === 0}
      title={locale.t('input.clear')}
      aria-label={locale.t('input.clear')}
      onclick={clear}
    >
      <Icon name="clear" />
    </button>
  </div>

  <div class="keys" role="group" aria-label={locale.t('toolbar.label')}>
    {#each keys as key (key.symbol)}
      <button
        type="button"
        class="key"
        class:suggested={allowedNext.includes(key.kind)}
        title={locale.t(key.labelKey)}
        aria-label={locale.t(key.labelKey)}
        onclick={() => {
          insert(key.symbol)
        }}
      >
        {key.symbol}
      </button>
    {/each}
  </div>
</div>

<style>
  .bar {
    display: grid;
    gap: var(--space-2);
  }

  .field {
    display: flex;
    gap: var(--space-1);
    align-items: center;
    padding-inline-end: var(--space-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    background: var(--color-surface-raised);
    transition: border-color var(--duration-short) ease;
  }

  .field:focus-within {
    border-color: var(--color-accent);
  }

  .field.invalid {
    border-color: var(--color-error);
  }

  .input {
    flex: 1;
    min-inline-size: 0;
    padding: var(--space-3) var(--space-5);
    border: none;
    background: transparent;
    color: var(--color-text);
    font-family: var(--font-mono);
    font-size: 1.125rem;
  }

  .input:focus {
    outline: none;
  }

  .clear {
    display: flex;
    align-items: center;
    justify-content: center;
    inline-size: 1.75rem;
    block-size: 1.75rem;
    border: none;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
  }

  .clear[hidden] {
    display: none;
  }

  .clear:hover {
    background: var(--color-surface-sunken);
    color: var(--color-text);
  }

  .keys {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    padding-inline: var(--space-1);
  }

  .key {
    min-inline-size: 2.25rem;
    block-size: 2.25rem;
    border: 1px solid transparent;
    border-radius: var(--radius-pill);
    background: var(--color-surface-sunken);
    color: var(--color-text-muted);
    font-family: var(--font-sans);
    font-size: 1.0625rem;
    cursor: pointer;
    transition:
      background var(--duration-short) ease,
      color var(--duration-short) ease;
  }

  .key:hover {
    color: var(--color-text);
  }

  .key.suggested {
    border-color: var(--color-accent);
    background: var(--color-accent-soft);
    color: var(--color-accent);
  }
</style>
