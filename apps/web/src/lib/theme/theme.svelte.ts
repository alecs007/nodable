import { readSetting, writeSetting } from '../storage/settings'

export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const

export type ThemePreference = (typeof THEME_PREFERENCES)[number]

export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'nodable.theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function isThemePreference(value: string): value is ThemePreference {
  return THEME_PREFERENCES.some((preference) => preference === value)
}

function readPreference(): ThemePreference {
  const stored = readSetting(STORAGE_KEY)

  return stored !== undefined && isThemePreference(stored) ? stored : 'system'
}

function prefersDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches
}

function resolve(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') {
    return prefersDark() ? 'dark' : 'light'
  }

  return preference
}

function createTheme(): {
  readonly preference: ThemePreference
  readonly resolved: ResolvedTheme
  select: (next: ThemePreference) => void
  start: () => () => void
} {
  let preference = $state<ThemePreference>(readPreference())
  let resolved = $state<ResolvedTheme>(resolve(preference))

  function apply(): void {
    resolved = resolve(preference)
    document.documentElement.dataset['theme'] = resolved
  }

  return {
    get preference() {
      return preference
    },
    get resolved() {
      return resolved
    },
    select(next: ThemePreference) {
      preference = next
      writeSetting(STORAGE_KEY, next)
      apply()
    },
    start() {
      const media = window.matchMedia(DARK_QUERY)
      const onChange = (): void => {
        apply()
      }

      apply()
      media.addEventListener('change', onChange)

      return () => {
        media.removeEventListener('change', onChange)
      }
    },
  }
}

export const theme = createTheme()
