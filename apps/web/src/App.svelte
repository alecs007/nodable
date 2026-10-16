<script lang="ts">
  import './app.css'
  import HintBar from './lib/components/HintBar.svelte'
  import InputBar from './lib/components/InputBar.svelte'
  import SettingsBar from './lib/components/SettingsBar.svelte'
  import StepSlider from './lib/components/StepSlider.svelte'
  import TreeCanvas from './lib/components/TreeCanvas.svelte'
  import TreeGallery from './lib/components/TreeGallery.svelte'
  import WorkspaceControls from './lib/components/WorkspaceControls.svelte'
  import { locale } from './lib/state/locale.svelte'
  import { workspace } from './lib/state/workspace.svelte'
  import { theme } from './lib/theme/theme.svelte'

  const session = $derived(workspace.active)

  $effect(() => theme.start())

  $effect(() => {
    document.documentElement.lang = locale.current
  })
</script>

<div class="shell">
  <header class="header">
    <div class="identity">
      <h1>{locale.t('app.title')}</h1>
      <p class="tagline">{locale.t('app.tagline')}</p>
    </div>
    <SettingsBar />
  </header>

  <main class="main">
    <section class="composer" aria-label={locale.t('input.label')}>
      <InputBar
        value={session.input}
        diagnostics={session.analysis.diagnostics}
        allowedNext={session.analysis.allowedNext}
        onchange={(value: string) => {
          workspace.setInput(value)
        }}
        onsubmit={() => {
          workspace.addFormula()
        }}
      />
      <HintBar
        diagnostics={session.analysis.diagnostics}
        allowedNext={session.analysis.allowedNext}
        isComplete={session.analysis.isComplete}
        isEmpty={session.input.length === 0}
      />
    </section>

    <section class="controls" aria-label={locale.t('view.label')}>
      <WorkspaceControls />
      <StepSlider
        steps={session.analysis.steps}
        index={workspace.stepIndex}
        onselect={(index: number) => {
          workspace.showStep(index)
        }}
      />
    </section>

    <section class="canvas" class:gallery={workspace.view === 'all'}>
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
    </section>
  </main>
</div>

<style>
  .shell {
    display: grid;
    grid-template-rows: auto 1fr;
    gap: var(--space-5);
    min-block-size: 100vh;
    padding: var(--space-5);
  }

  .header {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    align-items: flex-start;
    justify-content: space-between;
  }

  .identity h1 {
    margin: 0;
    font-size: 1.75rem;
    letter-spacing: -0.01em;
  }

  .tagline {
    margin: var(--space-1) 0 0;
    color: var(--color-text-muted);
    font-size: 0.9375rem;
  }

  .main {
    display: grid;
    grid-template-rows: auto auto 1fr;
    gap: var(--space-5);
    min-block-size: 0;
  }

  .composer {
    display: grid;
    gap: var(--space-3);
    max-inline-size: 60rem;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-5);
    align-items: flex-end;
    justify-content: space-between;
  }

  .canvas {
    display: grid;
    place-items: start center;
    overflow: auto;
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-3);
    background: var(--color-surface-raised);
    min-block-size: 20rem;
  }

  .canvas.gallery {
    place-items: stretch;
  }
</style>
