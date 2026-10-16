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
  import TreeGallery from './lib/components/TreeGallery.svelte'
  import VariantBoard from './lib/components/VariantBoard.svelte'
  import { locale } from './lib/state/locale.svelte'
  import { persistence } from './lib/state/persistence.svelte'
  import { workspace } from './lib/state/workspace.svelte'
  import { theme } from './lib/theme/theme.svelte'

  const session = $derived(workspace.active)
  const variants = $derived(pendingVariants(workspace.snapshot))
  const hasError = $derived(
    session.analysis.diagnostics.some((diagnostic) => diagnostic.severity === 'error'),
  )
  $effect(() => theme.start())

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

<div class="stage">
  <main
    class="workspace"
    class:gallery={workspace.view === 'all'}
    onwheel={(event: WheelEvent) => {
      if (event.ctrlKey) {
        event.preventDefault()
        workspace.zoomBy(event.deltaY < 0 ? 1.1 : 1 / 1.1)
      }
    }}
  >
    <div class="zoom" style:transform="scale({workspace.zoom})">
      {#if workspace.view === 'all'}
        <TreeGallery
          sessions={workspace.sessions}
          activeId={workspace.activeId}
          highlightLeaves={workspace.highlightLeaves}
          onselect={(id: string) => {
            workspace.select(id)
          }}
          ondelete={(id: string) => {
            workspace.remove(id)
          }}
        />
      {:else if variants.length > 1}
        <VariantBoard {variants} highlightLeaves={workspace.highlightLeaves} />
      {:else}
        <TreeCanvas
          snapshot={variants[0]?.snapshot ?? workspace.snapshot}
          hideLabelFor={variants[0]?.workingId}
          highlightLeaves={workspace.highlightLeaves}
        />
      {/if}
    </div>
  </main>

  <header class="composer island" aria-label={locale.t('input.label')}>
    <div class="caption">
      <BrandMark />
      <NameField
        value={session.name}
        onchange={(value: string) => {
          workspace.rename(value)
        }}
      />
      <HintBar
        diagnostics={session.analysis.diagnostics}
        allowedNext={session.analysis.allowedNext}
        isComplete={session.analysis.isComplete}
        isEmpty={session.input.length === 0}
      />
    </div>
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

  <nav class="dock island" aria-label={locale.t('view.label')}>
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
  }

  .workspace {
    display: grid;
    place-items: start center;
    inline-size: 100%;
    block-size: 100%;
    padding: clamp(9rem, 22vh, 12rem) var(--space-5) clamp(7rem, 16vh, 9rem);
    overflow: auto;
    scrollbar-gutter: stable both-edges;
  }

  .workspace.gallery {
    place-items: stretch;
  }

  .zoom {
    inline-size: 100%;
    transform-origin: top center;
    transition: transform var(--duration-medium) var(--ease);
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
    gap: var(--space-2);
    inline-size: min(calc(100% - var(--space-5)), 42rem);
    padding: var(--space-3);
    transform: translateX(-50%);
  }

  .caption {
    display: flex;
    flex-wrap: wrap;
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

  @media (width <= 48rem) {
    .workspace {
      padding: 11rem var(--space-2) 7rem;
    }

    .caption {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-1);
    }

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
  }
</style>
