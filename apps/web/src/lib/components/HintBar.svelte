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

  const hint = $derived.by(() => {
    if (isEmpty) {
      return locale.t('hint.empty')
    }

    if (isComplete) {
      return locale.t('hint.complete')
    }

    if (allowedNext.length === 0) {
      return locale.t('hint.blocked')
    }

    const tokens = allowedNext.map((kind) => locale.t(TOKEN_KEYS[kind])).join(', ')

    return locale.t('hint.expected', { tokens })
  })
</script>

<div class="hint" id="formula-hint" aria-live="polite">
  <p class="expected">{hint}</p>

  <ul class="diagnostics">
    {#each diagnostics as diagnostic (diagnostic.code)}
      <li class="diagnostic" class:error={diagnostic.severity === 'error'}>
        <span class="code">{diagnostic.code}</span>
        <span>{locale.t(diagnostic.messageKey)}</span>
      </li>
    {/each}
  </ul>
</div>

<style>
  .hint {
    display: grid;
    gap: var(--space-2);
  }

  .expected {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.9375rem;
  }

  .diagnostics {
    display: grid;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .diagnostic {
    display: flex;
    gap: var(--space-2);
    align-items: baseline;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-1);
    background: var(--color-warning-soft);
    color: var(--color-warning);
    font-size: 0.9375rem;
  }

  .diagnostic.error {
    background: var(--color-error-soft);
    color: var(--color-error);
  }

  .code {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 700;
  }
</style>
