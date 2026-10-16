<script lang="ts">
  import { type Snippet, untrack } from 'svelte'
  import { SvelteMap } from 'svelte/reactivity'
  import { locale } from '../state/locale.svelte'

  type Props = {
    resetKey: string
    safeTop?: number
    safeBottom?: number
    children: Snippet
  }

  const { resetKey, safeTop = 0, safeBottom = 0, children }: Props = $props()

  const MIN_SCALE = 0.02
  const MAX_SCALE = 3
  const MARGIN = 24

  type Size = { readonly width: number; readonly height: number }

  let frame: HTMLDivElement | undefined = $state()
  let surface: HTMLDivElement | undefined = $state()

  let scale = $state(1)
  let offsetX = $state(0)
  let offsetY = $state(0)
  let isFollowing = $state(true)
  let isGesturing = $state(false)
  let isReady = $state(false)

  const pointers = new SvelteMap<number, { x: number; y: number }>()
  let pinchDistance = 0

  function sizes(): { readonly view: Size; readonly content: Size } | undefined {
    if (frame === undefined || surface === undefined) {
      return undefined
    }

    const view = { width: frame.clientWidth, height: frame.clientHeight }
    const content = { width: surface.offsetWidth, height: surface.offsetHeight }

    return content.width === 0 || content.height === 0 ? undefined : { view, content }
  }

  function clampOffset(next: number, view: number, content: number): number {
    const room = view - content

    return Math.min(Math.max(0, room), Math.max(Math.min(0, room), next))
  }

  function applyBounds(): void {
    const measured = sizes()

    if (measured === undefined) {
      return
    }

    const width = measured.content.width * scale
    const height = measured.content.height * scale

    offsetX = clampOffset(offsetX, measured.view.width, width)
    offsetY = clampOffset(offsetY, measured.view.height, height)
  }

  function fit(): void {
    const measured = sizes()

    if (measured === undefined) {
      return
    }

    const band = Math.max(1, measured.view.height - safeTop - safeBottom - MARGIN * 2)
    const room = { width: Math.max(1, measured.view.width - MARGIN * 2), height: band }

    const next = Math.min(
      1,
      Math.max(
        MIN_SCALE,
        Math.min(room.width / measured.content.width, room.height / measured.content.height),
      ),
    )

    scale = next
    offsetX = (measured.view.width - measured.content.width * next) / 2
    offsetY = safeTop + (band + MARGIN * 2 - measured.content.height * next) / 2
  }

  function fitScale(): number {
    const measured = sizes()

    if (measured === undefined) {
      return MIN_SCALE
    }

    return Math.max(
      MIN_SCALE,
      Math.min(
        1,
        (measured.view.width - MARGIN * 2) / measured.content.width,
        Math.max(1, measured.view.height - safeTop - safeBottom - MARGIN * 2) /
          measured.content.height,
      ),
    )
  }

  function zoomAt(factor: number, pointX: number, pointY: number): void {
    const next = Math.min(MAX_SCALE, Math.max(fitScale(), scale * factor))

    if (next === scale) {
      return
    }

    const ratio = next / scale

    isFollowing = false
    offsetX = pointX - (pointX - offsetX) * ratio
    offsetY = pointY - (pointY - offsetY) * ratio
    scale = next
    applyBounds()
  }

  function localPoint(event: { clientX: number; clientY: number }): { x: number; y: number } {
    const box = frame?.getBoundingClientRect()

    return { x: event.clientX - (box?.left ?? 0), y: event.clientY - (box?.top ?? 0) }
  }

  function onWheel(event: WheelEvent): void {
    event.preventDefault()

    const point = localPoint(event)

    zoomAt(event.deltaY < 0 ? 1.12 : 1 / 1.12, point.x, point.y)
  }

  function onPointerDown(event: PointerEvent & { currentTarget: HTMLDivElement }): void {
    event.preventDefault()
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    event.currentTarget.setPointerCapture(event.pointerId)
    isGesturing = true
  }

  function pinchState(): { readonly distance: number; readonly x: number; readonly y: number } {
    const [first, second] = [...pointers.values()]

    if (first === undefined || second === undefined) {
      return { distance: 0, x: 0, y: 0 }
    }

    return {
      distance: Math.hypot(first.x - second.x, first.y - second.y),
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2,
    }
  }

  function onPointerMove(event: PointerEvent): void {
    const previous = pointers.get(event.pointerId)

    if (previous === undefined) {
      return
    }

    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointers.size >= 2) {
      const pinch = pinchState()

      if (pinchDistance > 0 && pinch.distance > 0) {
        const point = localPoint({ clientX: pinch.x, clientY: pinch.y })
        zoomAt(pinch.distance / pinchDistance, point.x, point.y)
      }

      pinchDistance = pinch.distance

      return
    }

    isFollowing = false
    offsetX += event.clientX - previous.x
    offsetY += event.clientY - previous.y
    applyBounds()
  }

  function onPointerUp(event: PointerEvent): void {
    pointers.delete(event.pointerId)
    pinchDistance = 0
    isGesturing = pointers.size > 0
  }

  $effect(() => {
    if (frame === undefined || surface === undefined) {
      return
    }

    const observer = new ResizeObserver(() => {
      if (isFollowing) {
        fit()
      } else {
        applyBounds()
      }

      isReady = true
    })

    observer.observe(frame)
    observer.observe(surface)

    return () => {
      observer.disconnect()
    }
  })

  $effect(() => {
    const bounds = [safeTop, safeBottom]

    untrack(() => {
      if (bounds.length > 0 && isFollowing) {
        fit()
      }
    })
  })

  $effect(() => {
    const key = resetKey

    untrack(() => {
      if (key !== '') {
        isFollowing = true
        fit()
      }
    })
  })
</script>

<div
  bind:this={frame}
  class="frame"
  class:ready={isReady}
  class:gesturing={isGesturing}
  role="application"
  aria-label={locale.t('view.label')}
  onwheel={onWheel}
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerUp}
  ondblclick={() => {
    isFollowing = true
    fit()
  }}
>
  <div
    bind:this={surface}
    class="surface"
    style:transform="translate({offsetX}px, {offsetY}px) scale({scale})"
  >
    {@render children()}
  </div>
</div>

<style>
  .frame {
    position: relative;
    inline-size: 100%;
    block-size: 100%;
    overflow: hidden;
    cursor: grab;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .frame.gesturing {
    cursor: grabbing;
  }

  .surface {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    inline-size: max-content;
    opacity: 0;
    transform-origin: top left;
  }

  .ready .surface {
    opacity: 1;
    transition:
      opacity var(--duration-medium) var(--ease),
      transform var(--duration-medium) var(--ease);
  }

  .gesturing .surface {
    transition: none;
  }
</style>
