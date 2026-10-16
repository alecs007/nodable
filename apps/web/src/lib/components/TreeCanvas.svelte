<script lang="ts">
  import { type NodeId, type TreeLayout, type TreeSnapshot, layoutTree, toText } from '@nodable/sdk'
  import { prefersReducedMotion } from 'svelte/motion'
  import { fade, scale } from 'svelte/transition'
  import { locale } from '../state/locale.svelte'
  import TreeNodeShape from './TreeNodeShape.svelte'

  type Props = {
    snapshot: TreeSnapshot
    highlightLeaves?: boolean
    hideLabelFor?: NodeId | undefined
  }

  const { snapshot, highlightLeaves = false, hideLabelFor }: Props = $props()

  const layout: TreeLayout = $derived(layoutTree(snapshot))
  const duration = $derived(prefersReducedMotion.current ? 0 : 200)
  const cursorNodeId: NodeId | undefined = $derived(
    snapshot.cursor.kind === 'node' ? snapshot.cursor.nodeId : undefined,
  )

  const arrow = $derived(
    `M ${String(layout.cursor.anchor.x)} ${String(layout.cursor.anchor.y)} l 11 -7 v 4 h 13 v 6 h -13 v 4 z`,
  )
</script>

<svg
  class="canvas"
  width={layout.width}
  height={layout.height}
  viewBox="0 0 {layout.width} {layout.height}"
  preserveAspectRatio="xMidYMin meet"
  role="img"
  aria-label={locale.t('app.title')}
>
  <desc>{toText(snapshot.root)}</desc>

  {#each layout.edges as edge (edge.id)}
    <line
      class="edge"
      x1={edge.from.x}
      y1={edge.from.y}
      x2={edge.to.x}
      y2={edge.to.y}
      transition:fade={{ duration }}
    />
  {/each}

  {#each layout.nodes as entry (entry.id)}
    <g class="node" transform="translate({entry.center.x}, {entry.center.y})">
      <g transition:scale={{ duration, start: 0.85 }}>
        <TreeNodeShape
          {entry}
          options={layout.options}
          isCursor={entry.id === cursorNodeId}
          isComplete={snapshot.isComplete && entry.depth === 0}
          hasLabel={entry.id !== hideLabelFor}
          isHighlighted={highlightLeaves && entry.node.kind === 'leaf'}
        />
      </g>
    </g>
  {/each}

  {#if !snapshot.isComplete}
    <path class="cursor" d={arrow} transition:fade={{ duration }} />
  {/if}
</svg>

<style>
  .canvas {
    display: block;
    max-inline-size: 100%;
    block-size: auto;
  }

  .edge {
    stroke: var(--color-border-strong);
    stroke-width: 1.5;
    transition:
      x1 var(--duration-medium) var(--ease),
      y1 var(--duration-medium) var(--ease),
      x2 var(--duration-medium) var(--ease),
      y2 var(--duration-medium) var(--ease);
  }

  .node {
    transition: transform var(--duration-medium) var(--ease);
  }

  .cursor {
    fill: var(--color-cursor);
    transition: d var(--duration-medium) var(--ease);
  }
</style>
