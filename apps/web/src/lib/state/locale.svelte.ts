import {
  type Locale,
  type MessageKey,
  type MessageValues,
  detectLocale,
  isLocale,
  translate,
} from '../i18n/messages'
import { readSetting, writeSetting } from '../storage/settings'

const STORAGE_KEY = 'nodable.locale'

function readLocale(): Locale {
  const stored = readSetting(STORAGE_KEY)

  if (stored !== undefined && isLocale(stored)) {
    return stored
  }

  return detectLocale(navigator.languages)
}

function createLocaleState(): {
  readonly current: Locale
  select: (next: Locale) => void
  t: (key: MessageKey, values?: MessageValues) => string
} {
  let current = $state<Locale>(readLocale())

  return {
    get current() {
      return current
    },
    select(next: Locale) {
      current = next
      writeSetting(STORAGE_KEY, next)
      document.documentElement.lang = next
    },
    t(key: MessageKey, values?: MessageValues) {
      return translate(current, key, values)
    },
  }
}

export const locale = createLocaleState()
