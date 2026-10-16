<script lang="ts">
  import { LOCALES, type Locale, type MessageKey } from '../i18n/messages'
  import { locale } from '../state/locale.svelte'
  import { workspace } from '../state/workspace.svelte'
  import { THEMES, type Theme, theme } from '../theme/theme.svelte'
  import FileMenu from './FileMenu.svelte'
  import FormulaMenu from './FormulaMenu.svelte'
  import Icon, { type IconName } from './Icon.svelte'

  const THEME_ICONS: Record<Theme, IconName> = { light: 'light', dark: 'dark' }

  const THEME_KEYS: Record<Theme, MessageKey> = { light: 'theme.light', dark: 'theme.dark' }

  function nextOf<T>(values: readonly T[], current: T): T {
    const index = values.indexOf(current)

    return values[(index + 1) % values.length] ?? current
  }

  const themeLabel = $derived(`${locale.t('theme.label')}: ${locale.t(THEME_KEYS[theme.current])}`)
</script>

<div class="row primary">
  {#if workspace.sessions.length > 1}
    <div class="picker">
      <FormulaMenu
        sessions={workspace.sessions}
        activeId={workspace.activeId}
        onselect={(id: string) => {
          workspace.select(id)
        }}
        ondelete={(id: string) => {
          workspace.remove(id)
        }}
      />
    </div>
  {/if}
</div>

<div class="row secondary">
  <div class="cluster">
    <button
      type="button"
      class="key"
      title={themeLabel}
      aria-label={themeLabel}
      onclick={() => {
        theme.select(nextOf<Theme>(THEMES, theme.current))
      }}
    >
      <Icon name={THEME_ICONS[theme.current]} />
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
    <FileMenu />
  </div>

  <button
    type="button"
    class="create"
    onclick={() => {
      workspace.addFormula()
    }}
  >
    <Icon name="add" />
    <span>{locale.t('workspace.add')}</span>
  </button>
</div>

<style>
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
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
      background var(--duration-short) var(--ease),
      color var(--duration-short) var(--ease);
  }

  .key:hover:not(:disabled) {
    background: var(--color-surface-raised);
    color: var(--color-text);
  }

  .wide {
    padding-inline: var(--space-3);
  }

  .code {
    font-size: 0.75rem;
    font-weight: 600;
  }

  .picker {
    min-inline-size: 0;
  }

  .create {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    block-size: 2.5rem;
    padding-inline: var(--space-4);
    border: none;
    border-radius: var(--radius-pill);
    background: var(--color-accent);
    color: var(--color-accent-contrast);
    font-family: var(--font-sans);
    font-size: 0.875rem;
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
    transition: opacity var(--duration-short) var(--ease);
  }

  .create:hover {
    opacity: 0.88;
  }

  @media (width <= 48rem) {
    .row {
      inline-size: 100%;
      justify-content: space-between;
    }

    .picker {
      flex: 0 0 50%;
    }

    .create {
      flex: 1;
      justify-content: center;
    }
  }
</style>
