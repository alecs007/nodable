import en from './en.json'
import ro from './ro.json'

export const LOCALES = ['en', 'ro'] as const

export type Locale = (typeof LOCALES)[number]

export type MessageKey = keyof typeof en

export type Messages = Record<MessageKey, string>

export type MessageValues = Readonly<Record<string, string>>

export const DEFAULT_LOCALE: Locale = 'en'

const CATALOGS: Record<Locale, Messages> = { en, ro }

export function isLocale(value: string): value is Locale {
  return LOCALES.some((locale) => locale === value)
}

export function detectLocale(preferred: readonly string[]): Locale {
  for (const candidate of preferred) {
    const language = candidate.slice(0, 2).toLowerCase()

    if (isLocale(language)) {
      return language
    }
  }

  return DEFAULT_LOCALE
}

export function translate(locale: Locale, key: MessageKey, values?: MessageValues): string {
  const template = CATALOGS[locale][key]

  if (values === undefined) {
    return template
  }

  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, value),
    template,
  )
}
