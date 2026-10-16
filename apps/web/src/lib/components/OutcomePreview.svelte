<script lang="ts">
  import { prefersReducedMotion } from 'svelte/motion'
  import { fly } from 'svelte/transition'
  import { locale } from '../state/locale.svelte'

  const duration = $derived(prefersReducedMotion.current ? 0 : 200)
</script>

<aside class="preview" aria-label={locale.t('outcome.label')} transition:fly={{ y: 12, duration }}>
  <figure class="outcome">
    <svg viewBox="0 0 86 58" aria-hidden="true" focusable="false">
      <path class="link" d="M43 20 23 38 M43 20 63 38" />
      <rect class="box" x="29" y="6" width="28" height="15" rx="5" />
      <rect class="box" x="9" y="37" width="28" height="15" rx="5" />
      <rect class="box" x="49" y="37" width="28" height="15" rx="5" />
    </svg>
    <figcaption>{locale.t('outcome.double')}</figcaption>
  </figure>

  <figure class="outcome">
    <svg viewBox="0 0 86 58" aria-hidden="true" focusable="false">
      <path class="link" d="M43 20 43 38" />
      <rect class="box" x="29" y="6" width="28" height="15" rx="5" />
      <rect class="box" x="29" y="37" width="28" height="15" rx="5" />
    </svg>
    <figcaption>{locale.t('outcome.single')}</figcaption>
  </figure>
</aside>

<style>
  .preview {
    display: flex;
    gap: var(--space-3);
    padding: var(--space-3);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-3);
    background: var(--color-glass);
    backdrop-filter: var(--glass-blur);
  }

  .outcome {
    display: grid;
    gap: var(--space-1);
    justify-items: center;
    margin: 0;
  }

  svg {
    inline-size: 4.5rem;
    block-size: 3rem;
  }

  .box {
    fill: none;
    stroke: var(--color-text-muted);
    stroke-width: 1.4;
    stroke-dasharray: 4 3;
  }

  .link {
    fill: none;
    stroke: var(--color-text-muted);
    stroke-width: 1.4;
    stroke-linecap: round;
  }

  figcaption {
    color: var(--color-text-muted);
    font-size: 0.75rem;
  }
</style>
