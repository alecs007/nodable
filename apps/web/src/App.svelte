<script lang="ts">
  import './app.css'
  import BrandMark from './lib/components/BrandMark.svelte'
  import HintBar from './lib/components/HintBar.svelte'
  import InputBar from './lib/components/InputBar.svelte'
  import StepSlider from './lib/components/StepSlider.svelte'
  import ToolBar from './lib/components/ToolBar.svelte'
  import TreeCanvas from './lib/components/TreeCanvas.svelte'
  import TreeGallery from './lib/components/TreeGallery.svelte'
  import { locale } from './lib/state/locale.svelte'
  import { workspace } from './lib/state/workspace.svelte'
  import { theme } from './lib/theme/theme.svelte'

  const session = $derived(workspace.active)
  const hasError = $derived(
    session.analysis.diagnostics.some((diagnostic) => diagnostic.severity === 'error'),
  )

  $effect(() => theme.start())

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

  <div class="islands">
    <section class="island composer" aria-label={locale.t('input.label')}>
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
    </section>

    <section class="island tools" aria-label={locale.t('view.label')}>
      <ToolBar />
      {#if workspace.lastStepIndex > 0}
        <StepSlider
          steps={session.analysis.steps}
          index={workspace.stepIndex}
          onselect={(index: number) => {
            workspace.showStep(index)
          }}
        />
      {/if}
    </section>
  </div>
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
    padding: clamp(12rem, 28vh, 16rem) var(--space-5) var(--space-6);
    overflow: auto;
  }

  .workspace.gallery {
    place-items: stretch;
  }

  .islands {
    position: absolute;
    inset-block-start: 0;
    inset-inline: 0;
    display: grid;
    gap: var(--space-3);
    justify-items: center;
    padding: var(--space-4);
    pointer-events: none;
  }

  .island {
    inline-size: min(100%, 44rem);
    padding: var(--space-3);
    border: 1px solid var(--color-glass-border);
    border-radius: var(--radius-4);
    background: var(--color-glass);
    backdrop-filter: var(--glass-blur);
    pointer-events: auto;
  }

  .composer {
    display: grid;
    gap: var(--space-2);
  }

  .caption {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    align-items: center;
    justify-content: space-between;
    padding-inline: var(--space-2);
  }

  .tools {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    align-items: center;
    justify-content: center;
    inline-size: auto;
    max-inline-size: min(100%, 44rem);
    padding-inline: var(--space-4);
  }

  @media (width <= 48rem) {
    .stage {
      display: flex;
      flex-direction: column;
    }

    .islands {
      position: static;
      order: -1;
      padding: var(--space-2);
    }

    .island {
      inline-size: 100%;
      max-inline-size: none;
      border-radius: var(--radius-3);
    }

    .tools {
      justify-content: flex-start;
      padding-inline: var(--space-2);
    }

    .workspace {
      flex: 1;
      min-block-size: 0;
      padding: var(--space-4) var(--space-2) var(--space-5);
    }
  }
</style>
