<script lang="ts">
  export interface ToastItem {
    id: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
  }

  let { toasts = [], onDismiss }: { toasts: ToastItem[]; onDismiss?: (id: string) => void } = $props();
</script>

{#if toasts.length > 0}
  <div class="fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-sm">
    {#each toasts as toast (toast.id)}
      <div
        class="toast-item px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm border animate-slide-in
          {toast.type === 'success' ? 'bg-green-500/90 border-green-400/50 text-white' : ''}
          {toast.type === 'error' ? 'bg-red-500/90 border-red-400/50 text-white' : ''}
          {toast.type === 'warning' ? 'bg-yellow-500/90 border-yellow-400/50 text-black' : ''}
          {toast.type === 'info' || !toast.type ? 'bg-primary-600/90 border-primary-400/50 text-white' : ''}"
        role="alert"
      >
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium">{toast.message}</span>
          {#if onDismiss}
            <button
              type="button"
              class="opacity-70 hover:opacity-100 transition-opacity"
              onclick={() => onDismiss?.(toast.id)}
              aria-label="Dismiss"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          {/if}
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
</style>
