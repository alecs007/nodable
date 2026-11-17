<script lang="ts">
  import { type Snippet } from 'svelte'
  import { prefersReducedMotion } from 'svelte/motion'
  import { MediaQuery } from 'svelte/reactivity'
  import { locale } from '../state/locale.svelte'
  import Icon from './Icon.svelte'

  type Props = {
    title: string
    tone?: string | undefined
    isTall?: boolean
    isCentered?: boolean
    isWide?: boolean
    onclose: () => void
    children: Snippet<[() => void]>
  }

  const {
    title,
    tone,
    isTall = false,
    isCentered = false,
    isWide = false,
    onclose,
    children,
  }: Props = $props()

  const DURATION = 360
  const CLOSE_SHARE = 0.25
  const CLOSE_SPEED = 0.5

  const id = $props.id()
  const isSheet = new MediaQuery('(width <= 40rem)')

  let dialog: HTMLDialogElement | undefined = $state()
  let sheet: HTMLElement | undefined = $state()
  let isShown = $state(false)
  let isDragging = $state(false)
  let offset = $state(0)
  let keyboard = $state(0)
  let isClosing = false
  let returnsFocus = false
  let startY = 0
  let lastY = 0
  let lastTime = 0
  let speed = 0

  const duration = $derived(prefersReducedMotion.current ? 0 : DURATION)

  const fade = $derived.by(() => {
    if (!isShown) {
      return 0
    }

    const height = sheet?.offsetHeight ?? 0

    return height > 0 ? Math.max(0, 1 - offset / height) : 1
  })

  $effect(() => {
    const element = dialog

    if (element === undefined) {
      return
    }

    const opener = document.activeElement

    returnsFocus = opener instanceof HTMLElement && opener.matches(':focus-visible')

    if (opener instanceof HTMLInputElement || opener instanceof HTMLTextAreaElement) {
      returnsFocus = false
      opener.blur()
    }

    element.showModal()
    sheet?.focus({ preventScroll: true })

    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        isShown = true
      })
    })

    return () => {
      cancelAnimationFrame(frame)
    }
  })

  $effect(() => {
    const visible = window.visualViewport

    if (visible === null) {
      return
    }

    const area = visible

    function measure(): void {
      keyboard = Math.max(0, Math.round(window.innerHeight - area.height - area.offsetTop))
    }

    measure()
    area.addEventListener('resize', measure)
    area.addEventListener('scroll', measure)

    return () => {
      area.removeEventListener('resize', measure)
      area.removeEventListener('scroll', measure)
    }
  })

  function settleFocus(): void {
    if (!returnsFocus && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  function dismiss(): void {
    if (isClosing) {
      return
    }

    isClosing = true
    isDragging = false
    isShown = false

    window.setTimeout(() => {
      dialog?.close()
      settleFocus()
      onclose()
    }, duration)
  }

  function onPointerDown(event: PointerEvent): void {
    const target = event.target as Element

    if (
      isCentered ||
      !isSheet.current ||
      !event.isPrimary ||
      event.button !== 0 ||
      target.closest('button')
    ) {
      return
    }

    isDragging = true
    startY = event.clientY
    lastY = event.clientY
    lastTime = event.timeStamp
    speed = 0
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: PointerEvent): void {
    if (!isDragging) {
      return
    }

    const elapsed = event.timeStamp - lastTime

    if (elapsed > 0) {
      speed = (event.clientY - lastY) / elapsed
    }

    offset = Math.max(0, event.clientY - startY)
    lastY = event.clientY
    lastTime = event.timeStamp
  }

  function onPointerUp(): void {
    if (!isDragging) {
      return
    }

    isDragging = false

    const height = sheet?.offsetHeight ?? 0

    if (offset > height * CLOSE_SHARE || speed > CLOSE_SPEED) {
      dismiss()
    } else {
      offset = 0
    }
  }

  function onPointerCancel(): void {
    isDragging = false
    offset = 0
  }
</script>

<dialog
  bind:this={dialog}
  class="modal"
  class:centered={isCentered}
  class:dragging={isDragging}
  aria-labelledby="{id}-title"
  style:--motion="{duration}ms"
  style:--offset="{offset}px"
  style:--fade={fade}
  style:--keyboard="{keyboard}px"
  oncancel={(event: Event) => {
    event.preventDefault()
    dismiss()
  }}
  onclose={() => {
    if (!isClosing) {
      isClosing = true
      onclose()
    }
  }}
>
  <div class="backdrop" aria-hidden="true" onclick={dismiss}></div>
  <div
    bind:this={sheet}
    class="sheet"
    class:shown={isShown}
    class:tall={isTall}
    class:wide={isWide}
    tabindex="-1"
  >
    <div
      class="head"
      role="presentation"
      onpointerdown={onPointerDown}
      onpointermove={onPointerMove}
      onpointerup={onPointerUp}
      onpointercancel={onPointerCancel}
    >
      <span class="grabber" aria-hidden="true"></span>
      <h2 id="{id}-title" class="title {tone ?? ''}">{title}</h2>
      <button
        type="button"
        class="close"
        aria-label={locale.t('interpret.close')}
        onclick={dismiss}
      >
        <Icon name="clear" />
      </button>
    </div>
    <div class="body">
      {@render children(dismiss)}
    </div>
  </div>
</dialog>

<style>
  .modal {
    position: fixed;
    inset: 0;
    display: grid;
    grid-template: minmax(0, 1fr) / minmax(0, 1fr);
    place-items: center;
    inline-size: 100%;
    max-inline-size: none;
    block-size: 100%;
    max-block-size: none;
    margin: 0;
    padding: var(--space-4);
    overflow: clip;
    border: none;
    background: transparent;
    color: var(--color-text);
    font-family: var(--font-sans);
  }

  .modal::backdrop {
    background: transparent;
  }

  .backdrop {
    position: absolute;
    inset: 0;
    background: rgb(8 12 18 / 45%);
    opacity: var(--fade);
    transition: opacity var(--motion) cubic-bezier(0.32, 0.72, 0, 1);
  }

  .sheet {
    position: relative;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    inline-size: min(36rem, 100%);
    max-block-size: min(44rem, 100%);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-4);
    background: var(--color-surface-raised);
    box-shadow: 0 24px 64px rgb(8 12 18 / 28%);
    opacity: 0;
    transform: translateY(0.5rem) scale(0.98);
    transition:
      opacity var(--motion) var(--sheet-ease),
      transform var(--motion) var(--sheet-ease);
    --sheet-ease: cubic-bezier(0.32, 0.72, 0, 1);
  }

  .sheet:focus {
    outline: none;
  }

  .sheet.shown {
    opacity: 1;
    transform: none;
  }

  .sheet.tall {
    block-size: min(40rem, 100%);
  }

  .sheet.wide {
    inline-size: min(60rem, 100%);
  }

  .head {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-2);
    align-items: center;
    padding: var(--space-3) var(--space-3) var(--space-2) var(--space-4);
  }

  .grabber {
    position: absolute;
    inset-block-start: var(--space-2);
    inset-inline-start: 50%;
    display: none;
    inline-size: 2.5rem;
    block-size: 4px;
    border-radius: var(--radius-pill);
    background: var(--color-border-strong);
    opacity: 0.6;
    translate: -50% 0;
  }

  .title {
    margin: 0;
    color: var(--color-text);
    font-size: 1.0625rem;
    font-weight: 600;
  }

  .title.valid {
    color: var(--color-true);
  }

  .title.unsatisfiable {
    color: var(--color-false);
  }

  .close {
    display: grid;
    place-items: center;
    inline-size: 2.25rem;
    block-size: 2.25rem;
    border: none;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition:
      background var(--duration-short) var(--ease),
      color var(--duration-short) var(--ease);
  }

  .close:hover {
    background: var(--color-surface-sunken);
    color: var(--color-text);
  }

  .body {
    display: grid;
    gap: var(--space-3);
    align-content: start;
    min-block-size: 0;
    padding: 0 var(--space-4) var(--space-4);
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  @media (width <= 40rem) {
    .modal:not(.centered) {
      place-items: end stretch;
      padding: 0;
      padding-block: var(--space-6) var(--keyboard, 0px);
      transition: padding var(--duration-medium) var(--ease);
    }

    .modal.centered {
      padding-block-end: calc(var(--space-4) + var(--keyboard, 0px));
      transition: padding var(--duration-medium) var(--ease);
    }

    .modal:not(.centered) .sheet {
      inline-size: 100%;
      min-block-size: min(50dvh, 100%);
      max-block-size: min(80dvh, 100%);
      border-block-end: none;
      border-radius: var(--radius-4) var(--radius-4) 0 0;
      opacity: 1;
      transform: translateY(100%);
    }

    .modal:not(.centered) .sheet.tall {
      block-size: min(80dvh, 100%);
    }

    .modal:not(.centered) .sheet.shown {
      transform: translateY(var(--offset));
    }

    .dragging .sheet,
    .dragging .backdrop {
      transition: none;
    }

    .modal:not(.centered) .head {
      grid-template-columns: minmax(0, 1fr);
      padding-block-start: var(--space-5);
      cursor: grab;
      touch-action: none;
      user-select: none;
    }

    .dragging .head {
      cursor: grabbing;
    }

    .modal:not(.centered) .grabber {
      display: block;
    }

    .modal:not(.centered) .close {
      display: none;
    }

    .modal:not(.centered) .body {
      padding-block-end: calc(var(--space-4) + env(safe-area-inset-bottom));
    }
  }
</style>
