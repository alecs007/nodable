<script lang="ts">
  import { locale } from '../state/locale.svelte'
  import { focusFormula, overlay } from '../state/overlay.svelte'
  import { workspace } from '../state/workspace.svelte'
  import Icon from './Icon.svelte'
  import Modal from './Modal.svelte'

  let name = $state('')
  let isCreated = false

  function focusLater(node: HTMLInputElement): void {
    requestAnimationFrame(() => {
      node.focus({ preventScroll: true })
      node.select()
    })
  }

  function create(dismiss: () => void): void {
    workspace.addFormula()
    workspace.rename(name.trim())
    isCreated = true
    dismiss()
  }
</script>

{#if overlay.isCreating}
  <Modal
    title={locale.t('workspace.add')}
    isCentered
    onclose={() => {
      overlay.stopCreating()
      name = ''

      if (isCreated) {
        isCreated = false
        focusFormula()
      }
    }}
  >
    {#snippet children(dismiss: () => void)}
      <form
        class="create"
        onsubmit={(event) => {
          event.preventDefault()
          create(dismiss)
        }}
      >
        <input
          type="text"
          autocomplete="off"
          enterkeyhint="done"
          aria-label={locale.t('workspace.name')}
          placeholder={locale.t('workspace.name')}
          bind:value={name}
          use:focusLater
        />
        <div class="buttons">
          <button type="button" class="button" onclick={dismiss}>
            {locale.t('create.cancel')}
          </button>
          <button type="submit" class="button primary">
            <Icon name="add" />{locale.t('create.confirm')}
          </button>
        </div>
      </form>
    {/snippet}
  </Modal>
{/if}

<style>
  .create {
    display: grid;
    gap: var(--space-3);
  }

  input {
    block-size: 3rem;
    padding: 0 var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    background: var(--color-surface-sunken);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: 1rem;
    line-height: normal;
    outline: none;
    appearance: none;
    transition: border-color var(--duration-short) var(--ease);
  }

  input:focus {
    border-color: var(--color-accent);
  }

  input::placeholder {
    color: var(--color-text-muted);
  }

  .buttons {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-2);
  }

  .button {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    justify-content: center;
    block-size: 2.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      border-color var(--duration-short) var(--ease),
      opacity var(--duration-short) var(--ease);
  }

  .button:hover {
    border-color: var(--color-border-strong);
  }

  .button.primary {
    border-color: var(--color-accent);
    background: var(--color-accent);
    color: var(--color-accent-contrast);
  }

  .button.primary:hover {
    opacity: 0.9;
  }
</style>
