<script lang="ts">
  import { LOCALES, type Locale, type MessageKey } from '../i18n/messages'
  import { locale } from '../state/locale.svelte'
  import { workspace } from '../state/workspace.svelte'
  import { THEME_PREFERENCES, type ThemePreference, theme } from '../theme/theme.svelte'
  import FormulaMenu from './FormulaMenu.svelte'
  import Icon, { type IconName } from './Icon.svelte'

  const THEME_ICONS: Record<ThemePreference, IconName> = {
    light: 'light',
    dark: 'dark',
    system: 'system',
  }

  const THEME_KEYS: Record<ThemePreference, MessageKey> = {
    light: 'theme.light',
    dark: 'theme.dark',
    system: 'theme.system',
  }

  function nextOf<T>(values: readonly T[], current: T): T {
    const index = values.indexOf(current)

    return values[(index + 1) % values.length] ?? current
  }

  const themeLabel = $derived(
    `${locale.t('theme.label')}: ${locale.t(THEME_KEYS[theme.preference])}`,
  )
</script>

<div class="bar">
  {#if workspace.sessions.length > 1}
    <FormulaMenu
      sessions={workspace.sessions}
      activeId={workspace.activeId}
      onselect={(id: string) => {
        workspace.select(id)
      }}
    />
  {/if}

  <div class="cluster" role="group" aria-label={locale.t('view.label')}>
    <button
      type="button"
      class="key"
      class:on={workspace.view === 'single'}
      aria-pressed={workspace.view === 'single'}
      title={locale.t('view.single')}
      aria-label={locale.t('view.single')}
      onclick={() => {
        workspace.setView('single')
      }}
    >
      <Icon name="single" />
    </button>
    <button
      type="button"
      class="key"
      class:on={workspace.view === 'all'}
      aria-pressed={workspace.view === 'all'}
      title={locale.t('view.all')}
      aria-label={locale.t('view.all')}
      onclick={() => {
        workspace.setView('all')
      }}
    >
      <Icon name="gallery" />
    </button>
    <button
      type="button"
      class="key"
      class:on={workspace.highlightLeaves}
      aria-pressed={workspace.highlightLeaves}
      title={locale.t('view.highlightleaves')}
      aria-label={locale.t('view.highlightleaves')}
      onclick={() => {
        workspace.toggleHighlightLeaves()
      }}
    >
      <Icon name="highlight" />
    </button>
  </div>

  <div class="cluster" role="group" aria-label={locale.t('workspace.label')}>
    <button
      type="button"
      class="key"
      title={locale.t('workspace.add')}
      aria-label={locale.t('workspace.add')}
      onclick={() => {
        workspace.addFormula()
      }}
    >
      <Icon name="add" />
    </button>
    <button
      type="button"
      class="key"
      disabled={workspace.sessions.length < 2}
      title={locale.t('workspace.remove')}
      aria-label={locale.t('workspace.remove')}
      onclick={() => {
        workspace.removeActive()
      }}
    >
      <Icon name="remove" />
    </button>
    <button
      type="button"
      class="key"
      title={locale.t('workspace.resetpositions')}
      aria-label={locale.t('workspace.resetpositions')}
      onclick={() => {
        workspace.clearPositions()
      }}
    >
      <Icon name="reset" />
    </button>
  </div>

  <div class="cluster">
    <button
      type="button"
      class="key"
      title={themeLabel}
      aria-label={themeLabel}
      onclick={() => {
        theme.select(nextOf(THEME_PREFERENCES, theme.preference))
      }}
    >
      <Icon name={THEME_ICONS[theme.preference]} />
    </button>
    <button
      type="button"
      class="key wide"
      title={locale.t('language.label')}
      aria-label={locale.t('language.label')}
      onclick={() => {
        locale.select(nextOf<Locale>(LOCALES, locale.current))
      }}
    >
      <Icon name="language" />
      <span class="code">{locale.current}</span>
    </button>
  </div>
</div>

<style>
  .bar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    align-items: center;
  }

  .cluster {
    display: flex;
    gap: var(--space-1);
    padding: 3px;
    border-radius: var(--radius-pill);
    background: var(--color-surface-sunken);
  }

  .key {
    display: flex;
    gap: var(--space-1);
    align-items: center;
    justify-content: center;
    min-inline-size: 2.25rem;
    block-size: 2.25rem;
    padding-inline: var(--space-2);
    border: none;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition:
      background var(--duration-short) ease,
      color var(--duration-short) ease;
  }

  .key:hover:not(:disabled) {
    background: var(--color-surface-raised);
    color: var(--color-text);
  }

  .key.on {
    background: var(--color-surface-raised);
    color: var(--color-accent);
  }

  .key:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .wide {
    padding-inline: var(--space-3);
  }

  .code {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: lowercase;
  }
</style>
