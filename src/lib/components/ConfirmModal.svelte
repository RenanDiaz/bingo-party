<script lang="ts">
  interface Props {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    onCancel: () => void;
  }

  let { isOpen, title, message, confirmText, cancelText, onConfirm, onCancel }: Props = $props();

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onCancel();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirm-modal-title"
    tabindex="-1"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
  >
    <div class="card p-6 max-w-md w-full">
      <h2 id="confirm-modal-title" class="text-xl font-bold text-white mb-4">{title}</h2>
      <p class="text-white/80 mb-6">{message}</p>
      <div class="flex gap-3 justify-end">
        <button
          type="button"
          class="btn btn-secondary"
          onclick={onCancel}
        >
          {cancelText}
        </button>
        <button
          type="button"
          class="btn bg-red-500 hover:bg-red-600 text-white"
          onclick={onConfirm}
        >
          {confirmText}
        </button>
      </div>
    </div>
  </div>
{/if}
