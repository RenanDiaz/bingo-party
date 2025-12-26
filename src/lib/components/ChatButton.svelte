<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { getGameStore } from '../stores/gameState.svelte';

  const store = getGameStore();

  function handleClick() {
    store.toggleChat();
  }
</script>

<button
  type="button"
  class="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-500 text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
  onclick={handleClick}
  aria-label={$_('chat.openChat')}
>
  <span class="text-2xl">💬</span>

  <!-- Unread badge -->
  {#if store.unreadChatCount > 0}
    <span
      class="absolute -top-1 -right-1 min-w-[22px] h-[22px] rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center px-1 animate-bounce-in"
    >
      {store.unreadChatCount > 99 ? '99+' : store.unreadChatCount}
    </span>
  {/if}
</button>

<style>
  @keyframes bounce-in {
    0% { transform: scale(0); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }

  :global(.animate-bounce-in) {
    animation: bounce-in 0.3s ease-out;
  }
</style>
