<script lang="ts">
  import './app.css'
  import {
    type Interpretation,
    type TruthValue,
    classifySession,
    evaluateSession,
    getVariables,
    pendingVariants,
  } from '@nodable/sdk'
  import BrandMark from './lib/components/BrandMark.svelte'
  import HintBar from './lib/components/HintBar.svelte'
  import Icon from './lib/components/Icon.svelte'
  import InputBar from './lib/components/InputBar.svelte'
  import InterpretationPanel from './lib/components/InterpretationPanel.svelte'
  import NameField from './lib/components/NameField.svelte'
  import NewFormulaDialog from './lib/components/NewFormulaDialog.svelte'
  import StepSlider from './lib/components/StepSlider.svelte'
  import ToolBar from './lib/components/ToolBar.svelte'
  import TreeCanvas from './lib/components/TreeCanvas.svelte'
  import Viewport from './lib/components/Viewport.svelte'
  import VariantBoard from './lib/components/VariantBoard.svelte'
  import { prefersReducedMotion } from 'svelte/motion'
  import { fade } from 'svelte/transition'
  import { LOCALES, translate } from './lib/i18n/messages'
  import { locale } from './lib/state/locale.svelte'
  import { overlay } from './lib/state/overlay.svelte'
  import { persistence } from './lib/state/persistence.svelte'
  import { workspace } from './lib/state/workspace.svelte'

  let composer: HTMLElement | undefined = $state()
  let dock: HTMLElement | undefined = $state()
  let topInset = $state(0)
  let bottomInset = $state(0)

  const session = $derived(workspace.active)
  const variants = $derived(pendingVariants(workspace.snapshot))
  const classification = $derived(
    session.analysis.isComplete ? classifySession(session) : undefined,
  )
  const sceneFade = $derived(prefersReducedMotion.current ? 0 : 220)
  const evaluation = $derived(workspace.isInterpreting ? evaluateSession(session) : undefined)
  const hasError = $derived(
    session.analysis.diagnostics.some((diagnostic) => diagnostic.severity === 'error'),
  )
  $effect(() => {
    const top = composer
    const bottom = dock

    if (top === undefined || bottom === undefined) {
      return
    }

    const observer = new ResizeObserver(() => {
      topInset = top.offsetHeight + 24
      bottomInset = bottom.offsetHeight + 24
    })

    observer.observe(top)
    observer.observe(bottom)

    return () => {
      observer.disconnect()
    }
  })

  $effect(() => {
    void persistence.start(workspace.restore)
  })

  $effect(() => {
    const saved = workspace.asWorkspace()

    if (persistence.isReady) {
      persistence.schedule(saved)
    }
  })

  $effect(() => {
    document.documentElement.lang = locale.current
  })
</script>

