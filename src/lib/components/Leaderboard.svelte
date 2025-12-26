<script lang="ts">
  import { _ } from 'svelte-i18n';
  import type { PlayerStats, LeaderboardEntry } from '../../../shared/types';

  interface Props {
    playerStats: Record<string, PlayerStats>;
    roomId: string;
  }

  let { playerStats, roomId }: Props = $props();

  let showOnlyConnected = $state(false);
  let isSharing = $state(false);
  let canShare = $state(false);
  let leaderboardElement: HTMLDivElement | undefined = $state();

  // Check if Web Share API with files is supported
  $effect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      // Check if file sharing is supported
      canShare = navigator.canShare?.({ files: [new File([], 'test.png', { type: 'image/png' })] }) ?? false;
    }
  });

  // Convert playerStats to sorted leaderboard entries
  const leaderboardEntries = $derived.by(() => {
    const entries = Object.values(playerStats)
      .filter(stats => !showOnlyConnected || stats.connected)
      .sort((a, b) => {
        // Sort by wins (descending)
        if (b.wins !== a.wins) return b.wins - a.wins;
        // Then by games played (descending)
        if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
        // Then by name
        return a.playerName.localeCompare(b.playerName);
      })
      .map((stats, index) => ({
        position: index + 1,
        persistentId: stats.persistentId,
        playerName: stats.playerName,
        wins: stats.wins,
        gamesPlayed: stats.gamesPlayed,
        connected: stats.connected,
      } satisfies LeaderboardEntry));

    return entries;
  });

  const hasAnyGames = $derived(
    Object.values(playerStats).some(stats => stats.gamesPlayed > 0)
  );

  function getMedalEmoji(position: number): string {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  }

  async function shareLeaderboard() {
    if (!leaderboardElement || isSharing) return;

    isSharing = true;

    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;

      // Generate canvas from the leaderboard element
      const canvas = await html2canvas(leaderboardElement, {
        backgroundColor: '#1a1625',
        scale: 2,
        logging: false,
      });

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create blob'));
        }, 'image/png');
      });

      // Create file for sharing
      const file = new File([blob], `bingo-leaderboard-${roomId}.png`, { type: 'image/png' });

      // Share using Web Share API
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: $_('leaderboard.shareTitle'),
          text: $_('leaderboard.shareText', { values: { roomId } }),
          files: [file],
        });
      } else {
        // Fallback: download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bingo-leaderboard-${roomId}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      // User cancelled or share failed - silently ignore
      console.error('Share failed:', error);
    } finally {
      isSharing = false;
    }
  }
</script>

<div class="card p-4 space-y-3">
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-bold text-white">
      {$_('leaderboard.title')}
    </h3>
    <button
      type="button"
      class="btn btn-secondary text-sm py-1 px-2"
      onclick={shareLeaderboard}
      disabled={isSharing || !hasAnyGames}
      title={$_('leaderboard.share')}
    >
      {#if isSharing}
        <span class="animate-spin">⏳</span>
      {:else}
        📤 {$_('leaderboard.share')}
      {/if}
    </button>
  </div>

  <!-- Filter toggle -->
  <div class="flex items-center gap-2">
    <label class="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
      <input
        type="checkbox"
        bind:checked={showOnlyConnected}
        class="w-4 h-4 rounded border-white/20 bg-white/10 text-primary-500 focus:ring-primary-500"
      />
      {$_('leaderboard.showOnlyConnected')}
    </label>
  </div>

  <!-- Leaderboard content (for sharing) -->
  <div bind:this={leaderboardElement} class="space-y-2 bg-primary-900/50 rounded-lg p-3">
    {#if hasAnyGames}
      <!-- Header -->
      <div class="grid grid-cols-[2rem_1fr_3rem_3rem] gap-2 text-xs text-white/50 pb-1 border-b border-white/10">
        <span>#</span>
        <span>{$_('leaderboard.player')}</span>
        <span class="text-center">{$_('leaderboard.wins')}</span>
        <span class="text-center">{$_('leaderboard.games')}</span>
      </div>

      <!-- Entries -->
      <div class="space-y-1 max-h-60 overflow-y-auto scrollbar-thin">
        {#each leaderboardEntries as entry (entry.persistentId)}
          <div
            class="grid grid-cols-[2rem_1fr_3rem_3rem] gap-2 items-center p-2 rounded-lg {entry.connected ? 'bg-white/5' : 'bg-white/5 opacity-50'}"
          >
            <!-- Position -->
            <span class="text-white font-bold text-sm">
              {#if entry.position <= 3 && entry.wins > 0}
                {getMedalEmoji(entry.position)}
              {:else}
                {entry.position}
              {/if}
            </span>

            <!-- Player name with connection indicator -->
            <div class="flex items-center gap-2 min-w-0">
              <div
                class="w-2 h-2 rounded-full flex-shrink-0 {entry.connected ? 'bg-green-500' : 'bg-gray-500'}"
              ></div>
              <span class="text-white truncate">{entry.playerName}</span>
            </div>

            <!-- Wins -->
            <span class="text-center text-accent-gold font-bold">{entry.wins}</span>

            <!-- Games played -->
            <span class="text-center text-white/70">{entry.gamesPlayed}</span>
          </div>
        {/each}
      </div>
    {:else}
      <p class="text-white/40 text-sm text-center py-4">
        {$_('leaderboard.noGamesYet')}
      </p>
    {/if}

    <!-- Room ID footer for shared image -->
    <div class="text-xs text-white/30 text-center pt-2 border-t border-white/10">
      BingoParty - {$_('game.room')}: {roomId}
    </div>
  </div>
</div>
