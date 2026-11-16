<script lang="ts">
  import { type Classification, type Satisfiability } from '@nodable/sdk'
  import type { MessageKey } from '../i18n/messages'
  import { locale } from '../state/locale.svelte'

  type Props = {
    classification: Classification
  }

  const { classification }: Props = $props()

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

  const info = $derived(
    `${locale.t(INFO_KEYS[classification.kind])}. ${locale.t('class.count', {
      models: String(classification.models),
      total: String(classification.interpretations),
    })}.`,
  )
</script>

<span class="badge {classification.kind}" title={info}>
  <span class="sr-only">{locale.t('class.label')}:</span>
  <span class="name">{locale.t(NAME_KEYS[classification.kind])}</span>
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
    block-size: 1.375rem;
    padding-inline: var(--space-3);
    border: 1px solid currentcolor;
    border-radius: var(--radius-pill);
    font-size: 0.8125rem;
    font-weight: 600;
    white-space: nowrap;
    line-height: 1;
    cursor: default;
  }

  .name {
    display: block;
    text-box: trim-both cap alphabetic;
  }

  .valid {
    background: var(--color-true-soft);
    color: var(--color-true);
  }

  .satisfiable {
    border-color: var(--color-border-strong);
    background: var(--color-surface-sunken);
    color: var(--color-text);
  }

  .unsatisfiable {
    background: var(--color-false-soft);
    color: var(--color-false);
  }
</style>