{#snippet interpretAction()}
  <button
    type="button"
    class="interpret"
    aria-label={locale.t('interpret.open')}
    onclick={() => {
      workspace.interpret()
    }}
  >
    {#each LOCALES as code (code)}
      <span class="face" class:ghost={code !== locale.current} aria-hidden="true">
        <span class="interpret-icon"><Icon name="interpret" /></span>
        <span class="interpret-label">{translate(code, 'interpret.open')}</span>
      </span>
    {/each}
  </button>
{/snippet}

<div
  class="stage"
  class:ready={persistence.isReady}
  style:--dock-space="{bottomInset}px"
  style:--composer-space="{topInset}px"
>
  <main class="workspace">
    {#key workspace.activeId}
      <div class="scene" out:fade={{ duration: sceneFade }}>
        <Viewport
          resetKey="{workspace.activeId}:{String(variants.length)}:{String(
            workspace.isInterpreting,
          )}"
          safeTop={topInset}
          safeBottom={bottomInset}
        >
          {#if variants.length > 1}
            <VariantBoard {variants} />
          {:else}
            <TreeCanvas
              snapshot={variants[0]?.snapshot ?? workspace.snapshot}
              unlabelled={variants[0]?.pending ?? []}
              {evaluation}
            />
          {/if}
        </Viewport>
      </div>
    {/key}
  </main>

  <header bind:this={composer} class="composer island" aria-label={locale.t('input.label')}>
    <div class="caption">
      <BrandMark />
      <NameField
        value={session.name}
        onchange={(value: string) => {
          workspace.rename(value)
        }}
      />
    </div>
    {#if workspace.isInterpreting && evaluation !== undefined}
      <InterpretationPanel
        root={session.analysis.tree}
        variables={getVariables(session)}
        interpretation={session.interpretation}
        {evaluation}
        {classification}
        onassign={(name: string, value: TruthValue) => {
          workspace.assign(name, value)
        }}
        onreset={() => {
          workspace.clearValues()
        }}
        onuse={(values: Interpretation) => {
          workspace.useValues(values)
        }}
        onedit={() => {
          workspace.edit()
        }}
      />
    {:else}
      <HintBar
        diagnostics={session.analysis.diagnostics}
        allowedNext={session.analysis.allowedNext}
        isComplete={session.analysis.isComplete}
        isEmpty={session.input.length === 0}
        {classification}
      />
      <InputBar
        value={session.input}
        {hasError}
        allowedNext={session.analysis.allowedNext}
        onchange={(value: string) => {
          workspace.setInput(value)
        }}
        onsubmit={() => {
          overlay.startCreating()
        }}
        action={session.analysis.isComplete ? interpretAction : undefined}
      />
    {/if}
  </header>

  <nav bind:this={dock} class="dock island" aria-label={locale.t('view.label')}>
    {#if workspace.lastStepIndex > 0 && !workspace.isInterpreting}
      <StepSlider
        steps={session.analysis.steps}
        index={workspace.stepIndex}
        onselect={(index: number) => {
          workspace.showStep(index)
        }}
      />
    {/if}
    <ToolBar />
  </nav>
</div>

<NewFormulaDialog />

<style>
  .stage {
    position: fixed;
    inset: 0;
    opacity: 0;
    transition: opacity var(--duration-medium) var(--ease);
  }

  .stage.ready {
    opacity: 1;
  }

  .workspace {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .scene {
    position: absolute;
    inset: 0;
  }

  .island {
    position: absolute;
    z-index: 1;
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-4);
    background: var(--color-glass);
    backdrop-filter: var(--glass-blur);
  }

  .composer {
    inset-block-start: var(--space-4);
    inset-inline-start: 50%;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-1);
    inline-size: min(calc(100% - var(--space-5)), 42rem);
    padding: var(--space-3);
    transform: translateX(-50%);
  }

  .caption {
    display: flex;
    gap: var(--space-3);
    align-items: center;
    justify-content: space-between;
    padding-inline: var(--space-2);
  }

  .interpret {
    display: grid;
    flex: 0 0 auto;
    gap: var(--space-2);
    place-items: center;
    block-size: 2.25rem;
    padding-inline: var(--space-4);
    border: none;
    border-radius: var(--radius-pill);
    background: var(--color-accent);
    color: var(--color-accent-contrast);
    font-family: var(--font-sans);
    font-size: 0.875rem;
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
    animation: arrive var(--duration-medium) var(--ease);
    transition: opacity var(--duration-short) var(--ease);
  }

  .face {
    display: flex;
    grid-area: 1 / 1;
    gap: inherit;
    align-items: center;
    min-inline-size: 0;
  }

  .face.ghost {
    visibility: hidden;
  }

  .interpret-icon {
    display: grid;
    flex: none;
    place-items: center;
  }

  .interpret-label {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .interpret:hover {
    opacity: 0.88;
  }

  @media (width <= 32rem) {
    .interpret {
      gap: var(--space-1);
      inline-size: 100%;
      min-inline-size: 0;
      block-size: 2.125rem;
      overflow: hidden;
      padding-inline: var(--space-2);
      font-size: 0.8125rem;
    }
  }

  @media (width <= 21rem) {
    .interpret {
      inline-size: 2.125rem;
      padding: 0;
      justify-content: center;
    }

    .interpret-label {
      display: none;
    }
  }

  @keyframes arrive {
    from {
      opacity: 0;
      transform: translateX(6px);
    }
  }

  .dock {
    inset-block-end: var(--space-4);
    inset-inline-start: 50%;
    display: flex;
    flex-wrap: nowrap;
    gap: var(--space-3);
    align-items: center;
    justify-content: center;
    max-inline-size: calc(100% - var(--space-5));
    padding: var(--space-2) var(--space-3);
    transform: translateX(-50%);
  }

  .dock :global(.row) {
    flex: 0 0 auto;
    flex-wrap: nowrap;
  }

  .dock :global(.replay) {
    flex: 0 1 12rem;
  }

  @media (width <= 48rem) {
    .composer {
      inset-block-start: var(--space-2);
      inline-size: calc(100% - var(--space-4));
      border-radius: var(--radius-3);
    }

    .dock {
      inset-block-end: var(--space-2);
      flex-wrap: wrap;
      gap: var(--space-2);
      inline-size: calc(100% - var(--space-4));
      max-inline-size: none;
      padding: var(--space-2);
      border-radius: var(--radius-3);
    }

    .dock :global(.row) {
      flex: 1 1 100%;
      flex-wrap: wrap;
    }

    .dock :global(.row.secondary) {
      flex-wrap: nowrap;
    }

    .dock :global(.replay) {
      flex: 0 0 100%;
    }

    .dock :global(.replay input) {
      max-inline-size: none;
    }
  }
</style>
