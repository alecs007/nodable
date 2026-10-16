<script lang="ts">
  import { type NodeId, type TreeLayout, type TreeSnapshot, layoutTree, toText } from '@nodable/sdk'
  import { prefersReducedMotion } from 'svelte/motion'
  import { scale } from 'svelte/transition'
  import { locale } from '../state/locale.svelte'
  import TreeNodeShape from './TreeNodeShape.svelte'

  type Props = {
    snapshot: TreeSnapshot
    highlightedLeaves?: boolean
  }

  const { snapshot, highlightedLeaves = false }: Props = $props()

  const layout: TreeLayout = $derived(layoutTree(snapshot))
  const duration = $derived(prefersReducedMotion.current ? 0 : 180)
  const cursorNodeId: NodeId | undefined = $derived(
    snapshot.cursor.kind === 'node' ? snapshot.cursor.nodeId : undefined,
  )

  function arrowPath(x: number, y: number, height: number): string {
    const tip = y - height / 2 - 10

    return `M ${String(x)} ${String(tip)} l -9 -13 h 5 v -15 h 8 v 15 h 5 z`
  }
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
      transition:scale={{ duration }}
    />
  {/each}

  {#each layout.nodes as entry (entry.id)}
    <g class="node" transform="translate({entry.center.x}, {entry.center.y})">
      <g transition:scale={{ duration, start: 0.85 }}>
        <TreeNodeShape
          {entry}
          options={layout.options}
          isCursor={entry.id === cursorNodeId}
          isHighlighted={highlightedLeaves && entry.node.kind === 'leaf'}
        />
      </g>
    </g>
  {/each}

  <path
    class="cursor"
    d={arrowPath(layout.cursor.target.x, layout.cursor.target.y, layout.options.nodeHeight)}
  />
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
      x1 var(--duration-medium) ease,
      y1 var(--duration-medium) ease,
      x2 var(--duration-medium) ease,
      y2 var(--duration-medium) ease;
  }

  .node {
    transition: transform var(--duration-medium) ease;
  }

  .cursor {
    fill: var(--color-cursor);
    transition: d var(--duration-medium) ease;
  }
</style>
