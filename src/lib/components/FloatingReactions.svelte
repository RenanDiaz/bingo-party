<script lang="ts">
  import { getGameStore } from '../stores/gameState.svelte';
  import type { QuickReaction } from '../../../shared/types';

  const store = getGameStore();

  // Quick reactions with emojis
  const reactionEmojis: Record<QuickReaction, string> = {
    good_luck: '🍀',
    so_close: '😅',
    one_more: '☝️',
    nice: '👍',
    wow: '😮',
    haha: '😂',
    nervous: '😰',
    lets_go: '🔥',
  };

  function getEmoji(reaction: QuickReaction): string {
    return reactionEmojis[reaction] ?? reaction;
  }
</script>

<!-- Floating reactions container -->
<div class="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
  {#each store.floatingReactions as reaction (reaction.id)}
    <div
      class="flex items-center gap-2 bg-black/70 rounded-full px-4 py-2 text-white animate-float-up"
    >
      <span class="text-2xl">{getEmoji(reaction.reaction)}</span>
      <span class="text-sm font-medium">{reaction.playerName}</span>
    </div>
  {/each}
</div>

<style>
  @keyframes float-up {
    0% {
      opacity: 0;
      transform: translateY(20px) scale(0.8);
    }
    20% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    80% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    100% {
      opacity: 0;
      transform: translateY(-20px) scale(0.9);
    }
  }

  .animate-float-up {
    animation: float-up 3s ease-out forwards;
  }
</style>
