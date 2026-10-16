<script lang="ts" module>
  export type IconName =
    | 'single'
    | 'gallery'
    | 'highlight'
    | 'add'
    | 'remove'
    | 'reset'
    | 'light'
    | 'dark'
    | 'system'
    | 'language'
    | 'clear'
    | 'save'
    | 'trash'

  type Circle = { readonly cx: number; readonly cy: number; readonly r: number }

  type Shape = { readonly paths: readonly string[]; readonly circles: readonly Circle[] }

  const SHAPES: Record<IconName, Shape> = {
    single: {
      paths: ['M12 7v3', 'M12 10 7 15', 'M12 10l5 5'],
      circles: [
        { cx: 12, cy: 5, r: 2 },
        { cx: 6, cy: 17, r: 2 },
        { cx: 18, cy: 17, r: 2 },
      ],
    },
    gallery: {
      paths: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h6v6h-6z'],
      circles: [],
    },
    highlight: {
      paths: [
        'M12 3.5 13.7 8.3 18.5 10 13.7 11.7 12 16.5 10.3 11.7 5.5 10 10.3 8.3z',
        'M18 17l.8 2.2L21 20l-2.2.8L18 23l-.8-2.2L15 20l2.2-.8z',
      ],
      circles: [],
    },
    add: { paths: ['M12 5v14', 'M5 12h14'], circles: [] },
    remove: { paths: ['M5 12h14'], circles: [] },
    reset: { paths: ['M4 12a8 8 0 1 0 2.6-5.9L4 8.5', 'M4 4v5h5'], circles: [] },
    light: {
      paths: [
        'M12 3.5v-1.2',
        'M12 21.7v-1.2',
        'M3.5 12H2.3',
        'M21.7 12h-1.2',
        'M6 6 5.1 5.1',
        'M18.9 18.9 18 18',
        'M18 6l.9-.9',
        'M5.1 18.9 6 18',
      ],
      circles: [{ cx: 12, cy: 12, r: 4 }],
    },
    dark: { paths: ['M20.5 14.3A8.6 8.6 0 0 1 9.7 3.5a8.6 8.6 0 1 0 10.8 10.8z'], circles: [] },
    system: { paths: ['M3.5 5h17v11h-17z', 'M9 20h6', 'M12 16v4'], circles: [] },
    language: {
      paths: ['M3.2 12h17.6', 'M12 3.2a15 15 0 0 1 0 17.6', 'M12 3.2a15 15 0 0 0 0 17.6'],
      circles: [{ cx: 12, cy: 12, r: 8.8 }],
    },
    clear: { paths: ['M7 7l10 10', 'M17 7 7 17'], circles: [] },
    trash: {
      paths: ['M4.5 7h15', 'M10 11v6', 'M14 11v6', 'M6.5 7l1 12.5h9L17.5 7', 'M9.5 7V4.5h5V7'],
      circles: [],
    },
    save: {
      paths: ['M12 3.5v11', 'M8 11l4 4 4-4', 'M4.5 16.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2'],
      circles: [],
    },
  }
</script>

<script lang="ts">
  type Props = {
    name: IconName
  }

  const { name }: Props = $props()

  const shape = $derived(SHAPES[name])
</script>

<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  {#each shape.paths as path (path)}
    <path d={path} />
  {/each}
  {#each shape.circles as circle (circle.cx + circle.cy)}
    <circle cx={circle.cx} cy={circle.cy} r={circle.r} />
  {/each}
</svg>

<style>
  .icon {
    inline-size: 1.125rem;
    block-size: 1.125rem;
    fill: none;
    stroke: currentcolor;
    stroke-width: 1.7;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
