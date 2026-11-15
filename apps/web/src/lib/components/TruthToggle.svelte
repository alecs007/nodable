<script lang="ts">
  import { type TruthValue } from '@nodable/sdk'
  import type { MessageKey } from '../i18n/messages'
  import { locale } from '../state/locale.svelte'

  type Option = {
    readonly value: TruthValue
    readonly letterKey: MessageKey
    readonly labelKey: MessageKey
  }

  type Props = {
    name: string
    group: string
    value: TruthValue | undefined
    onchange: (value: TruthValue) => void
  }

  const { name, group, value, onchange }: Props = $props()

  const OPTIONS: readonly Option[] = [
    { value: true, letterKey: 'truth.trueletter', labelKey: 'truth.true' },
    { value: false, letterKey: 'truth.falseletter', labelKey: 'truth.false' },
  ]
</script>

<div
  class="variable"
  class:true={value === true}
  class:false={value === false}
  role="radiogroup"
  aria-label={name}
>
  <span class="name" aria-hidden="true">{name}</span>
  <span class="choices">
    {#each OPTIONS as option (option.value)}
      <label
        class="choice"
        class:yes={option.value}
        class:no={!option.value}
        title={locale.t(option.labelKey)}
      >
        <input
          type="radio"
          name={group}
          checked={value === option.value}
          aria-label={locale.t(option.labelKey)}
          onchange={() => {
            onchange(option.value)
          }}
        />
        <span aria-hidden="true">{locale.t(option.letterKey)}</span>
      </label>
    {/each}
  </span>
</div>

<style>
  .variable {
    display: inline-flex;
    gap: var(--space-2);
    align-items: center;
    min-inline-size: 0;
    padding: 3px 3px 3px var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    background: var(--color-surface-raised);
    transition: border-color var(--duration-short) var(--ease);
  }

  .variable.true {
    border-color: var(--color-true);
  }

  .variable.false {
    border-color: var(--color-false);
  }

  .name {
    overflow: hidden;
    max-inline-size: 6rem;
    color: var(--color-text);
    font-family: var(--font-mono);
    font-size: 0.9375rem;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .choices {
    display: flex;
    gap: 2px;
    padding: 2px;
    border-radius: var(--radius-pill);
    background: var(--color-surface-sunken);
  }

  .choice {
    position: relative;
    display: grid;
    place-items: center;
    inline-size: 2rem;
    block-size: 1.875rem;
    border-radius: var(--radius-pill);
    color: var(--color-text-muted);
    font-family: var(--font-mono);
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
    transition:
      background var(--duration-short) var(--ease),
      color var(--duration-short) var(--ease);
  }

  .choice:hover {
    color: var(--color-text);
  }

  .choice input {
    position: absolute;
    inset: 0;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }

  .choice:has(input:focus-visible) {
    outline: 2px solid var(--color-focus);
    outline-offset: 1px;
  }

  .choice.yes:has(input:checked) {
    background: var(--color-true-soft);
    color: var(--color-true);
  }

  .choice.no:has(input:checked) {
    background: var(--color-false-soft);
    color: var(--color-false);
  }
</style>
