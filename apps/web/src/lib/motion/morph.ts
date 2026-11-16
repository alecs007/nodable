export type Size = {
  readonly width: number
  readonly height: number
}

const EASING = 'cubic-bezier(0.22, 0.61, 0.36, 1)'

export function sizeOf(node: HTMLElement | undefined): Size | undefined {
  return node === undefined ? undefined : { width: node.offsetWidth, height: node.offsetHeight }
}

export function morph(
  node: HTMLElement,
  from: Size,
  duration: number,
  isContentFaded: boolean,
  onsettle: () => void,
): void {
  const to = { width: node.offsetWidth, height: node.offsetHeight }

  if (isContentFaded) {
    for (const child of node.children) {
      child.animate([{ opacity: 0 }, { opacity: 1 }], { duration, easing: EASING })
    }
  }

  if (Math.abs(to.width - from.width) < 1 && Math.abs(to.height - from.height) < 1) {
    onsettle()

    return
  }

  node.style.overflow = 'clip'

  const animation = node.animate(
    [
      { width: `${String(from.width)}px`, height: `${String(from.height)}px` },
      { width: `${String(to.width)}px`, height: `${String(to.height)}px` },
    ],
    { duration, easing: EASING },
  )

  function settle(): void {
    node.style.overflow = ''
    onsettle()
  }

  animation.addEventListener('finish', settle)
  animation.addEventListener('cancel', settle)
}
