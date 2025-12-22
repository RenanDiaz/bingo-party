<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';

  let playerName = $state('');
  let roomCode = $state('');
  let mode = $state<'create' | 'join' | null>(null);
  let loading = $state(false);
  let error = $state('');

  function generateRoomId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async function handleSubmit() {
    if (playerName.trim().length < 2) {
      error = $_('errors.nameTooShort');
      return;
    }

    error = '';
    loading = true;

    // Store player name in localStorage
    if (browser) {
      localStorage.setItem('bingo-player-name', playerName.trim());
    }

    try {
      if (mode === 'create') {
        const roomId = generateRoomId();
        await goto(`/game/${roomId}?name=${encodeURIComponent(playerName.trim())}&host=1`);
      } else if (mode === 'join') {
        if (!roomCode.trim()) {
          error = $_('errors.roomNotFound');
          loading = false;
          return;
        }
        await goto(`/game/${roomCode.trim().toUpperCase()}?name=${encodeURIComponent(playerName.trim())}`);
      }
    } catch (e) {
      console.error('Navigation failed:', e);
      error = $_('errors.navigationFailed') || 'Failed to navigate. Please try again.';
      loading = false;
    }
  }

  function handleModeSelect(selectedMode: 'create' | 'join') {
    mode = selectedMode;
    error = '';
  }

  // Load saved name
  $effect(() => {
    if (browser) {
      const savedName = localStorage.getItem('bingo-player-name');
      if (savedName) {
        playerName = savedName;
      }
    }
  });
</script>

<svelte:head>
  <title>{$_('app.name')} - {$_('app.tagline')}</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)]">
  <div class="text-center mb-8">
    <div class="text-6xl mb-4 animate-bounce-in">🎰</div>
    <h1 class="text-4xl md:text-5xl font-bold text-white mb-2">
      {$_('app.name')}
    </h1>
    <p class="text-white/70 text-lg">
      {$_('app.tagline')}
    </p>
  </div>

  <div class="card p-6 w-full max-w-md space-y-6">
    {#if mode === null}
      <!-- Mode selection -->
      <div class="space-y-3">
        <button
          type="button"
          class="btn btn-primary w-full py-4 text-lg"
          onclick={() => handleModeSelect('create')}
        >
          {$_('landing.createGame')}
        </button>
        <button
          type="button"
          class="btn btn-secondary w-full py-4 text-lg"
          onclick={() => handleModeSelect('join')}
        >
          {$_('landing.joinGame')}
        </button>
      </div>
    {:else}
      <!-- Form -->
      <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
        <div>
          <label for="playerName" class="block text-white/70 text-sm mb-1">
            {$_('landing.enterName')}
          </label>
          <input
            id="playerName"
            type="text"
            bind:value={playerName}
            placeholder={$_('landing.namePlaceholder')}
            class="input"
            maxlength={20}
            required
          />
        </div>

        {#if mode === 'join'}
          <div>
            <label for="roomCode" class="block text-white/70 text-sm mb-1">
              {$_('landing.enterRoomCode')}
            </label>
            <input
              id="roomCode"
              type="text"
              bind:value={roomCode}
              placeholder={$_('landing.roomCodePlaceholder')}
              class="input uppercase"
              maxlength={6}
              required
            />
          </div>
        {/if}

        {#if error}
          <p class="text-red-400 text-sm">{error}</p>
        {/if}

        <div class="flex gap-2">
          <button
            type="button"
            class="btn btn-secondary flex-1"
            onclick={() => { mode = null; error = ''; }}
            disabled={loading}
          >
            {$_('landing.back')}
          </button>
          <button
            type="submit"
            class="btn btn-primary flex-1"
            disabled={loading}
          >
            {#if loading}
              {mode === 'create' ? $_('landing.creating') : $_('landing.joining')}
            {:else}
              {$_('landing.play')}
            {/if}
          </button>
        </div>
      </form>
    {/if}
  </div>

  <!-- Features -->
  <div class="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-center max-w-2xl">
    <div class="card p-4">
      <div class="text-3xl mb-2">🎯</div>
      <p class="text-white/70 text-sm">{$_('landing.features.patterns')}</p>
    </div>
    <div class="card p-4">
      <div class="text-3xl mb-2">👥</div>
      <p class="text-white/70 text-sm">{$_('landing.features.multiplayer')}</p>
    </div>
    <div class="card p-4">
      <div class="text-3xl mb-2">📱</div>
      <p class="text-white/70 text-sm">{$_('landing.features.mobile')}</p>
    </div>
    <div class="card p-4">
      <div class="text-3xl mb-2">🌎</div>
      <p class="text-white/70 text-sm">{$_('landing.features.languages')}</p>
    </div>
  </div>
</div>
