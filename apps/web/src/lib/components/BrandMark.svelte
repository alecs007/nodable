<script lang="ts">
  import { locale } from '../state/locale.svelte'
</script>

<div class="brand" title={locale.t('app.tagline')}>
  <svg class="logo" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M6 7.5v9" />
    <path d="M6.9 6.9 17.1 17.1" />
    <path d="M18 7.5v9" />
    <circle cx="6" cy="5" r="2.1" />
    <circle cx="6" cy="19" r="2.1" />
    <circle cx="18" cy="5" r="2.1" />
    <circle cx="18" cy="19" r="2.1" />
  </svg>
  <span class="word">{locale.t('app.title')}</span>
</div>

<style>
  .brand {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    padding-inline: var(--space-1);
    color: var(--color-text);
  }

  .logo {
    inline-size: 1.5rem;
    block-size: 1.5rem;
    fill: none;
    stroke: currentcolor;
    stroke-width: 1.9;
    stroke-linecap: round;
  }

  .word {
    font-size: 1.0625rem;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
</style>
