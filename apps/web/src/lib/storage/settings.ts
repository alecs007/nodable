export function readSetting(key: string): string | undefined {
  try {
    return localStorage.getItem(key) ?? undefined
  } catch {
    return undefined
  }
}

export function writeSetting(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    return
  }
}

export function removeSetting(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    return
  }
}
