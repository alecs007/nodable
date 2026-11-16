export type OverlayState = {
  readonly isCreating: boolean
  startCreating: () => void
  stopCreating: () => void
}

function createOverlayState(): OverlayState {
  let isCreating = $state(false)

  return {
    get isCreating() {
      return isCreating
    },
    startCreating() {
      isCreating = true
    },
    stopCreating() {
      isCreating = false
    },
  }
}

export const overlay = createOverlayState()

export function focusFormula(): void {
  document.getElementById('formula')?.focus({ preventScroll: true })
}
