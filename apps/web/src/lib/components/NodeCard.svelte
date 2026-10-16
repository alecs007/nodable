<script lang="ts">
  import { type LayoutNode, type LayoutOptions, type NodeKind, nodeLabel } from '@nodable/sdk'
  import { prefersReducedMotion } from 'svelte/motion'
  import { fade } from 'svelte/transition'
  import type { MessageKey } from '../i18n/messages'
  import { locale } from '../state/locale.svelte'

  type Props = {
    entry: LayoutNode
    options: LayoutOptions
  }

  const { entry, options }: Props = $props()

  const WIDTH = 220
  const HEIGHT = 92

  const KIND_KEYS: Record<NodeKind, MessageKey> = {
    slot: 'node.slot',
    group: 'node.group',
    unary: 'node.unary',
    binary: 'node.binary',
    leaf: 'node.leaf',
  }

  const INFO_KEYS: Record<NodeKind, MessageKey> = {
    slot: 'nodeinfo.slot',
    group: 'nodeinfo.group',
    unary: 'nodeinfo.unary',
    binary: 'nodeinfo.binary',
    leaf: 'nodeinfo.leaf',
  }

  const duration = $derived(prefersReducedMotion.current ? 0 : 160)
  const kind = $derived(entry.node.kind)
  const isDominant = $derived(entry.depth === 0 && (kind === 'unary' || kind === 'binary'))
  const hasChildren = $derived(kind !== 'slot' && kind !== 'leaf')
  const top = $derived(
    hasChildren
      ? entry.center.y - options.nodeHeight / 2 - 14 - HEIGHT
      : entry.center.y + options.nodeHeight / 2 + 12,
  )
  const title = $derived(
    kind === 'slot' || kind === 'group'
      ? locale.t(KIND_KEYS[kind])
      : `${locale.t(KIND_KEYS[kind])} ${nodeLabel(entry.node)}`,
  )
</script>

<foreignObject x={entry.center.x - WIDTH / 2} y={top} width={WIDTH} height={HEIGHT}>
  <div class="card" transition:fade={{ duration }}>
    <p class="title">{title}</p>
    <p class="info">{locale.t(INFO_KEYS[kind])}</p>
    {#if isDominant}
      <p class="info main">{locale.t('node.dominant')}</p>
    {/if}
  </div>
</foreignObject>

<style>
  .card {
    box-sizing: border-box;
    inline-size: 100%;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-2);
    background: var(--color-glass);
    backdrop-filter: var(--glass-blur);
    font-family: var(--font-sans);
  }

  .title {
    margin: 0;
    color: var(--color-text);
    font-size: 0.8125rem;
    font-weight: 600;
  }

  .main {
    color: var(--color-accent);
    font-weight: 600;
  }

  .info {
    margin: var(--space-1) 0 0;
    color: var(--color-text-muted);
    font-size: 0.75rem;
    line-height: 1.35;
  }
</style>
