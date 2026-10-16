<script lang="ts">
  import {
    type LayoutNode,
    type NodeId,
    type Point,
    type TreeLayout,
    type TreeSnapshot,
    layoutTree,
    toText,
  } from '@nodable/sdk'
  import { prefersReducedMotion } from 'svelte/motion'
  import { fade, scale } from 'svelte/transition'
  import { locale } from '../state/locale.svelte'
  import TreeNodeShape from './TreeNodeShape.svelte'

  type Props = {
    snapshot: TreeSnapshot
    highlightLeaves?: boolean
    interactive?: boolean
    hideLabelFor?: NodeId | undefined
    onmovenode?: (nodeId: NodeId, delta: Point) => void
  }

  const {
    snapshot,
    highlightLeaves = false,
    interactive = false,
    hideLabelFor,
    onmovenode,
  }: Props = $props()

  const KEYBOARD_STEP = 8

  const KEYBOARD_DELTAS: Record<string, Point> = {
    ArrowUp: { x: 0, y: -KEYBOARD_STEP },
    ArrowDown: { x: 0, y: KEYBOARD_STEP },
    ArrowLeft: { x: -KEYBOARD_STEP, y: 0 },
    ArrowRight: { x: KEYBOARD_STEP, y: 0 },
  }

  let surface: SVGSVGElement | undefined = $state()
  let dragged: NodeId | undefined = $state()
  let origin: Point = { x: 0, y: 0 }

  const layout: TreeLayout = $derived(layoutTree(snapshot))
  const duration = $derived(prefersReducedMotion.current ? 0 : 180)
  const cursorNodeId: NodeId | undefined = $derived(
    snapshot.cursor.kind === 'node' ? snapshot.cursor.nodeId : undefined,
  )

  function pixelsPerUnit(): number {
    const rendered = surface?.getBoundingClientRect().width ?? layout.width

    return rendered === 0 ? 1 : rendered / layout.width
  }

  const arrow = $derived(
    `M ${String(layout.cursor.anchor.x)} ${String(layout.cursor.anchor.y)} l 11 -7 v 4 h 13 v 6 h -13 v 4 z`,
  )

  function startDrag(event: PointerEvent, entry: LayoutNode, handle: SVGGElement): void {
    if (!interactive) {
      return
    }

    dragged = entry.id
    origin = { x: event.clientX, y: event.clientY }
    handle.setPointerCapture(event.pointerId)
  }

  function continueDrag(event: PointerEvent, entry: LayoutNode): void {
    if (dragged !== entry.id) {
      return
    }

    const ratio = pixelsPerUnit()

    onmovenode?.(entry.id, {
      x: (event.clientX - origin.x) / ratio,
      y: (event.clientY - origin.y) / ratio,
    })

    origin = { x: event.clientX, y: event.clientY }
  }

  function endDrag(): void {
    dragged = undefined
  }

  function onNodeKeyDown(event: KeyboardEvent, entry: LayoutNode): void {
    const delta = KEYBOARD_DELTAS[event.key]

    if (!interactive || delta === undefined) {
      return
    }

    event.preventDefault()
    onmovenode?.(entry.id, delta)
  }
</script>

<svg
  bind:this={surface}
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

  {#snippet shape(entry: LayoutNode)}
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
  {/snippet}

  {#each layout.nodes as entry (entry.id)}
    {#if interactive}
      <g
        class="node draggable"
        class:dragging={dragged === entry.id}
        transform="translate({entry.center.x}, {entry.center.y})"
        role="button"
        tabindex="0"
        aria-label={locale.t('canvas.movenode')}
        onpointerdown={(event) => {
          startDrag(event, entry, event.currentTarget)
        }}
        onpointermove={(event) => {
          continueDrag(event, entry)
        }}
        onpointerup={endDrag}
        onpointercancel={endDrag}
        onkeydown={(event) => {
          onNodeKeyDown(event, entry)
        }}
      >
        {@render shape(entry)}
      </g>
    {:else}
      <g class="node" transform="translate({entry.center.x}, {entry.center.y})">
        {@render shape(entry)}
      </g>
    {/if}
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
    touch-action: none;
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

  .node.draggable {
    cursor: grab;
  }

  .node.dragging {
    cursor: grabbing;
    transition: none;
  }

  .cursor {
    fill: var(--color-cursor);
    transition: d var(--duration-medium) ease;
  }
</style>
