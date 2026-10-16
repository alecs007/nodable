<script lang="ts">
  import { type Diagnostic, type TokenKind, normalizeFormula } from '@nodable/sdk'
  import { locale } from '../state/locale.svelte'
  import ConnectiveToolbar from './ConnectiveToolbar.svelte'

  type Props = {
    value: string
    diagnostics: readonly Diagnostic[]
    allowedNext: readonly TokenKind[]
    onchange: (value: string) => void
    onsubmit?: () => void
  }

  const { value, diagnostics, allowedNext, onchange, onsubmit }: Props = $props()

  let field: HTMLInputElement | undefined = $state()

  const errorRange = $derived(diagnostics.find((diagnostic) => diagnostic.severity === 'error'))

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
    const next = `${value.slice(0, caret)}${symbol}${value.slice(caret)}`

    setValue(next, caret + symbol.length)
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

  function clear(): void {
    setValue('', 0)
    field?.focus()
  }
</script>

<div class="bar">
  <label class="field" for="formula">
    <span class="caption">{locale.t('input.label')}</span>
    <input
      bind:this={field}
      id="formula"
      class="input"
      class:invalid={errorRange !== undefined}
      type="text"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      aria-invalid={errorRange !== undefined}
      aria-describedby="formula-hint"
      placeholder={locale.t('input.placeholder')}
      {value}
      oninput={onInput}
      onkeydown={onKeyDown}
    />
  </label>

  <div class="controls">
    <ConnectiveToolbar {allowedNext} oninsert={insert} />
    <button type="button" class="clear" onclick={clear} disabled={value.length === 0}>
      {locale.t('input.clear')}
    </button>
  </div>
</div>

<style>
  .bar {
    display: grid;
    gap: var(--space-3);
  }

  .field {
    display: grid;
    gap: var(--space-1);
  }

  .caption {
    color: var(--color-text-muted);
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .input {
    inline-size: 100%;
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-2);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font-family: var(--font-mono);
    font-size: 1.25rem;
  }

  .input.invalid {
    border-color: var(--color-error);
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    align-items: center;
    justify-content: space-between;
  }

  .clear {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-1);
    background: transparent;
    color: var(--color-text-muted);
    font-family: var(--font-sans);
    font-size: 0.875rem;
    cursor: pointer;
  }

  .clear:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
