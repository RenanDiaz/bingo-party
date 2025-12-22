<script lang="ts">
  import { _ } from 'svelte-i18n';
  import type { BingoPlayer } from '../../../shared/types';

  interface Props {
    players: BingoPlayer[];
    currentPlayerId: string;
    isHost: boolean;
    onKick?: (playerId: string) => void;
  }

  let {
    players,
    currentPlayerId,
    isHost,
    onKick,
  }: Props = $props();

  const sortedPlayers = $derived(
    [...players].sort((a, b) => {
      // Host first
      if (a.isHost && !b.isHost) return -1;
      if (!a.isHost && b.isHost) return 1;
      // Then by name
      return a.name.localeCompare(b.name);
    })
  );
</script>

<div class="card p-4 space-y-3">
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-bold text-white">
      {$_('players.players')}
    </h3>
    <span class="text-white/50 text-sm">
      {$_('players.online', { values: { count: players.filter(p => p.connected).length } })}
    </span>
  </div>

  <div class="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
    {#each sortedPlayers as player (player.id)}
      <div
        class="flex items-center justify-between p-2 rounded-lg {player.connected ? 'bg-white/5' : 'bg-white/5 opacity-50'}"
      >
        <div class="flex items-center gap-2 min-w-0">
          <!-- Connection indicator -->
          <div
            class="w-2 h-2 rounded-full {player.connected ? 'bg-green-500' : 'bg-gray-500'}"
            title={player.connected ? $_('players.ready') : $_('players.disconnected')}
          ></div>

          <!-- Name -->
          <span class="text-white font-medium truncate">
            {player.name}
            {#if player.id === currentPlayerId}
              <span class="text-white/50 text-sm">({$_('players.you')})</span>
            {/if}
          </span>

          <!-- Host badge -->
          {#if player.isHost}
            <span class="bg-accent-gold text-primary-900 text-xs font-bold px-1.5 py-0.5 rounded">
              {$_('players.host')}
            </span>
          {/if}
        </div>

        <div class="flex items-center gap-2">
          <!-- Ready status -->
          {#if player.readyToPlay}
            <span class="text-green-400 text-xs">{$_('players.ready')}</span>
          {:else}
            <span class="text-white/40 text-xs">{$_('players.notReady')}</span>
          {/if}

          <!-- Cards count -->
          {#if player.selectedCardIds.length > 0}
            <span class="text-white/50 text-xs">
              {player.selectedCardIds.length} cards
            </span>
          {/if}

          <!-- Kick button (host only, not self) -->
          {#if isHost && player.id !== currentPlayerId && onKick}
            <button
              type="button"
              class="text-red-400 hover:text-red-300 text-xs px-1"
              onclick={() => onKick(player.id)}
            >
              {$_('host.kickPlayer')}
            </button>
          {/if}
        </div>
      </div>
    {/each}

    {#if players.length === 0}
      <p class="text-white/40 text-sm text-center py-4">
        No players yet
      </p>
    {/if}
  </div>
</div>
