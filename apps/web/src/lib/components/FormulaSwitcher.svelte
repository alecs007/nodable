<script lang="ts">
  import {
    type Folder,
    type FolderColor,
    type FolderId,
    type Session,
    FOLDER_COLORS,
    normalizeFormula,
  } from '@nodable/sdk'
  import { type AnimationConfig } from 'svelte/animate'
  import { cubicOut } from 'svelte/easing'
  import { prefersReducedMotion } from 'svelte/motion'
  import { SvelteSet } from 'svelte/reactivity'
  import { slide } from 'svelte/transition'
  import type { MessageKey } from '../i18n/messages'
  import { locale } from '../state/locale.svelte'
  import { focusFormula } from '../state/overlay.svelte'
  import { workspace } from '../state/workspace.svelte'
  import Icon from './Icon.svelte'
  import Modal from './Modal.svelte'

  type Group = {
    readonly folder: Folder
    readonly sessions: readonly Session[]
  }

  type Drag = {
    readonly id: string
    readonly from: FolderId | undefined
    readonly dy: number
    readonly target: string | undefined
    readonly isReturning: boolean
  }

  type Pending = {
    readonly id: string
    readonly from: FolderId | undefined
    readonly x: number
    readonly y: number
    readonly isTouch: boolean
  }

  const ROOT = 'root'
  const DRAG_THRESHOLD = 4
  const SCROLL_THRESHOLD = 8
  const HOLD_FOR = 280
  const EDGE = 56
  const FLASH_FOR = 700
  const DROP_REACH = [0, -12, 12] as const
  const OVERLAP = 14
  const EDGE_AFTER = 16

  const COLOR_KEYS: Record<FolderColor, MessageKey> = {
    blue: 'folders.color.blue',
    green: 'folders.color.green',
    amber: 'folders.color.amber',
    red: 'folders.color.red',
    purple: 'folders.color.purple',
    teal: 'folders.color.teal',
  }

  let open = $state(false)
  let query = $state('')
  let actionsFor = $state<string | undefined>(undefined)
  let movingId = $state<string | undefined>(undefined)
  let confirmingId = $state<string | undefined>(undefined)
  let renamingId = $state<string | undefined>(undefined)
  let draft = $state('')
  let draftIn = $state<string | undefined>(undefined)
  let draftName = $state('')
  let isCreated = false
  let search: HTMLInputElement | undefined = $state()
  let drag = $state<Drag | undefined>(undefined)
  let droppedId = $state<string | undefined>(undefined)
  let flashId = $state<string | undefined>(undefined)
  let pending: Pending | undefined
  let pointer = { x: 0, y: 0 }
  let scroller: HTMLElement | undefined
  let startScroll = 0
  let scrollFrame = 0
  let holdTimer = 0
  let flashTimer = 0
  const expanded = new SvelteSet<FolderId>()

  const duration = $derived(prefersReducedMotion.current ? 0 : 200)
  const active = $derived(workspace.active)
  const needle = $derived(query.trim().toLowerCase())
  const formulaNeedle = $derived(normalizeFormula(query.trim()).toLowerCase())
  const isSearching = $derived(needle !== '')

  function nameOf(session: Session): string {
    return session.name === '' ? locale.t('workspace.nameplaceholder') : session.name
  }

  function formulaOfSession(session: Session): string {
    return session.input === '' ? locale.t('workspace.empty') : session.input
  }

  function matches(session: Session): boolean {
    return (
      session.name.toLowerCase().includes(needle) ||
      session.input.toLowerCase().includes(needle) ||
      (formulaNeedle !== '' && session.input.toLowerCase().includes(formulaNeedle))
    )
  }

  function folderIdOf(session: Session): FolderId | undefined {
    return Object.hasOwn(workspace.placements, session.id)
      ? workspace.placements[session.id]
      : undefined
  }

  const label = $derived(
    active.name !== ''
      ? active.name
      : active.input === ''
        ? locale.t('workspace.empty')
        : active.input,
  )

  const groups = $derived.by((): readonly Group[] =>
    workspace.folders.flatMap((folder) => {
      const members = workspace.sessions.filter((session) => folderIdOf(session) === folder.id)

      if (!isSearching || folder.name.toLowerCase().includes(needle)) {
        return [{ folder, sessions: members }]
      }

      const found = members.filter(matches)

      return found.length > 0 ? [{ folder, sessions: found }] : []
    }),
  )

  const loose = $derived(
    workspace.sessions.filter(
      (session) => folderIdOf(session) === undefined && (!isSearching || matches(session)),
    ),
  )

  const isEmpty = $derived(groups.length === 0 && loose.length === 0)

  $effect(() => {
    const field = search

    if (field === undefined || !window.matchMedia('(pointer: fine)').matches) {
      return
    }

    const frame = requestAnimationFrame(() => {
      field.focus({ preventScroll: true })
    })

    return () => {
      cancelAnimationFrame(frame)
    }
  })

  function reset(): void {
    expanded.clear()
    draftIn = undefined
    query = ''
    actionsFor = undefined
    movingId = undefined
    confirmingId = undefined
    renamingId = undefined
  }

  function closeMenuOutside(event: PointerEvent): void {
    if (actionsFor === undefined || !(event.target instanceof Element)) {
      return
    }

    const owner = event.target.closest<HTMLElement>('[data-menu]')?.dataset['menu']

    if (owner !== actionsFor) {
      actionsFor = undefined
      movingId = undefined
      confirmingId = undefined
    }
  }

  function toggleActions(id: string): void {
    actionsFor = actionsFor === id ? undefined : id
    movingId = undefined
    confirmingId = undefined
  }

  function toggleFolder(id: FolderId): void {
    if (expanded.has(id)) {
      expanded.delete(id)
    } else {
      expanded.add(id)
    }
  }

  function startRename(id: string, current: string): void {
    renamingId = id
    draft = current
    actionsFor = undefined
  }

  function commitRename(): void {
    const id = renamingId

    if (id === undefined) {
      return
    }

    const isFolder = workspace.folders.some((folder) => folder.id === id)
    const name = draft.trim()

    if (isFolder) {
      if (name !== '') {
        workspace.renameFolder(id, name)
      }
    } else {
      workspace.renameFormula(id, name)
    }

    renamingId = undefined
  }

  function createFolder(holding?: string): void {
    const color = FOLDER_COLORS[workspace.folders.length % FOLDER_COLORS.length]
    const id = workspace.addFolder(locale.t('folders.newfolder'), color)

    if (holding !== undefined) {
      workspace.moveFormula(holding, id)
      expanded.add(id)
    }

    query = ''
    movingId = undefined
    startRename(id, locale.t('folders.newfolder'))
  }

  function startDraft(where: string): void {
    draftIn = where
    draftName = ''
    actionsFor = undefined
    renamingId = undefined
    query = ''

    if (where !== ROOT) {
      expanded.add(where)
    }
  }

  function commitDraft(dismiss: () => void): void {
    const where = draftIn

    if (where === undefined) {
      return
    }

    workspace.addFormula(where === ROOT ? undefined : where)
    workspace.rename(draftName.trim())
    draftIn = undefined
    isCreated = true
    dismiss()
  }

  function onDraftKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      draftIn = undefined
    }
  }

  function confirmOr(id: string, run: () => void): void {
    if (confirmingId === id) {
      confirmingId = undefined
      actionsFor = undefined
      run()
    } else {
      confirmingId = id
    }
  }

  function focusAndSelect(node: HTMLInputElement): void {
    node.focus({ preventScroll: true })
    node.select()
  }

  function shift(
    _node: Element,
    { from, to }: { from: DOMRect; to: DOMRect },
    params: { duration: number },
  ): AnimationConfig {
    const dx = from.left + from.width / 2 - (to.left + to.width / 2)
    const dy = from.top - to.top

    if (dx === 0 && dy === 0) {
      return { duration: 0 }
    }

    return {
      duration: params.duration,
      easing: cubicOut,
      css: (_t, u) => `transform: translate(${String(u * dx)}px, ${String(u * dy)}px)`,
    }
  }

  function scrollParent(node: Element): HTMLElement | undefined {
    for (let current = node.parentElement; current !== null; current = current.parentElement) {
      const { overflowY } = getComputedStyle(current)

      if (overflowY === 'auto' || overflowY === 'scroll') {
        return current
      }
    }

    return undefined
  }

  function dropAt(x: number, y: number): string | undefined {
    for (const offset of DROP_REACH) {
      const hit = document.elementFromPoint(x, y + offset)?.closest<HTMLElement>('[data-drop]')

      if (hit !== null && hit !== undefined) {
        return hit.dataset['drop']
      }
    }

    return undefined
  }

  function targetFor(source: Pending, drop: string | undefined): string | undefined {
    if (drop === undefined) {
      return undefined
    }

    if (drop === ROOT) {
      return source.from === undefined ? undefined : ROOT
    }

    return drop === source.from ? undefined : drop
  }

  function targetNear(source: Pending): string | undefined {
    const under = targetFor(source, dropAt(pointer.x, pointer.y))

    if ((under !== undefined && under !== ROOT) || Math.abs(pointer.y - source.y) < EDGE_AFTER) {
      return under
    }

    const row = document.querySelector('.item.dragging')?.getBoundingClientRect()

    if (row === undefined) {
      return under
    }

    for (const y of [row.top + OVERLAP, row.bottom - OVERLAP]) {
      const near = targetFor(source, dropAt(pointer.x, y))

      if (near !== undefined && near !== ROOT) {
        return near
      }
    }

    return under
  }

  function follow(): void {
    const source = pending

    if (source === undefined) {
      return
    }

    const scrolled = (scroller?.scrollTop ?? 0) - startScroll

    drag = {
      id: source.id,
      from: source.from,
      dy: pointer.y - source.y + scrolled,
      target: targetNear(source),
      isReturning: false,
    }
  }

  function autoScroll(): void {
    if (pending === undefined) {
      return
    }

    if (scroller !== undefined) {
      const box = scroller.getBoundingClientRect()
      const above = box.top + EDGE - pointer.y
      const below = pointer.y - (box.bottom - EDGE)
      const step = above > 0 ? -Math.ceil(above / 5) : below > 0 ? Math.ceil(below / 5) : 0

      if (step !== 0) {
        scroller.scrollTop += step
        follow()
      }
    }

    scrollFrame = requestAnimationFrame(autoScroll)
  }

  function stopListening(): void {
    window.removeEventListener('pointermove', onDragMove)
    window.removeEventListener('pointerup', onDragEnd)
    window.removeEventListener('pointercancel', onDragCancel)
    window.removeEventListener('keydown', onDragKey, true)
    window.removeEventListener('touchmove', holdScroll)
    window.clearTimeout(holdTimer)
    cancelAnimationFrame(scrollFrame)
  }

  function holdScroll(event: TouchEvent): void {
    if (drag !== undefined && !drag.isReturning) {
      event.preventDefault()
    }
  }

  function activate(): void {
    actionsFor = undefined
    movingId = undefined
    confirmingId = undefined
    scrollFrame = requestAnimationFrame(autoScroll)
    follow()
  }

  function startDrag(event: PointerEvent, session: Session): void {
    if (!event.isPrimary || event.button !== 0 || renamingId !== undefined) {
      return
    }

    const isTouch = event.pointerType !== 'mouse'

    if (!isTouch) {
      event.preventDefault()
    }

    stopListening()
    drag = undefined
    pending = {
      id: session.id,
      from: folderIdOf(session),
      x: event.clientX,
      y: event.clientY,
      isTouch,
    }
    pointer = { x: event.clientX, y: event.clientY }
    scroller = scrollParent(event.currentTarget as Element)
    startScroll = scroller?.scrollTop ?? 0
    window.addEventListener('pointermove', onDragMove)
    window.addEventListener('pointerup', onDragEnd)
    window.addEventListener('pointercancel', onDragCancel)
    window.addEventListener('keydown', onDragKey, true)

    if (isTouch) {
      window.addEventListener('touchmove', holdScroll, { passive: false })
      holdTimer = window.setTimeout(() => {
        if (pending !== undefined && drag === undefined) {
          activate()
          if ('vibrate' in navigator) {
            navigator.vibrate(8)
          }
        }
      }, HOLD_FOR)
    }
  }

  function onDragMove(event: PointerEvent): void {
    const source = pending

    if (source === undefined) {
      return
    }

    pointer = { x: event.clientX, y: event.clientY }

    if (drag === undefined) {
      const distance = Math.hypot(pointer.x - source.x, pointer.y - source.y)

      if (source.isTouch) {
        if (distance > SCROLL_THRESHOLD) {
          stopListening()
          pending = undefined
        }

        return
      }

      if (distance < DRAG_THRESHOLD) {
        return
      }

      activate()

      return
    }

    follow()
  }

  function flash(id: string): void {
    window.clearTimeout(flashTimer)
    flashId = id
    flashTimer = window.setTimeout(() => {
      flashId = undefined
    }, FLASH_FOR)
  }

  function returnHome(current: Drag): void {
    drag = { ...current, dy: 0, target: undefined, isReturning: true }
    window.setTimeout(() => {
      if (drag?.id === current.id && drag.isReturning) {
        drag = undefined
      }
    }, duration + 40)
  }

  function onDragEnd(): void {
    const current = drag

    stopListening()
    pending = undefined

    if (current === undefined) {
      return
    }

    guardClick()

    if (current.target === undefined) {
      returnHome(current)

      return
    }

    const folderId = current.target === ROOT ? undefined : current.target

    droppedId = current.id
    drag = undefined
    workspace.moveFormula(current.id, folderId)

    if (folderId !== undefined) {
      expanded.add(folderId)
    }

    flash(current.target)
    requestAnimationFrame(() => {
      droppedId = undefined
    })
  }

  function onDragCancel(): void {
    stopListening()
    pending = undefined

    if (drag !== undefined) {
      returnHome(drag)
    }
  }

  function onDragKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onDragCancel()
    }
  }

  function destinationOf(
    target: string | undefined,
  ): { readonly name: string; readonly color: FolderColor | undefined } | undefined {
    if (target === undefined) {
      return undefined
    }

    if (target === ROOT) {
      return { name: locale.t('folders.nofolder'), color: undefined }
    }

    const folder = workspace.folders.find((candidate) => candidate.id === target)

    return folder === undefined ? undefined : { name: folder.name, color: folder.color }
  }

  function swallowClick(event: MouseEvent): void {
    event.preventDefault()
    event.stopPropagation()
  }

  function guardClick(): void {
    window.addEventListener('click', swallowClick, { capture: true, once: true })
    window.setTimeout(() => {
      window.removeEventListener('click', swallowClick, { capture: true })
    }, 0)
  }

  function translationOf(session: Session): string | undefined {
    return drag?.id === session.id ? `0 ${String(drag.dy)}px` : undefined
  }

  function outroOf(session: Session): number {
    return session.id === droppedId ? 0 : duration
  }

  $effect(() => stopListening)

  function onRenameKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      renamingId = undefined
    }
  }
