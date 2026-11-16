<script lang="ts">
  import { type Classification, type Diagnostic, type TokenKind } from '@nodable/sdk'
  import type { MessageKey } from '../i18n/messages'
  import { locale } from '../state/locale.svelte'
  import ClassificationBadge from './ClassificationBadge.svelte'

  type Props = {
    diagnostics: readonly Diagnostic[]
    allowedNext: readonly TokenKind[]
    isComplete: boolean
    isEmpty: boolean
    classification?: Classification | undefined
  }

  const { diagnostics, allowedNext, isComplete, isEmpty, classification }: Props = $props()

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
      return locale.t('hint.empty')
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

<p
  class="hint"
  class:error={error !== undefined}
  class:quiet={message === ''}
  id="formula-hint"
  aria-live="polite"
>
  {#if message !== ''}
    <span class="message">{message}</span>
  {/if}
  {#if error === undefined && isComplete && classification !== undefined}
    <ClassificationBadge {classification} />
  {/if}
</p>

<style>
  .hint {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
    min-block-size: 1.75rem;
    margin: 0;
    padding-inline: var(--space-2);
    color: var(--color-text-muted);
    font-size: 0.875rem;
    transition:
      opacity var(--duration-medium) var(--ease),
      color var(--duration-medium) var(--ease);
  }

  .message {
    min-inline-size: 0;
  }

  @media (width <= 30rem) {
    .hint:has(:global(.badge)) {
      flex-wrap: nowrap;
      gap: var(--space-1);
      font-size: 0.8125rem;
    }

    .hint :global(.badge) {
      padding-inline: var(--space-2);
      font-size: 0.75rem;
    }

    .hint:has(:global(.badge)) .message {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  @media (width <= 22rem) {
    .hint:has(:global(.badge)) .message {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      clip-path: inset(50%);
    }
  }

  .hint.quiet {
    opacity: 0;
  }

  .hint.error {
    color: var(--color-error);
  }
</style>
