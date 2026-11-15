<script lang="ts">
  import {
    type LayoutNode,
    type LayoutOptions,
    type NodeKind,
    type TruthValue,
    nodeLabel,
  } from '@nodable/sdk'
  import type { MessageKey } from '../i18n/messages'
  import { letterOf } from '../interpretation/computation'
  import { locale } from '../state/locale.svelte'

  type Props = {
    entry: LayoutNode
    options: LayoutOptions
    isCursor: boolean
    isComplete: boolean
    isSelected?: boolean | undefined
    hasLabel?: boolean | undefined
    isEvaluated?: boolean | undefined
    value?: TruthValue | undefined
  }

  const {
    entry,
    options,
    isCursor,
    isComplete,
    isSelected = false,
    hasLabel = true,
    isEvaluated = false,
    value,
  }: Props = $props()

  const KIND_KEYS: Record<NodeKind, MessageKey> = {
    slot: 'node.slot',
    group: 'node.group',
    unary: 'node.unary',
    binary: 'node.binary',
    leaf: 'node.leaf',
  }

  const left = $derived(-options.nodeWidth / 2)
  const top = $derived(-options.nodeHeight / 2)
  const label = $derived(nodeLabel(entry.node))
  const kindName = $derived(locale.t(KIND_KEYS[entry.node.kind]))
  const isLabelled = $derived(hasLabel && entry.node.kind !== 'slot' && entry.node.kind !== 'group')
  const named = $derived(isLabelled ? `${kindName} ${label}` : kindName)
  const truthName = $derived(
    value === undefined ? undefined : locale.t(value ? 'truth.true' : 'truth.false'),
  )
  const description = $derived(
    isEvaluated && truthName !== undefined ? `${named}: ${truthName}` : named,
  )
  const letter = $derived(
    letterOf(value, { true: locale.t('truth.trueletter'), false: locale.t('truth.falseletter') }),
  )
</script>

<g class="shape" role="img" aria-label={description} aria-current={isCursor ? 'true' : undefined}>
  {#if isSelected}
    <rect
      class="halo"
      x={left - 8}
      y={top - 8}
      width={options.nodeWidth + 16}
      height={options.nodeHeight + 16}
      rx="19"
    />
  {/if}

  <rect
    class="box"
    class:slot={entry.node.kind === 'slot'}
    class:leaf={entry.node.kind === 'leaf'}
    class:pending={entry.node.kind === 'group'}
    class:cursor={isCursor}
    class:selected={isSelected}
    class:done={isComplete && !isEvaluated}
    class:true={isEvaluated && value === true}
    class:false={isEvaluated && value === false}
    x={left}
    y={top}
    width={options.nodeWidth}
    height={options.nodeHeight}
    rx="11"
  />

  {#if isLabelled}
    <text class="label" x="0" y="0">{label}</text>
  {/if}

  {#if isEvaluated}
    <g
      class="badge"
      class:true={value === true}
      class:false={value === false}
      transform="translate({-left - 4}, {top + 4})"
    >
      <circle r="11" />
      <text x="0" y="0">{letter}</text>
    </g>
  {/if}
</g>

<style>
  .box {
    fill: var(--color-surface-raised);
    stroke: var(--color-border-strong);
    stroke-width: 1.5;
    transition:
      fill var(--duration-short) var(--ease),
      stroke var(--duration-short) var(--ease);
  }

  .box.leaf {
    fill: var(--color-accent-soft);
  }

  .box.slot {
    fill: none;
    stroke: var(--color-border);
    stroke-dasharray: 5 5;
  }

  .box.pending {
    stroke-dasharray: 5 5;
  }

  .box.cursor {
    stroke: var(--color-cursor);
    stroke-width: 2.5;
  }

  .box.selected {
    fill: var(--color-accent-soft);
  }

  .halo {
    fill: none;
    stroke: var(--color-accent);
    stroke-width: 1.6;
    stroke-dasharray: 3 4;
    opacity: 0.85;
  }

  .box.done {
    stroke: var(--color-accent);
  }

  .box.true {
    fill: var(--color-true-soft);
    stroke: var(--color-true);
  }

  .box.false {
    fill: var(--color-false-soft);
    stroke: var(--color-false);
  }

  .badge circle {
    fill: var(--color-surface-raised);
    stroke: var(--color-border-strong);
    stroke-width: 1.5;
    stroke-dasharray: 3 3;
  }

  .badge text {
    dominant-baseline: central;
    fill: var(--color-text-muted);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 700;
    text-anchor: middle;
  }

  .badge.true circle {
    fill: var(--color-true);
    stroke: var(--color-true);
    stroke-dasharray: none;
  }

  .badge.false circle {
    fill: var(--color-false);
    stroke: var(--color-false);
    stroke-dasharray: none;
  }

  .badge.true text,
  .badge.false text {
    fill: var(--color-surface-raised);
  }

  .label {
    dominant-baseline: central;
    fill: var(--color-text);
    font-family: var(--font-sans);
    font-size: 1.125rem;
    font-weight: 600;
    text-anchor: middle;
  }
</style>
