import { readSetting, writeSetting } from '../storage/settings'

export const THEMES = ['light', 'dark'] as const

export type Theme = (typeof THEMES)[number]

const STORAGE_KEY = 'nodable.theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function isTheme(value: string): value is Theme {
  return THEMES.some((theme) => theme === value)
}

function readTheme(): Theme {
  const stored = readSetting(STORAGE_KEY)

  if (stored !== undefined && isTheme(stored)) {
    return stored
  }

  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

function apply(theme: Theme): void {
  document.documentElement.dataset['theme'] = theme
}

function createTheme(): {
  readonly current: Theme
  select: (next: Theme) => void
} {
  let current = $state<Theme>(readTheme())

  apply(current)

  return {
    get current() {
      return current
    },
    select(next: Theme) {
      current = next
      writeSetting(STORAGE_KEY, next)
      apply(next)
    },
  }
}

export const theme = createTheme()
