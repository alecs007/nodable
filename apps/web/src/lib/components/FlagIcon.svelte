<script lang="ts">
  import { type Locale } from '../i18n/messages'

  type Props = {
    locale: Locale
  }

  const { locale: code }: Props = $props()
</script>

{#if code === 'ro'}
  <svg class="flag" viewBox="0 0 30 30" aria-hidden="true">
    <rect width="10" height="30" fill="#002b7f" />
    <rect x="10" width="10" height="30" fill="#fcd116" />
    <rect x="20" width="10" height="30" fill="#ce1126" />
  </svg>
{:else}
  <svg class="flag" viewBox="15 0 30 30" aria-hidden="true">
    <rect width="60" height="30" fill="#012169" />
    <path d="M0 0 60 30M60 0 0 30" stroke="#ffffff" stroke-width="6" />
    <path d="M0 0 60 30M60 0 0 30" stroke="#c8102e" stroke-width="3" />
    <path d="M30 0v30M0 15h60" stroke="#ffffff" stroke-width="10" />
    <path d="M30 0v30M0 15h60" stroke="#c8102e" stroke-width="6" />
  </svg>
{/if}

<style>
  .flag {
    inline-size: 1.25rem;
    block-size: 1.25rem;
    flex: none;
    border-radius: 50%;
    box-shadow: inset 0 0 0 1px var(--color-glass-border);
  }
</style>
