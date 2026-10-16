<script lang="ts">
  import { type LayoutNode, type LayoutOptions, nodeLabel } from '@nodable/sdk'
  import { locale } from '../state/locale.svelte'

  type Props = {
    entry: LayoutNode
    options: LayoutOptions
    isCursor: boolean
    isHighlighted: boolean
  }

  const { entry, options, isCursor, isHighlighted }: Props = $props()

  const left = $derived(-options.nodeWidth / 2)
  const top = $derived(-options.nodeHeight / 2)
  const label = $derived(nodeLabel(entry.node))
  const description = $derived(`${entry.node.kind} ${label}`)
</script>

<g class="shape" role="img" aria-label={description} aria-current={isCursor ? 'true' : undefined}>
  <rect
    class="box"
    class:slot={entry.node.kind === 'slot'}
    class:leaf={entry.node.kind === 'leaf'}
    class:highlighted={isHighlighted}
    class:cursor={isCursor}
    x={left}
    y={top}
    width={options.nodeWidth}
    height={options.nodeHeight}
    rx="8"
  />

  {#if entry.node.kind === 'group'}
    <line class="divider" x1="0" y1={top} x2="0" y2={top + options.nodeHeight} />
    <text class="choice" x={left + options.nodeWidth / 4} y="6">A</text>
    <text class="choice" x={-left - options.nodeWidth / 4} y="6">B</text>
  {:else if entry.node.kind !== 'slot'}
    <text class="label" x="0" y="7">{label}</text>
  {/if}

  {#if entry.node.kind === 'group'}
    <title>{locale.t('toolbar.label')}</title>
  {/if}
</g>

<style>
  .box {
    fill: var(--color-surface);
    stroke: var(--color-border-strong);
    stroke-width: 1.5;
    transition:
      fill var(--duration-short) ease,
      stroke var(--duration-short) ease;
  }

  .box.leaf {
    fill: var(--color-accent-soft);
  }

  .box.slot {
    fill: none;
    stroke: var(--color-border);
    stroke-dasharray: 5 5;
  }

  .box.highlighted {
    fill: var(--color-accent-soft);
    stroke: var(--color-accent);
  }

  .box.cursor {
    stroke: var(--color-cursor);
    stroke-width: 2.5;
  }

  .divider {
    stroke: var(--color-border);
    stroke-width: 1;
    stroke-dasharray: 4 4;
  }

  .label {
    fill: var(--color-text);
    font-family: var(--font-sans);
    font-size: 1.125rem;
    font-weight: 600;
    text-anchor: middle;
  }

  .choice {
    fill: var(--color-text-muted);
    font-family: var(--font-sans);
    font-size: 0.8125rem;
    text-anchor: middle;
  }
</style>
