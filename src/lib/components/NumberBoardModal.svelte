<script lang="ts">
  import { _ } from 'svelte-i18n';
  import NumberBoard from './NumberBoard.svelte';

  interface Props {
    calledNumbers: number[];
    currentNumber: number | null;
    isOpen: boolean;
    onClose: () => void;
  }

  let { calledNumbers, currentNumber, isOpen, onClose }: Props = $props();

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
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
    tabindex="-1"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
  >
    <div class="max-w-lg w-full max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-3">
        <h2 class="text-xl font-bold text-white">{$_('game.calledNumbers')}</h2>
        <button
          type="button"
          class="text-white/70 hover:text-white p-1"
          onclick={onClose}
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <NumberBoard {calledNumbers} {currentNumber} />
    </div>
  </div>
{/if}
