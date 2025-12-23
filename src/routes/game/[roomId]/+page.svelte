<script lang="ts">
  import { page } from '$app/stores';
  import { goto, beforeNavigate } from '$app/navigation';
  import { browser } from '$app/environment';
  import { onMount, onDestroy } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { getGameStore } from '$lib/stores/gameState.svelte';

  import BingoCard from '$lib/components/BingoCard.svelte';
  import CardSelector from '$lib/components/CardSelector.svelte';
  import CalledNumberDisplay from '$lib/components/CalledNumberDisplay.svelte';
  import CalledHistory from '$lib/components/CalledHistory.svelte';
  import NumberBoardModal from '$lib/components/NumberBoardModal.svelte';
  import HostControls from '$lib/components/HostControls.svelte';
  import PlayerList from '$lib/components/PlayerList.svelte';
  import BingoButton from '$lib/components/BingoButton.svelte';
  import WinnerAnnouncement from '$lib/components/WinnerAnnouncement.svelte';
  import PatternPreview from '$lib/components/PatternPreview.svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';

  const store = getGameStore();

  let showNumberBoard = $state(false);
  let showWinners = $state(false);
  let linkCopied = $state(false);
  let canShare = $state(false);
  let activeTab = $state<'play' | 'host'>('play');
  let showLeaveConfirm = $state(false);
  let pendingNavigation = $state<(() => void) | null>(null);

  // Get room ID and player name from URL
  const roomId = $derived($page.params.roomId ?? '');
  const playerName = $derived($page.url.searchParams.get('name') || '');

  // Connect to room on mount
  onMount(() => {
    if (!browser) return;

    // Check if Web Share API is supported
    canShare = typeof navigator.share === 'function';

    if (!playerName || !roomId) {
      goto('/');
      return;
    }

    store.connect(roomId);

    // Wait for connection and join
    const checkConnection = setInterval(() => {
      if (store.connected) {
        store.joinRoom(playerName);
        clearInterval(checkConnection);
      } else if (store.error) {
        // Stop checking if there's an error
        clearInterval(checkConnection);
      }
    }, 100);

    return () => clearInterval(checkConnection);
  });

  onDestroy(() => {
    if (browser) {
      store.disconnect();
    }
  });

  // Track previous winners count to detect new winners
  let previousWinnersCount = $state(0);

  // Show winners when a new winner is added or game finishes
  $effect(() => {
    const currentWinners = store.gameState?.winners ?? [];
    const currentPhase = store.gameState?.phase;

    // Show modal when a new winner is added
    if (currentWinners.length > previousWinnersCount) {
      showWinners = true;
    }

    // Also show when game finishes (in case we missed a winner)
    if (currentPhase === 'finished' && currentWinners.length > 0) {
      showWinners = true;
    }

    // Update the count for next comparison
    previousWinnersCount = currentWinners.length;
  });

  // Redirect if kicked
  $effect(() => {
    if (store.kicked) {
      goto('/?error=kicked');
    }
  });

  async function copyRoomLink() {
    if (!browser) return;

    const url = `${window.location.origin}/game/${roomId}`;
    try {
      await navigator.clipboard.writeText(url);
      linkCopied = true;
      setTimeout(() => {
        linkCopied = false;
      }, 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      linkCopied = true;
      setTimeout(() => {
        linkCopied = false;
      }, 2000);
    }
  }

  async function shareRoom() {
    if (!browser || !canShare) return;

    const url = `${window.location.origin}/game/${roomId}`;
    try {
      await navigator.share({
        title: $_('app.name'),
        text: $_('host.shareText'),
        url
      });
    } catch {
      // User cancelled or share failed - silently ignore
    }
  }

  function handleCardSelect(cardIds: string[]) {
    store.selectCards(cardIds);
  }

  function handleConfirmCards() {
    store.setReady();
  }

  function handleMarkCell(cardId: string, row: number, col: number) {
    store.markCell(cardId, row, col);
  }

  function handleClaimBingo() {
    const { can, cardId } = store.canClaimBingo;
    if (can && cardId) {
      store.claimBingo(cardId);
    }
  }

  // Derived state for convenience
  const phase = $derived(store.gameState?.phase ?? 'lobby');
  const isPlaying = $derived(phase === 'playing');
  const isLobbyOrSelection = $derived(phase === 'lobby' || phase === 'cardSelection');
  const isReadyToPlay = $derived(store.myPlayer?.readyToPlay ?? false);

  // DEBUG: Log when isReadyToPlay changes
  $effect(() => {
    console.log('[DEBUG] isReadyToPlay changed:', isReadyToPlay, 'myPlayer:', store.myPlayer);
  });

  // Create derived states for card selection to ensure proper reactivity
  // The getter pattern in the store doesn't always trigger component re-renders
  const cardPool = $derived(store.cardPool);
  const selectedCardIds = $derived(store.selectedCardIds);

  // Navigation prevention - block if game started or user is host
  const gameStarted = $derived(phase !== 'lobby' && phase !== 'cardSelection');
  const shouldPreventNavigation = $derived(store.isHost || gameStarted);
  const leaveMessage = $derived(
    store.isHost ? $_('navigation.leaveHostMessage') : $_('navigation.leaveGameMessage')
  );

  // Prevent in-app navigation (SvelteKit)
  beforeNavigate((navigation) => {
    // Don't block if kicked or if we shouldn't prevent navigation
    if (store.kicked || !shouldPreventNavigation) return;

    // Show confirmation modal
    navigation.cancel();
    pendingNavigation = () => {
      // Force navigation by temporarily allowing it
      store.disconnect();
      if (navigation.to?.url) {
        goto(navigation.to.url.pathname + navigation.to.url.search);
      }
    };
    showLeaveConfirm = true;
  });

  // Prevent browser navigation (close tab, refresh, external link)
  $effect(() => {
    if (!browser) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (shouldPreventNavigation && !store.kicked) {
        event.preventDefault();
        // Modern browsers require returnValue to be set
        event.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  });

  function handleLeaveConfirm() {
    showLeaveConfirm = false;
    if (pendingNavigation) {
      pendingNavigation();
      pendingNavigation = null;
    }
  }

  function handleLeaveCancel() {
    showLeaveConfirm = false;
    pendingNavigation = null;
  }
</script>

<svelte:head>
  <title>{$_('app.name')} - Room {roomId}</title>
</svelte:head>

{#if store.error && !store.isReconnecting}
  <!-- Error state (only show when not reconnecting) -->
  <div class="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
    <div class="card p-6 max-w-md text-center">
      <p class="text-red-400 mb-4">{store.error}</p>
      <button type="button" class="btn btn-primary" onclick={() => goto('/')}>
        {$_('game.backToHome')}
      </button>
    </div>
  </div>
{:else if store.isReconnecting}
  <!-- Reconnecting state -->
  <div class="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-2 border-yellow-400 border-t-transparent mx-auto mb-4"></div>
      <p class="text-yellow-400 font-medium">{$_('game.reconnecting')}</p>
      <p class="text-white/50 text-sm mt-2">{$_('game.reconnectingHint')}</p>
    </div>
  </div>
{:else if !store.connected || !store.gameState || (store.cardPool.length === 0 && !store.myPlayer)}
  <!-- Loading state - wait for connection, game state, and card pool -->
  <div class="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent mx-auto mb-4"></div>
      <p class="text-white/70">{$_('landing.joining')}</p>
    </div>
  </div>
{:else}
  <div class="container mx-auto px-4 py-4">
    <!-- Room info bar -->
    <div class="card p-3 mb-4 flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-3">
        <div>
          <span class="text-white/50 text-sm">{$_('game.room')}:</span>
          <span class="text-white font-bold ml-1">{roomId}</span>
        </div>
        {#if store.currentPattern}
          <div class="flex items-center gap-2">
            <PatternPreview pattern={store.currentPattern} size="small" />
            <span class="text-white/70 text-sm">{store.currentPattern.name}</span>
          </div>
        {/if}
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          class="btn btn-secondary text-sm"
          onclick={copyRoomLink}
        >
          {linkCopied ? $_('host.linkCopied') : $_('host.copyLink')}
        </button>
        {#if canShare}
          <button
            type="button"
            class="btn btn-secondary text-sm"
            onclick={shareRoom}
          >
            {$_('host.share')}
          </button>
        {/if}
      </div>
    </div>

    <!-- Phase indicator -->
    <div class="text-center mb-4">
      {#if phase === 'lobby'}
        <span class="text-white/70">{$_('game.waitingForHost')}</span>
      {:else if phase === 'playing'}
        <span class="text-green-400 font-medium">{$_('game.gameInProgress')}</span>
      {:else if phase === 'paused'}
        <span class="text-yellow-400 font-medium">{$_('game.gamePaused')}</span>
      {:else if phase === 'timeout'}
        <span class="text-yellow-400 font-medium">{$_('game.timeout')}</span>
      {:else if phase === 'finished'}
        <span class="text-accent-gold font-medium">{$_('game.gameFinished')}</span>
      {/if}
    </div>

    <!-- Main game layout -->
    <div class="grid lg:grid-cols-3 gap-4">
      <!-- Left column: Host controls (desktop) or tabs (mobile) -->
      {#if store.isHost}
        <!-- Mobile tabs -->
        <div class="lg:hidden flex gap-2 mb-4">
          <button
            type="button"
            class="flex-1 py-2 rounded-lg font-medium transition-colors {activeTab === 'play' ? 'bg-primary-500 text-white' : 'bg-white/10 text-white/70'}"
            onclick={() => activeTab = 'play'}
          >
            {$_('game.tabPlay')}
          </button>
          <button
            type="button"
            class="flex-1 py-2 rounded-lg font-medium transition-colors {activeTab === 'host' ? 'bg-primary-500 text-white' : 'bg-white/10 text-white/70'}"
            onclick={() => activeTab = 'host'}
          >
            {$_('game.tabHost')}
          </button>
        </div>

        <!-- Desktop: sticky host controls sidebar -->
        <div class="hidden lg:block">
          <div class="sticky top-4 space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
            {#if store.gameState}
              <HostControls
                phase={store.gameState.phase}
                settings={store.gameState.settings}
                currentPattern={store.gameState.currentPattern}
                remainingNumbers={store.gameState.remainingNumbers.length}
                onStart={() => store.startGame()}
                onPause={() => store.pauseGame()}
                onResume={() => store.resumeGame()}
                onReset={() => store.resetGame()}
                onCallNext={() => store.callNext()}
                onToggleAutoCall={(enabled) => store.toggleAutoCall(enabled)}
                onToggleAllowHighlight={(enabled) => store.toggleAllowHighlight(enabled)}
                onSetSpeed={(ms) => store.setSpeed(ms)}
                onSetPattern={(pattern) => store.setPattern(pattern)}
                onCreateTimeout={(seconds) => store.createTimeout(seconds)}
                onEndTimeout={() => store.endTimeout()}
              />
            {/if}
            <PlayerList
              players={store.allPlayers}
              currentPlayerId={store.myPlayerId}
              isHost={store.isHost}
              onKick={(id) => store.kickPlayer(id)}
            />
          </div>
        </div>
      {/if}

      <!-- Center column: Cards or Card Selection -->
      <div class="{store.isHost ? 'lg:col-span-2' : 'lg:col-span-2'} {store.isHost && activeTab === 'host' ? 'hidden lg:block' : ''}">
        {#if isLobbyOrSelection && !isReadyToPlay}
          <!-- Card selection - show until player confirms their selection -->
          <CardSelector
            cards={cardPool}
            selectedIds={selectedCardIds}
            onSelect={handleCardSelect}
            onRegenerate={(preserveSelected) => store.regenerateCards(preserveSelected)}
            onConfirm={handleConfirmCards}
            disabled={phase !== 'lobby'}
          />
        {:else}
          <!-- Game view -->
          <div class="space-y-4">
            <!-- Current number display -->
            {#if store.gameState?.currentNumber}
              <CalledNumberDisplay
                currentNumber={store.gameState.currentNumber}
              />
            {/if}

            <!-- Called history -->
            {#if store.gameState?.callHistory}
              <CalledHistory callHistory={store.gameState.callHistory} />
            {/if}

            <!-- Player preferences -->
            {#if store.gameState?.settings.allowHighlightCalledNumbers}
              <div class="flex items-center justify-between bg-white/5 rounded-lg p-3">
                <span class="text-white/80 text-sm">{$_('game.highlightCalledNumbers')}</span>
                <button
                  type="button"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {store.myPlayer?.highlightCalledNumbers ? 'bg-primary-500' : 'bg-white/20'}"
                  onclick={() => store.toggleHighlightCalledNumbers(!store.myPlayer?.highlightCalledNumbers)}
                  aria-label={$_('game.highlightCalledNumbers')}
                  aria-pressed={store.myPlayer?.highlightCalledNumbers ?? false}
                >
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {store.myPlayer?.highlightCalledNumbers ? 'translate-x-6' : 'translate-x-1'}"
                  ></span>
                </button>
              </div>
            {/if}

            <!-- Player's cards -->
            <div class="grid grid-cols-1 {store.myCards.length > 1 ? 'md:grid-cols-2' : ''} gap-4">
              {#each store.myCards as card (card.id)}
                {@const cardMarkedCells = store.markedCells[card.id] || []}
                {@const cardWinningCells = store.winningCells[card.id]}
                {@const shouldHighlight = store.gameState?.settings.allowHighlightCalledNumbers && store.myPlayer?.highlightCalledNumbers}
                <BingoCard
                  {card}
                  markedCells={cardMarkedCells}
                  winningCells={cardWinningCells}
                  calledNumbers={store.gameState?.calledNumbers ?? []}
                  highlightCalled={shouldHighlight ?? false}
                  onMark={(row, col) => handleMarkCell(card.id, row, col)}
                  disabled={!isPlaying}
                />
              {/each}
            </div>

            <!-- Bingo button -->
            <BingoButton
              canClaim={store.canClaimBingo.can}
              onClaim={handleClaimBingo}
              disabled={!isPlaying}
            />

            <!-- View all numbers button -->
            <button
              type="button"
              class="btn btn-secondary w-full"
              onclick={() => showNumberBoard = true}
            >
              {$_('game.viewAllNumbers')}
            </button>
          </div>
        {/if}
      </div>

      <!-- Right column: Number board (desktop) -->
      {#if !store.isHost}
        <div class="hidden lg:block">
          <PlayerList
            players={store.allPlayers}
            currentPlayerId={store.myPlayerId}
            isHost={store.isHost}
          />
        </div>
      {/if}

      <!-- Mobile host controls (when host tab is active) -->
      {#if store.isHost && activeTab === 'host'}
        <div class="lg:hidden space-y-4">
          {#if store.gameState}
            <HostControls
              phase={store.gameState.phase}
              settings={store.gameState.settings}
              currentPattern={store.gameState.currentPattern}
              remainingNumbers={store.gameState.remainingNumbers.length}
              onStart={() => store.startGame()}
              onPause={() => store.pauseGame()}
              onResume={() => store.resumeGame()}
              onReset={() => store.resetGame()}
              onCallNext={() => store.callNext()}
              onToggleAutoCall={(enabled) => store.toggleAutoCall(enabled)}
              onToggleAllowHighlight={(enabled) => store.toggleAllowHighlight(enabled)}
              onSetSpeed={(ms) => store.setSpeed(ms)}
              onSetPattern={(pattern) => store.setPattern(pattern)}
              onCreateTimeout={(seconds) => store.createTimeout(seconds)}
              onEndTimeout={() => store.endTimeout()}
            />
          {/if}
          <PlayerList
            players={store.allPlayers}
            currentPlayerId={store.myPlayerId}
            isHost={store.isHost}
            onKick={(id) => store.kickPlayer(id)}
          />
        </div>
      {/if}
    </div>
  </div>

  <!-- Modals -->
  <NumberBoardModal
    calledNumbers={store.gameState?.calledNumbers ?? []}
    currentNumber={store.gameState?.currentNumber ?? null}
    isOpen={showNumberBoard}
    onClose={() => showNumberBoard = false}
  />

  <WinnerAnnouncement
    winners={store.gameState?.winners ?? []}
    currentPlayerId={store.myPlayerId}
    isOpen={showWinners}
    onClose={() => showWinners = false}
  />
{/if}

<!-- Leave confirmation modal (always rendered outside the main conditional) -->
<ConfirmModal
  isOpen={showLeaveConfirm}
  title={$_('navigation.leaveTitle')}
  message={leaveMessage}
  confirmText={$_('navigation.leave')}
  cancelText={$_('navigation.stay')}
  onConfirm={handleLeaveConfirm}
  onCancel={handleLeaveCancel}
/>