</script>

<svelte:window onpointerdown={closeMenuOutside} />

<button
  type="button"
  class="trigger"
  aria-haspopup="dialog"
  aria-label="{locale.t('folders.title')}: {label}"
  title={locale.t('folders.title')}
  onclick={() => {
    open = true
  }}
>
  <span class="current">{label}</span>
  <span class="count">{workspace.sessions.length}</span>
  <span class="chevron" aria-hidden="true"><Icon name="chevron" /></span>
</button>

{#snippet draftRow(where: string, dismiss: () => void)}
  <div class="draft" transition:slide={{ duration }}>
    <form
      class="rename"
      onsubmit={(event) => {
        event.preventDefault()
        commitDraft(dismiss)
      }}
    >
      <input
        class="rename-field"
        type="text"
        autocomplete="off"
        enterkeyhint="done"
        aria-label={locale.t('workspace.name')}
        placeholder={locale.t('workspace.name')}
        bind:value={draftName}
        use:focusAndSelect
        onkeydown={onDraftKey}
        onblur={() => {
          if (draftIn === where) {
            draftIn = undefined
          }
        }}
      />
      <button
        type="submit"
        class="round accent"
        aria-label={locale.t('create.confirm')}
        onpointerdown={(event) => {
          event.preventDefault()
        }}
      >
        <Icon name="check" />
      </button>
    </form>
  </div>
{/snippet}

{#snippet renameForm(id: string, labelText: string)}
  <form
    class="rename"
    onsubmit={(event) => {
      event.preventDefault()
      commitRename()
    }}
  >
    <input
      class="rename-field"
      type="text"
      autocomplete="off"
      aria-label={labelText}
      bind:value={draft}
      use:focusAndSelect
      onkeydown={onRenameKey}
      onblur={() => {
        if (renamingId === id) {
          commitRename()
        }
      }}
    />
    <button
      type="submit"
      class="round accent"
      aria-label={locale.t('folders.save')}
      onpointerdown={(event) => {
        event.preventDefault()
      }}
    >
      <Icon name="check" />
    </button>
  </form>
{/snippet}

{#snippet row(session: Session, dismiss: () => void)}
  {@const isActive = session.id === active.id}
  {@const isOpen = actionsFor === session.id}
  <div class="line">
    {#if renamingId === session.id}
      {@render renameForm(session.id, locale.t('workspace.name'))}
    {:else}
      <button
        type="button"
        class="pick"
        aria-current={isActive ? 'true' : undefined}
        onpointerdown={(event) => {
          startDrag(event, session)
        }}
        oncontextmenu={(event) => {
          event.preventDefault()
        }}
        onclick={() => {
          workspace.select(session.id)
          dismiss()
        }}
      >
        <span class="mark" aria-hidden="true"></span>
        <span class="texts">
          <span class="name" class:unnamed={session.name === ''}>{nameOf(session)}</span>
          <code class="formula">{formulaOfSession(session)}</code>
        </span>
        {#if isActive}
          <span class="sr-only">({locale.t('folders.active')})</span>
        {/if}
      </button>
      {#if drag?.id === session.id && !drag.isReturning}
        {@const destination = destinationOf(drag.target)}
        <span
          class="destination"
          class:found={destination !== undefined}
          style:--folder={destination?.color === undefined
            ? undefined
            : `var(--folder-${destination.color})`}
          aria-hidden="true"
        >
          {#if destination !== undefined}
            <Icon name="folder" />{destination.name}
          {/if}
        </span>
      {:else}
        <button
          type="button"
          class="round"
          data-menu={session.id}
          class:on={isOpen}
          aria-expanded={isOpen}
          aria-label={locale.t('folders.actions', { name: nameOf(session) })}
          onclick={() => {
            toggleActions(session.id)
          }}
        >
          <Icon name="more" />
        </button>
      {/if}
    {/if}
  </div>
  {#if isOpen}
    <div class="actions" data-menu={session.id} transition:slide={{ duration }}>
      <div class="chips">
        <button
          type="button"
          class="chip"
          onclick={() => {
            startRename(session.id, session.name)
          }}
        >
          <Icon name="edit" />{locale.t('folders.rename')}
        </button>
        <button
          type="button"
          class="chip"
          onclick={() => {
            actionsFor = undefined
            workspace.duplicate(session.id)
          }}
        >
          <Icon name="copy" />{locale.t('folders.duplicate')}
        </button>
        <button
          type="button"
          class="chip"
          class:on={movingId === session.id}
          aria-expanded={movingId === session.id}
          onclick={() => {
            movingId = movingId === session.id ? undefined : session.id
            confirmingId = undefined
          }}
        >
          <Icon name="folder" />{locale.t('folders.move')}
        </button>
        <button
          type="button"
          class="chip danger"
          class:confirming={confirmingId === session.id}
          disabled={workspace.sessions.length < 2}
          onclick={() => {
            confirmOr(session.id, () => {
              workspace.remove(session.id)
            })
          }}
        >
          <Icon name="trash" />{locale.t(
            confirmingId === session.id ? 'folders.confirm' : 'folders.delete',
          )}
        </button>
      </div>
      {#if movingId === session.id}
        {@const current = folderIdOf(session)}
        <div class="chips targets" transition:slide={{ duration }}>
          <button
            type="button"
            class="chip target"
            class:here={current === undefined}
            disabled={current === undefined}
            onclick={() => {
              workspace.moveFormula(session.id, undefined)
              movingId = undefined
              actionsFor = undefined
            }}
          >
            {locale.t('folders.nofolder')}
          </button>
          {#each workspace.folders as folder (folder.id)}
            <button
              type="button"
              class="chip target"
              class:here={current === folder.id}
              disabled={current === folder.id}
              style:--folder="var(--folder-{folder.color})"
              onclick={() => {
                workspace.moveFormula(session.id, folder.id)
                expanded.add(folder.id)
                movingId = undefined
                actionsFor = undefined
              }}
            >
              <Icon name="folder" />{folder.name}
            </button>
          {/each}
          <button
            type="button"
            class="chip target fresh"
            onclick={() => {
              createFolder(session.id)
            }}
          >
            <Icon name="add" />{locale.t('folders.newfolder')}
          </button>
        </div>
      {/if}
    </div>
  {/if}
{/snippet}

{#if open}
  <Modal
    title={locale.t('folders.title')}
    isTall
    onclose={() => {
      open = false
      reset()

      if (isCreated) {
        isCreated = false
        focusFormula()
      }
    }}
  >
    {#snippet children(dismiss: () => void)}
      <div class="top">
        <label class="search">
          <Icon name="search" />
          <input
            bind:this={search}
            type="search"
            autocomplete="off"
            spellcheck="false"
            aria-label={locale.t('workspace.search')}
            placeholder={locale.t('folders.search')}
            bind:value={query}
            onkeydown={(event) => {
              if (event.key === 'Escape' && query !== '') {
                event.preventDefault()
                query = ''
              }
            }}
          />
        </label>
        <div class="creates">
          <button
            type="button"
            class="create"
            onclick={() => {
              startDraft(ROOT)
            }}
          >
            <Icon name="add" />{locale.t('workspace.add')}
          </button>
          <button
            type="button"
            class="create"
            onclick={() => {
              createFolder()
            }}
          >
            <Icon name="folder" />{locale.t('folders.newfolder')}
          </button>
        </div>
        {#if draftIn === ROOT}
          {@render draftRow(ROOT, dismiss)}
        {/if}
      </div>

      <div class="tree" class:dragging={drag !== undefined && !drag.isReturning}>
        {#each groups as group (group.folder.id)}
          {@const folder = group.folder}
          {@const isExpanded = isSearching || expanded.has(folder.id)}
          {@const isOpen = actionsFor === folder.id}
          <section
            class="folder"
            class:open={isOpen}
            class:over={drag?.target === folder.id}
            class:flash={flashId === folder.id}
            data-drop={folder.id}
            style:--folder="var(--folder-{folder.color})"
            animate:shift={{ duration }}
            transition:slide={{ duration }}
          >
            <div class="line head">
              {#if renamingId === folder.id}
                {@render renameForm(folder.id, locale.t('folders.rename'))}
              {:else}
                <button
                  type="button"
                  class="toggle"
                  aria-expanded={isExpanded}
                  onclick={() => {
                    toggleFolder(folder.id)
                  }}
                >
                  <span class="caret" class:down={isExpanded} aria-hidden="true">
                    <Icon name="chevron" />
                  </span>
                  <span class="folder-icon" aria-hidden="true"><Icon name="folder" /></span>
                  <span class="folder-name">{folder.name}</span>
                  <span class="badge">{group.sessions.length}</span>
                </button>
                <button
                  type="button"
                  class="round"
                  data-menu={folder.id}
                  class:on={isOpen}
                  aria-expanded={isOpen}
                  aria-label={locale.t('folders.actions', { name: folder.name })}
                  onclick={() => {
                    toggleActions(folder.id)
                  }}
                >
                  <Icon name="more" />
                </button>
              {/if}
            </div>
            {#if isOpen}
              <div class="actions" data-menu={folder.id} transition:slide={{ duration }}>
                <div class="chips">
                  <button
                    type="button"
                    class="chip"
                    onclick={() => {
                      startDraft(folder.id)
                    }}
                  >
                    <Icon name="add" />{locale.t('folders.addhere')}
                  </button>
                  <button
                    type="button"
                    class="chip"
                    onclick={() => {
                      startRename(folder.id, folder.name)
                    }}
                  >
                    <Icon name="edit" />{locale.t('folders.rename')}
                  </button>
                  <button
                    type="button"
                    class="chip danger"
                    class:confirming={confirmingId === folder.id}
                    onclick={() => {
                      confirmOr(folder.id, () => {
                        workspace.removeFolder(folder.id)
                      })
                    }}
                  >
                    <Icon name="trash" />{locale.t(
                      confirmingId === folder.id ? 'folders.confirm' : 'folders.deletefolder',
                    )}
                  </button>
                </div>
                <div class="swatches" role="radiogroup" aria-label={locale.t('folders.color')}>
                  {#each FOLDER_COLORS as color (color)}
                    <button
                      type="button"
                      class="swatch"
                      role="radio"
                      aria-checked={folder.color === color}
                      aria-label={locale.t(COLOR_KEYS[color])}
                      title={locale.t(COLOR_KEYS[color])}
                      style:--swatch="var(--folder-{color})"
                      onclick={() => {
                        workspace.recolorFolder(folder.id, color)
                      }}
                    >
                      {#if folder.color === color}
                        <Icon name="check" />
                      {/if}
                    </button>
                  {/each}
                </div>
              </div>
            {/if}
            {#if isExpanded && (group.sessions.length > 0 || draftIn === folder.id)}
              <div
                class="nested"
                in:slide={{ duration }}
                out:slide={{ duration: droppedId === undefined ? duration : 0 }}
              >
                {#if draftIn === folder.id}
                  {@render draftRow(folder.id, dismiss)}
                {/if}
                <ul class="items">
                  {#each group.sessions as session (session.id)}
                    <li
                      class="item"
                      class:active={session.id === active.id}
                      class:open={actionsFor === session.id}
                      class:dragging={drag?.id === session.id}
                      class:returning={drag?.id === session.id && drag.isReturning}
                      style:translate={translationOf(session)}
                      animate:shift={{ duration }}
                      in:slide={{ duration }}
                      out:slide={{ duration: outroOf(session) }}
                    >
                      {@render row(session, dismiss)}
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
          </section>
        {/each}

        <div
          class="loose"
          class:over={drag?.target === ROOT}
          class:flash={flashId === ROOT}
          data-drop={ROOT}
        >
          {#if drag?.from !== undefined && !drag.isReturning}
            <p class="dropzone" transition:slide={{ duration }}>{locale.t('folders.dropout')}</p>
          {/if}
          {#if loose.length > 0}
            <ul class="items">
              {#each loose as session (session.id)}
                <li
                  class="item"
                  class:active={session.id === active.id}
                  class:open={actionsFor === session.id}
                  class:dragging={drag?.id === session.id}
                  class:returning={drag?.id === session.id && drag.isReturning}
                  style:translate={translationOf(session)}
                  animate:shift={{ duration }}
                  in:slide={{ duration }}
                  out:slide={{ duration: outroOf(session) }}
                >
                  {@render row(session, dismiss)}
                </li>
              {/each}
            </ul>
          {/if}
        </div>

        {#if isEmpty}
          <p class="hollow" transition:slide={{ duration }}>{locale.t('folders.nomatch')}</p>
        {/if}
      </div>
    {/snippet}
  </Modal>
{/if}

<style>
  .trigger {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    inline-size: 100%;
    max-inline-size: 14rem;
    block-size: 2.25rem;
    padding-inline: var(--space-3) var(--space-2);
    border: 1px solid transparent;
    border-radius: var(--radius-pill);
    background: var(--color-surface-sunken);
    color: var(--color-text);
    font-family: var(--font-mono);
    font-size: 0.875rem;
    cursor: pointer;
    transition: border-color var(--duration-short) var(--ease);
  }

  @media (hover: hover) {
    .trigger:hover {
      border-color: var(--color-accent);
    }
  }

  .current {
    flex: 1 1 auto;
    overflow: hidden;
    text-align: start;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .count,
  .badge {
    flex: none;
    padding: 0.125rem var(--space-2);
    border-radius: var(--radius-pill);
    background: var(--color-accent-soft);
    color: var(--color-accent);
    font-family: var(--font-sans);
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.2;
  }

  .chevron {
    display: grid;
    flex: none;
    place-items: center;
    rotate: -90deg;
    color: var(--color-text-muted);
  }

  .top {
    display: grid;
    gap: var(--space-2);
  }

  .search {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    block-size: 2.75rem;
    padding-inline: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    background: var(--color-surface-sunken);
    color: var(--color-text-muted);
    transition: border-color var(--duration-short) var(--ease);
  }

  .search:focus-within {
    border-color: var(--color-accent);
  }

  .search input {
    flex: 1 1 auto;
    min-inline-size: 0;
    block-size: 100%;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: 1rem;
    line-height: normal;
    outline: none;
    appearance: none;
  }

  .search input::placeholder {
    color: var(--color-text-muted);
  }

  .creates {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-2);
  }

  .create {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    justify-content: center;
    min-inline-size: 0;
    block-size: 2.5rem;
    padding-inline: var(--space-3);
    border: 1px dashed var(--color-border-strong);
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: 0.875rem;
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
    transition:
      border-color var(--duration-short) var(--ease),
      color var(--duration-short) var(--ease),
      background var(--duration-short) var(--ease);
  }

  .create:hover {
    border-color: var(--color-accent);
    background: var(--color-accent-soft);
    color: var(--color-accent);
  }

  .tree {
    display: grid;
    gap: var(--space-2);
  }

  .folder {
    --folder: var(--folder-blue);

    border-radius: var(--radius-3);
    background: color-mix(in srgb, var(--folder) 8%, var(--color-surface-sunken));
    outline: 2px solid transparent;
    outline-offset: -2px;
    transform-origin: top center;
    transition:
      outline-color var(--duration-short) var(--ease),
      background var(--duration-short) var(--ease),
      box-shadow var(--duration-short) var(--ease),
      scale var(--duration-short) var(--ease);
  }

  .folder.over {
    background: color-mix(in srgb, var(--folder) 18%, var(--color-surface-sunken));
    box-shadow: 0 10px 28px color-mix(in srgb, var(--folder) 28%, transparent);
    outline-color: var(--folder);
    scale: 1.03;
  }

  .folder.flash,
  .loose.flash {
    animation: received 700ms var(--ease);
  }

  .loose {
    display: grid;
    gap: var(--space-2);
    border-radius: var(--radius-3);
    outline: 2px dashed transparent;
    outline-offset: 2px;
    transition: outline-color var(--duration-short) var(--ease);
  }

  .loose.over {
    outline-color: var(--color-accent);
  }

  .dropzone {
    margin: 0;
    padding: var(--space-3);
    border: 1.5px dashed var(--color-border-strong);
    border-radius: var(--radius-3);
    color: var(--color-text-muted);
    font-size: 0.875rem;
    text-align: center;
    transition:
      border-color var(--duration-short) var(--ease),
      color var(--duration-short) var(--ease);
  }

  .loose.over .dropzone {
    border-color: var(--color-accent);
    background: var(--color-accent-soft);
    color: var(--color-accent);
  }

  .tree.dragging {
    cursor: grabbing;
  }

  .item.dragging {
    position: relative;
    z-index: 5;
    background: var(--color-surface-raised);
    box-shadow: 0 14px 36px rgb(8 12 18 / 22%);
    pointer-events: none;
    scale: 1.02;
    transition: scale var(--duration-short) var(--ease);
  }

  .item.returning {
    scale: 1;
    box-shadow: none;
    transition:
      translate 200ms var(--ease),
      scale 200ms var(--ease),
      box-shadow 200ms var(--ease);
  }

  .destination {
    display: inline-flex;
    gap: var(--space-1);
    align-items: center;
    max-inline-size: 10rem;
    block-size: 2rem;
    padding-inline: var(--space-2) var(--space-3);
    overflow: hidden;
    border-radius: var(--radius-pill);
    color: var(--color-text-muted);
    font-size: 0.8125rem;
    font-weight: 600;
    white-space: nowrap;
    text-overflow: ellipsis;
    transition:
      background var(--duration-short) var(--ease),
      color var(--duration-short) var(--ease);
  }

  .destination.found {
    background: color-mix(in srgb, var(--folder, var(--color-accent)) 16%, transparent);
    color: var(--folder, var(--color-accent));
  }

  .tree {
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }

  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    padding-inline: var(--space-1);
  }

  .swatch {
    display: grid;
    place-items: center;
    inline-size: 1.75rem;
    block-size: 1.75rem;
    padding: 0;
    border: 2px solid var(--color-surface-raised);
    border-radius: 50%;
    background: var(--swatch);
    box-shadow: 0 0 0 1px var(--color-border);
    color: var(--color-surface-raised);
    cursor: pointer;
    transition:
      scale var(--duration-short) var(--ease),
      box-shadow var(--duration-short) var(--ease);
  }

  .swatch:hover {
    scale: 1.1;
  }

  .swatch[aria-checked='true'] {
    box-shadow: 0 0 0 2px var(--swatch);
  }

  @keyframes received {
    0% {
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--folder, var(--color-accent)) 45%, transparent);
    }

    100% {
      box-shadow: 0 0 0 10px transparent;
    }
  }

  .nested {
    padding: 0 var(--space-1) var(--space-1);
  }

  .items {
    display: grid;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .line {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-1);
    align-items: center;
    padding: var(--space-1);
  }

  .item {
    border-radius: var(--radius-2);
    transition: background var(--duration-short) var(--ease);
  }

  .item:hover,
  .item.open {
    background: var(--color-surface);
  }

  .folder .item:hover,
  .folder .item.open {
    background: var(--color-surface-raised);
  }

  .item.active {
    background: var(--color-accent-soft);
  }

  .pick,
  .toggle {
    display: flex;
    gap: var(--space-3);
    align-items: center;
    min-inline-size: 0;
    padding: var(--space-2);
    border: none;
    border-radius: var(--radius-1);
    background: transparent;
    color: var(--color-text);
    font-family: var(--font-sans);
    text-align: start;
    cursor: pointer;
  }

  .mark {
    flex: none;
    inline-size: 0.5rem;
    block-size: 0.5rem;
    border: 1.5px solid var(--color-border-strong);
    border-radius: 50%;
    transition:
      background var(--duration-short) var(--ease),
      border-color var(--duration-short) var(--ease);
  }

  .active .mark {
    border-color: var(--color-accent);
    background: var(--color-accent);
  }

  .pick {
    -webkit-touch-callout: none;
  }

  .texts {
    display: grid;
    gap: 2px;
    min-inline-size: 0;
  }

  .name,
  .formula,
  .folder-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .name {
    font-size: 0.9375rem;
    font-weight: 600;
  }

  .name.unnamed {
    color: var(--color-text-muted);
    font-weight: 500;
  }

  .formula {
    color: var(--color-text-muted);
    font-family: var(--font-mono);
    font-size: 0.8125rem;
  }

  .active .formula {
    color: var(--color-accent);
  }

  .toggle {
    gap: var(--space-2);
  }

  .caret {
    display: grid;
    flex: none;
    place-items: center;
    color: var(--color-text-muted);
    transition: rotate var(--duration-medium) var(--ease);
  }

  .caret.down {
    rotate: 90deg;
  }

  .folder-icon {
    display: grid;
    flex: none;
    place-items: center;
    color: var(--folder);
  }

  .folder-name {
    font-size: 0.9375rem;
    font-weight: 600;
  }

  .badge {
    margin-inline-end: auto;
    background: var(--color-surface-raised);
    color: var(--color-text-muted);
  }

  .round {
    display: grid;
    place-items: center;
    inline-size: 2.25rem;
    block-size: 2.25rem;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition:
      background var(--duration-short) var(--ease),
      color var(--duration-short) var(--ease);
  }

  .round:hover,
  .round.on {
    background: var(--color-surface-raised);
    color: var(--color-text);
  }

  .round.accent {
    background: var(--color-accent);
    color: var(--color-accent-contrast);
  }

  .actions {
    display: grid;
    gap: var(--space-2);
    padding: 0 var(--space-2) var(--space-2);
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
  }

  .chip {
    display: inline-flex;
    gap: var(--space-1);
    align-items: center;
    block-size: 2rem;
    padding-inline: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: 0.8125rem;
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
    transition:
      border-color var(--duration-short) var(--ease),
      background var(--duration-short) var(--ease),
      color var(--duration-short) var(--ease);
  }

  .chip:hover:not(:disabled),
  .chip.on {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .chip:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .chip.danger {
    color: var(--color-error);
  }

  .chip.danger:hover:not(:disabled) {
    border-color: var(--color-error);
    color: var(--color-error);
  }

  .chip.confirming {
    border-color: var(--color-error);
    background: var(--color-error);
    color: var(--color-surface-raised);
  }

  .chip.danger.confirming:hover {
    color: var(--color-surface-raised);
  }

  .chip.target {
    padding-inline: var(--space-3);
  }

  .chip.target :global(.icon) {
    color: var(--folder, currentcolor);
  }

  .chip.target.here {
    border-color: var(--color-accent);
    background: var(--color-accent-soft);
    color: var(--color-accent);
    opacity: 1;
  }

  .chip.fresh {
    border-style: dashed;
    border-color: var(--color-border-strong);
    background: transparent;
  }

  .targets {
    padding-block-start: var(--space-2);
    border-block-start: 1px dashed var(--color-border);
  }

  .draft {
    padding-block-start: var(--space-1);
  }

  .rename {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-2);
    align-items: center;
  }

  .rename-field {
    min-inline-size: 0;
    block-size: 2.5rem;
    padding: 0 var(--space-3);
    border: 1px solid var(--color-accent);
    border-radius: var(--radius-pill);
    background: var(--color-surface-raised);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: 1rem;
    line-height: normal;
    outline: none;
    appearance: none;
  }

  .hollow {
    margin: 0;
    padding: var(--space-3);
    color: var(--color-text-muted);
    font-size: 0.875rem;
    text-align: center;
  }

  @media (width <= 48rem) {
    .trigger {
      max-inline-size: none;
    }
  }
</style>
