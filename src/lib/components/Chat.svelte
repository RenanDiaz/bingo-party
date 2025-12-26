<script lang="ts">
  import { _ } from 'svelte-i18n';
  import type { ChatMessage, QuickReaction } from '../../../shared/types';
  import { getGameStore } from '../stores/gameState.svelte';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();

  const store = getGameStore();

  let messageInput = $state('');
  let messagesContainer: HTMLDivElement | null = $state(null);

  // Quick reactions with emojis
  const quickReactions: { key: QuickReaction; emoji: string }[] = [
    { key: 'good_luck', emoji: '🍀' },
    { key: 'so_close', emoji: '😅' },
    { key: 'one_more', emoji: '☝️' },
    { key: 'nice', emoji: '👍' },
    { key: 'wow', emoji: '😮' },
    { key: 'haha', emoji: '😂' },
    { key: 'nervous', emoji: '😰' },
    { key: 'lets_go', emoji: '🔥' },
  ];

  // Get emoji for a reaction key
  function getReactionEmoji(key: string): string {
    return quickReactions.find(r => r.key === key)?.emoji ?? key;
  }

  // Check if we're in lobby phase (full text chat available)
  const isLobbyPhase = $derived(store.gameState?.phase === 'lobby');

  // Auto-scroll to bottom when new messages arrive
  $effect(() => {
    if (store.chatMessages && messagesContainer) {
      // Scroll to bottom on new messages
      setTimeout(() => {
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 0);
    }
  });

  function handleSendMessage() {
    const trimmed = messageInput.trim();
    if (!trimmed) return;

    store.sendChatMessage(trimmed);
    messageInput = '';
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }

  function handleSendReaction(reaction: QuickReaction) {
    store.sendReaction(reaction);
  }

  function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
    role="dialog"
    aria-modal="true"
    aria-label={$_('chat.title')}
  >
    <!-- Chat panel -->
    <div class="bg-primary-900 w-full md:max-w-md md:rounded-xl rounded-t-xl flex flex-col max-h-[85vh] md:max-h-[600px] shadow-xl">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-primary-700">
        <h2 class="text-lg font-semibold text-white flex items-center gap-2">
          <span class="text-xl">💬</span>
          {$_('chat.title')}
        </h2>
        <button
          type="button"
          class="text-primary-300 hover:text-white transition-colors p-1"
          onclick={onClose}
          aria-label={$_('common.close')}
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Messages list -->
      <div
        bind:this={messagesContainer}
        class="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]"
      >
        {#if store.chatMessages.length === 0}
          <div class="text-center text-primary-400 py-8">
            {$_('chat.noMessages')}
          </div>
        {:else}
          {#each store.chatMessages as message (message.id)}
            <div
              class="flex flex-col {message.playerId === store.myPlayerId ? 'items-end' : 'items-start'}"
            >
              {#if message.type === 'reaction'}
                <!-- Reaction message -->
                <div class="flex items-center gap-2 {message.playerId === store.myPlayerId ? 'flex-row-reverse' : ''}">
                  <span class="text-3xl animate-pop">{getReactionEmoji(message.content)}</span>
                  <span class="text-xs text-primary-400">{message.playerName}</span>
                </div>
              {:else}
                <!-- Text message -->
                <div class="max-w-[85%]">
                  <div class="flex items-baseline gap-2 mb-1 {message.playerId === store.myPlayerId ? 'flex-row-reverse' : ''}">
                    <span class="text-xs font-medium text-primary-300">
                      {message.playerId === store.myPlayerId ? $_('chat.you') : message.playerName}
                    </span>
                    <span class="text-xs text-primary-500">{formatTime(message.timestamp)}</span>
                  </div>
                  <div
                    class="rounded-2xl px-4 py-2 {message.playerId === store.myPlayerId
                      ? 'bg-primary-600 text-white rounded-br-sm'
                      : 'bg-primary-800 text-primary-100 rounded-bl-sm'}"
                  >
                    {message.content}
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        {/if}
      </div>

      <!-- Quick reactions (always visible) -->
      <div class="px-4 py-2 border-t border-primary-700">
        <div class="text-xs text-primary-400 mb-2">{$_('chat.quickReactions')}</div>
        <div class="flex flex-wrap gap-2">
          {#each quickReactions as reaction}
            <button
              type="button"
              class="text-2xl hover:scale-125 transition-transform active:scale-95"
              onclick={() => handleSendReaction(reaction.key)}
              title={$_(`chat.reactions.${reaction.key}`)}
            >
              {reaction.emoji}
            </button>
          {/each}
        </div>
      </div>

      <!-- Text input (only in lobby) -->
      {#if isLobbyPhase}
        <div class="p-4 border-t border-primary-700">
          <div class="flex gap-2">
            <input
              type="text"
              class="input flex-1"
              placeholder={$_('chat.placeholder')}
              bind:value={messageInput}
              onkeydown={handleKeyDown}
              maxlength="200"
            />
            <button
              type="button"
              class="btn btn-primary px-4"
              onclick={handleSendMessage}
              disabled={!messageInput.trim()}
              aria-label={$_('chat.title')}
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      {:else}
        <div class="p-4 border-t border-primary-700">
          <div class="text-sm text-primary-400 text-center">
            {$_('chat.reactionsOnly')}
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  @keyframes pop {
    0% { transform: scale(0.8); opacity: 0; }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }

  :global(.animate-pop) {
    animation: pop 0.3s ease-out;
  }
</style>
