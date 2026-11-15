<script lang="ts">
  import {
    type Evaluation,
    type EvaluationStep,
    type NodeId,
    type TreeLayout,
    type TreeSnapshot,
    layoutTree,
    toText,
  } from '@nodable/sdk'
  import { prefersReducedMotion } from 'svelte/motion'
  import { fade } from 'svelte/transition'
  import { computationOf, letterOf } from '../interpretation/computation'
  import { locale } from '../state/locale.svelte'
  import NodeCard from './NodeCard.svelte'
  import TreeNodeShape from './TreeNodeShape.svelte'

  type Props = {
    snapshot: TreeSnapshot
    unlabelled?: readonly NodeId[]
    evaluation?: Evaluation | undefined
  }

  const { snapshot, unlabelled = [], evaluation }: Props = $props()

  const isEvaluated = $derived(evaluation !== undefined)
  const stepsById = $derived(
    new Map<NodeId, EvaluationStep>(evaluation?.steps.map((step) => [step.node.id, step]) ?? []),
  )
  const letters = $derived({
    true: locale.t('truth.trueletter'),
    false: locale.t('truth.falseletter'),
  })

  function computationFor(id: NodeId): string | undefined {
    const step = stepsById.get(id)

    if (step === undefined) {
      return undefined
    }

    return `${computationOf(step, letters)} = ${letterOf(step.value, letters)}`
  }

  const layout: TreeLayout = $derived(layoutTree(snapshot))
  const duration = $derived(prefersReducedMotion.current ? 0 : 200)
  const cursorNodeId: NodeId | undefined = $derived(
    snapshot.cursor.kind === 'node' ? snapshot.cursor.nodeId : undefined,
  )

  let selectedId = $state<NodeId | undefined>()

  const selected = $derived(layout.nodes.find((entry) => entry.id === selectedId))

  function clearSelection(): void {
    selectedId = undefined
  }

  function toggle(id: NodeId): void {
    selectedId = selectedId === id ? undefined : id
  }

  const arrow = $derived(
    `M ${String(layout.cursor.anchor.x)} ${String(layout.cursor.anchor.y)} l 11 -7 v 4 h 13 v 6 h -13 v 4 z`,
  )
</script>

<svelte:window
  onpointerdown={clearSelection}
  onkeydown={(event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      clearSelection()
    }
  }}
/>

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
      in:fade={{ duration }}
    />
  {/each}

  {#each layout.nodes as entry (entry.id)}
    <g
      class="node"
      class:selected={entry.id === selectedId}
      transform="translate({entry.center.x}, {entry.center.y})"
      role="button"
      tabindex="0"
      aria-pressed={entry.id === selectedId}
      onclick={() => {
        toggle(entry.id)
      }}
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          toggle(entry.id)
        }
      }}
    >
      <g in:fade={{ duration }}>
        <TreeNodeShape
          {entry}
          options={layout.options}
          isCursor={entry.id === cursorNodeId}
          isComplete={snapshot.isComplete && entry.depth === 0}
          isSelected={entry.id === selectedId}
          hasLabel={!unlabelled.includes(entry.id)}
          {isEvaluated}
          value={stepsById.get(entry.id)?.value}
        />
      </g>
    </g>
  {/each}

  {#if !snapshot.isComplete}
    <path class="cursor" d={arrow} in:fade={{ duration }} />
  {/if}

  {#if selected !== undefined}
    <NodeCard
      entry={selected}
      options={layout.options}
      hasLabel={!unlabelled.includes(selected.id)}
      computation={computationFor(selected.id)}
    />
  {/if}
</svg>

<style>
  .canvas {
    display: block;
    max-inline-size: 100%;
    block-size: auto;
    overflow: visible;
  }

  .edge {
    stroke: var(--color-border-strong);
    stroke-width: 1.5;
  }

  .node {
    cursor: pointer;
  }

  .node:focus {
    outline: none;
  }

  .node:focus-visible:not(.selected) {
    outline: 2px solid var(--color-focus);
    outline-offset: 4px;
  }

  .cursor {
    fill: var(--color-cursor);
  }
</style>
