<script lang="ts">
  import { type Diagnostic, type TokenKind } from '@nodable/sdk'
  import type { MessageKey } from '../i18n/messages'
  import { locale } from '../state/locale.svelte'

  type Props = {
    diagnostics: readonly Diagnostic[]
    allowedNext: readonly TokenKind[]
    isComplete: boolean
    isEmpty: boolean
  }

  const { diagnostics, allowedNext, isComplete, isEmpty }: Props = $props()

  const TOKEN_KEYS: Record<TokenKind, MessageKey> = {
    'open-paren': 'token.openparen',
    'close-paren': 'token.closeparen',
    negation: 'token.negation',
    connective: 'token.connective',
    variable: 'token.variable',
  }

  const error = $derived(diagnostics.find((diagnostic) => diagnostic.severity === 'error'))

  const message = $derived.by(() => {
    if (error !== undefined) {
      return locale.t(error.messageKey)
    }

    if (isEmpty) {
      return ''
    }

    if (isComplete) {
      return locale.t('hint.complete')
    }

    if (allowedNext.length === 0) {
      return locale.t('hint.blocked')
    }

    return locale.t('hint.expected', {
      tokens: allowedNext.map((kind) => locale.t(TOKEN_KEYS[kind])).join(', '),
    })
  })
</script>

<p class="hint" class:error={error !== undefined} id="formula-hint" aria-live="polite">
  {#if message !== ''}
    {#if error !== undefined}
      <span class="code">{error.code}</span>
    {/if}
    <span>{message}</span>
  {/if}
</p>

<style>
  .hint {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: baseline;
    min-inline-size: 0;
    margin: 0;
    text-align: end;
    color: var(--color-text-muted);
    font-size: 0.875rem;
  }

  .hint.error {
    color: var(--color-error);
  }

  .code {
    padding: 1px var(--space-2);
    border-radius: var(--radius-pill);
    background: var(--color-error-soft);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 600;
  }
</style>
