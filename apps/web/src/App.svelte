<script lang="ts">
  import './app.css'
  import { pendingVariants } from '@nodable/sdk'
  import BrandMark from './lib/components/BrandMark.svelte'
  import HintBar from './lib/components/HintBar.svelte'
  import InputBar from './lib/components/InputBar.svelte'
  import NameField from './lib/components/NameField.svelte'
  import StepSlider from './lib/components/StepSlider.svelte'
  import ToolBar from './lib/components/ToolBar.svelte'
  import TreeCanvas from './lib/components/TreeCanvas.svelte'
  import Viewport from './lib/components/Viewport.svelte'
  import VariantBoard from './lib/components/VariantBoard.svelte'
  import { locale } from './lib/state/locale.svelte'
  import { persistence } from './lib/state/persistence.svelte'
  import { workspace } from './lib/state/workspace.svelte'

  let composer: HTMLElement | undefined = $state()
  let dock: HTMLElement | undefined = $state()
  let topInset = $state(0)
  let bottomInset = $state(0)

  const session = $derived(workspace.active)
  const variants = $derived(pendingVariants(workspace.snapshot))
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

<div class="stage" class:ready={persistence.isReady}>
  <main class="workspace" style:inset="{topInset}px 0 {bottomInset}px">
    <Viewport resetKey="{workspace.activeId}:{String(variants.length)}">
      {#if variants.length > 1}
        <VariantBoard {variants} />
      {:else}
        <TreeCanvas
          snapshot={variants[0]?.snapshot ?? workspace.snapshot}
          hideLabelFor={variants[0]?.workingId}
        />
      {/if}
    </Viewport>
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
    <HintBar
      diagnostics={session.analysis.diagnostics}
      allowedNext={session.analysis.allowedNext}
      isComplete={session.analysis.isComplete}
      isEmpty={session.input.length === 0}
    />
    <InputBar
      value={session.input}
      {hasError}
      allowedNext={session.analysis.allowedNext}
      onchange={(value: string) => {
        workspace.setInput(value)
      }}
      onsubmit={() => {
        workspace.addFormula()
      }}
    />
  </header>

  <nav bind:this={dock} class="dock island" aria-label={locale.t('view.label')}>
    {#if workspace.lastStepIndex > 0}
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
    inset: 10rem 0 7rem;
    overflow: hidden;
  }

  .island {
    position: absolute;
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-4);
    background: var(--color-glass);
    backdrop-filter: var(--glass-blur);
  }

  .composer {
    inset-block-start: var(--space-4);
    inset-inline-start: 50%;
    display: grid;
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

  .dock {
    inset-block-end: var(--space-4);
    inset-inline-start: 50%;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    align-items: center;
    justify-content: center;
    max-inline-size: calc(100% - var(--space-5));
    padding: var(--space-2) var(--space-3);
    transform: translateX(-50%);
  }

  .dock :global(.row) {
    flex: 0 1 auto;
  }

  @media (width <= 48rem) {
    .composer {
      inset-block-start: var(--space-2);
      inline-size: calc(100% - var(--space-4));
      border-radius: var(--radius-3);
    }

    .dock {
      inset-block-end: var(--space-2);
      gap: var(--space-2);
      inline-size: calc(100% - var(--space-4));
      max-inline-size: none;
      padding: var(--space-2);
      border-radius: var(--radius-3);
    }

    .dock :global(.replay) {
      flex: 0 0 100%;
    }

    .dock :global(.replay input) {
      max-inline-size: none;
    }
  }
</style>
