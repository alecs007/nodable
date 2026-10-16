<script lang="ts">
  import { type LayoutNode, type LayoutOptions, type NodeKind, nodeLabel } from '@nodable/sdk'
  import type { MessageKey } from '../i18n/messages'
  import { locale } from '../state/locale.svelte'

  type Props = {
    entry: LayoutNode
    options: LayoutOptions
    isCursor: boolean
    isComplete: boolean
    hasLabel?: boolean | undefined
  }

  const { entry, options, isCursor, isComplete, hasLabel = true }: Props = $props()

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
  const description = $derived(isLabelled ? `${kindName} ${label}` : kindName)
</script>

<g class="shape" role="img" aria-label={description} aria-current={isCursor ? 'true' : undefined}>
  <rect
    class="box"
    class:slot={entry.node.kind === 'slot'}
    class:leaf={entry.node.kind === 'leaf'}
    class:pending={entry.node.kind === 'group'}
    class:cursor={isCursor}
    class:done={isComplete}
    x={left}
    y={top}
    width={options.nodeWidth}
    height={options.nodeHeight}
    rx="11"
  />

  {#if isLabelled}
    <text class="label" x="0" y="0">{label}</text>
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

  .box.done {
    stroke: var(--color-accent);
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
