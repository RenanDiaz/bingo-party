<script lang="ts">
  import { _ } from 'svelte-i18n';
  import type { Winner } from '../../../shared/types';

  interface Props {
    winners: Winner[];
    currentPlayerId: string;
    onClose?: () => void;
  }

  let { winners, currentPlayerId, onClose }: Props = $props();

  const sortedWinners = $derived(
    [...winners].sort((a, b) => a.place - b.place)
  );

  function getPlaceLabel(place: number): string {
    switch (place) {
      case 1:
        return $_('bingo.1stPlace');
      case 2:
        return $_('bingo.2ndPlace');
      case 3:
        return $_('bingo.3rdPlace');
      default:
        return `${place}th Place`;
    }
  }

  function getPlaceColor(place: number): string {
    switch (place) {
      case 1:
        return 'from-yellow-400 to-amber-500';
      case 2:
        return 'from-gray-300 to-gray-400';
      case 3:
        return 'from-amber-600 to-amber-700';
      default:
        return 'from-primary-400 to-primary-500';
    }
  }
</script>

{#if winners.length > 0}
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
    <div class="card p-6 max-w-md w-full text-center space-y-6 animate-bounce-in">
      <!-- Confetti effect placeholder -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        {#each { length: 20 } as _, i}
          <div
            class="absolute w-2 h-2 rounded-full animate-confetti"
            style="left: {Math.random() * 100}%; animation-delay: {Math.random() * 0.5}s; background-color: hsl({Math.random() * 360}, 70%, 60%)"
          ></div>
        {/each}
      </div>

      <!-- Trophy icon -->
      <div class="text-6xl">🏆</div>

      <!-- Title -->
      <h2 class="text-3xl font-bold text-accent-gold">
        {$_('bingo.bingo')}
      </h2>

      <!-- Winners list -->
      <div class="space-y-3">
        {#each sortedWinners as winner (winner.playerId + winner.place)}
          <div
            class="bg-gradient-to-r {getPlaceColor(winner.place)} p-4 rounded-xl text-primary-900"
          >
            <div class="text-sm font-medium opacity-80">
              {getPlaceLabel(winner.place)}
            </div>
            <div class="text-xl font-bold">
              {#if winner.playerId === currentPlayerId}
                {$_('bingo.youWin')}
              {:else}
                {$_('bingo.playerWins', { values: { player: winner.playerName } })}
              {/if}
            </div>
          </div>
        {/each}
      </div>

      <!-- Close button -->
      {#if onClose}
        <button
          type="button"
          class="btn btn-primary"
          onclick={onClose}
        >
          OK
        </button>
      {/if}
    </div>
  </div>
{/if}
