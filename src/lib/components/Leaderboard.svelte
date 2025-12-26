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

  <!-- Leaderboard content (for sharing) - Using table with inline styles for html2canvas compatibility -->
  <div
    bind:this={leaderboardElement}
    style="background-color: #2d2540; border-radius: 8px; padding: 16px;"
  >
    {#if hasAnyGames}
      <table style="width: 100%; border-collapse: collapse; font-family: system-ui, -apple-system, sans-serif;">
        <!-- Header -->
        <thead>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            <th style="text-align: left; padding: 8px 4px; color: rgba(255,255,255,0.5); font-size: 12px; font-weight: normal; width: 32px;">#</th>
            <th style="text-align: left; padding: 8px 4px; color: rgba(255,255,255,0.5); font-size: 12px; font-weight: normal;">{$_('leaderboard.player')}</th>
            <th style="text-align: center; padding: 8px 4px; color: rgba(255,255,255,0.5); font-size: 12px; font-weight: normal; width: 50px;">{$_('leaderboard.wins')}</th>
            <th style="text-align: center; padding: 8px 4px; color: rgba(255,255,255,0.5); font-size: 12px; font-weight: normal; width: 50px;">{$_('leaderboard.games')}</th>
          </tr>
        </thead>
        <!-- Entries -->
        <tbody>
          {#each leaderboardEntries as entry (entry.persistentId)}
            <tr style="background-color: rgba(255,255,255,0.05); {entry.connected ? '' : 'opacity: 0.5;'}">
              <!-- Position -->
              <td style="padding: 10px 4px; color: white; font-weight: bold; font-size: 14px; vertical-align: middle;">
                {#if entry.position <= 3 && entry.wins > 0}
                  {getMedalEmoji(entry.position)}
                {:else}
                  {entry.position}
                {/if}
              </td>

              <!-- Player name with connection indicator -->
              <td style="padding: 10px 4px; vertical-align: middle;">
                <span style="display: inline-flex; align-items: center; gap: 8px;">
                  <span
                    style="width: 8px; height: 8px; border-radius: 50%; display: inline-block; background-color: {entry.connected ? '#22c55e' : '#6b7280'};"
                  ></span>
                  <span style="color: white;">{entry.playerName}</span>
                </span>
              </td>

              <!-- Wins -->
              <td style="text-align: center; padding: 10px 4px; color: #fbbf24; font-weight: bold; vertical-align: middle;">{entry.wins}</td>

              <!-- Games played -->
              <td style="text-align: center; padding: 10px 4px; color: rgba(255,255,255,0.7); vertical-align: middle;">{entry.gamesPlayed}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <p style="color: rgba(255,255,255,0.4); font-size: 14px; text-align: center; padding: 16px 0;">
        {$_('leaderboard.noGamesYet')}
      </p>
    {/if}

    <!-- Room ID footer for shared image -->
    <div style="font-size: 12px; color: rgba(255,255,255,0.3); text-align: center; padding-top: 12px; margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
      BingoParty - {$_('game.room')}: {roomId}
    </div>
  </div>
</div>
