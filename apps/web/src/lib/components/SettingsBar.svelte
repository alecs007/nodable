<script lang="ts">
  import { LOCALES, type Locale, type MessageKey } from '../i18n/messages'
  import { locale } from '../state/locale.svelte'
  import { THEME_PREFERENCES, type ThemePreference, theme } from '../theme/theme.svelte'

  const THEME_KEYS: Record<ThemePreference, MessageKey> = {
    light: 'theme.light',
    dark: 'theme.dark',
    system: 'theme.system',
  }

  const LOCALE_KEYS: Record<Locale, MessageKey> = {
    en: 'language.en',
    ro: 'language.ro',
  }
</script>

<div class="settings">
  <label class="setting">
    <span class="caption">{locale.t('theme.label')}</span>
    <select
      value={theme.preference}
      onchange={(event) => {
        theme.select(event.currentTarget.value as ThemePreference)
      }}
    >
      {#each THEME_PREFERENCES as preference (preference)}
        <option value={preference}>{locale.t(THEME_KEYS[preference])}</option>
      {/each}
    </select>
  </label>

  <label class="setting">
    <span class="caption">{locale.t('language.label')}</span>
    <select
      value={locale.current}
      onchange={(event) => {
        locale.select(event.currentTarget.value as Locale)
      }}
    >
      {#each LOCALES as code (code)}
        <option value={code}>{locale.t(LOCALE_KEYS[code])}</option>
      {/each}
    </select>
  </label>
</div>

<style>
  .settings {
    display: flex;
    gap: var(--space-4);
  }

  .setting {
    display: grid;
    gap: var(--space-1);
  }

  .caption {
    color: var(--color-text-muted);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  select {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-1);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: 0.9375rem;
  }
</style>
