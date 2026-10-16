<script lang="ts">
  import './app.css'
  import { collectNodes } from '@nodable/sdk'
  import BrandMark from './lib/components/BrandMark.svelte'
  import HintBar from './lib/components/HintBar.svelte'
  import InputBar from './lib/components/InputBar.svelte'
  import OutcomePreview from './lib/components/OutcomePreview.svelte'
  import StepSlider from './lib/components/StepSlider.svelte'
  import ToolBar from './lib/components/ToolBar.svelte'
  import TreeCanvas from './lib/components/TreeCanvas.svelte'
  import TreeGallery from './lib/components/TreeGallery.svelte'
  import { locale } from './lib/state/locale.svelte'
  import { persistence } from './lib/state/persistence.svelte'
  import { workspace } from './lib/state/workspace.svelte'
  import { theme } from './lib/theme/theme.svelte'

  const session = $derived(workspace.active)
  const hasError = $derived(
    session.analysis.diagnostics.some((diagnostic) => diagnostic.severity === 'error'),
  )
  const hasPendingGroup = $derived(
    workspace.view === 'single' &&
      collectNodes(workspace.snapshot.root).some((node) => node.kind === 'group' && !node.isClosed),
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
  <main class="workspace" class:gallery={workspace.view === 'all'}>
    {#if workspace.view === 'all'}
      <TreeGallery
        sessions={workspace.sessions}
        activeId={workspace.activeId}
        highlightLeaves={workspace.highlightLeaves}
        onselect={(id: string) => {
          workspace.select(id)
        }}
      />
    {:else}
      <TreeCanvas
        snapshot={workspace.snapshot}
        highlightLeaves={workspace.highlightLeaves}
        interactive
        onmovenode={(nodeId: string, delta: { x: number; y: number }) => {
          workspace.nudgeNode(nodeId, delta)
        }}
      />
    {/if}
  </main>

  <header class="composer island" aria-label={locale.t('input.label')}>
    <div class="caption">
      <BrandMark />
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

  {#if hasPendingGroup}
    <div class="hintbox">
      <OutcomePreview />
    </div>
  {/if}

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
  }

  .workspace.gallery {
    place-items: stretch;
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

  .hintbox {
    position: absolute;
    inset-block-end: clamp(6.5rem, 15vh, 8rem);
    inset-inline-start: var(--space-4);
  }

  @media (width <= 48rem) {
    .workspace {
      padding: 11rem var(--space-2) 7rem;
    }

    .composer {
      inset-block-start: var(--space-2);
      inline-size: calc(100% - var(--space-4));
      border-radius: var(--radius-3);
    }

    .dock {
      inset-block-end: var(--space-2);
      max-inline-size: calc(100% - var(--space-4));
      border-radius: var(--radius-3);
    }

    .hintbox {
      inset-block-end: 6.5rem;
      inset-inline-start: var(--space-2);
      transform: scale(0.85);
      transform-origin: bottom left;
    }
  }
</style>
