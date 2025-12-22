<script lang="ts">
  import { _ } from 'svelte-i18n';
  import type { GamePhase, GameSettings, Pattern } from '../../../shared/types';
  import { MIN_CALL_INTERVAL, MAX_CALL_INTERVAL } from '../../../shared/constants';
  import PatternSelector from './PatternSelector.svelte';

  interface Props {
    phase: GamePhase;
    settings: GameSettings;
    currentPattern: Pattern;
    remainingNumbers: number;
    onStart: () => void;
    onPause: () => void;
    onResume: () => void;
    onReset: () => void;
    onCallNext: () => void;
    onToggleAutoCall: (enabled: boolean) => void;
    onSetSpeed: (intervalMs: number) => void;
    onSetPattern: (pattern: Pattern) => void;
    onCreateTimeout: (seconds: number) => void;
    onEndTimeout: () => void;
  }

  let {
    phase,
    settings,
    currentPattern,
    remainingNumbers,
    onStart,
    onPause,
    onResume,
    onReset,
    onCallNext,
    onToggleAutoCall,
    onSetSpeed,
    onSetPattern,
    onCreateTimeout,
    onEndTimeout,
  }: Props = $props();

  let showPatternSelector = $state(false);

  const speedSeconds = $derived(Math.round(settings.callInterval / 1000));

  function handleSpeedChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const seconds = parseInt(target.value, 10);
    onSetSpeed(seconds * 1000);
  }
</script>

<div class="card p-4 space-y-4">
  <h2 class="text-lg font-bold text-white flex items-center gap-2">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
    {$_('host.controls')}
  </h2>

  <!-- Game phase controls -->
  <div class="flex flex-wrap gap-2">
    {#if phase === 'lobby'}
      <button type="button" class="btn btn-success flex-1" onclick={onStart}>
        {$_('host.start')}
      </button>
    {:else if phase === 'playing'}
      <button type="button" class="btn btn-secondary flex-1" onclick={onPause}>
        {$_('host.pause')}
      </button>
    {:else if phase === 'paused'}
      <button type="button" class="btn btn-success flex-1" onclick={onResume}>
        {$_('host.resume')}
      </button>
    {:else if phase === 'timeout'}
      <button type="button" class="btn btn-primary flex-1" onclick={onEndTimeout}>
        {$_('host.endTimeout')}
      </button>
    {:else if phase === 'finished'}
      <button type="button" class="btn btn-primary flex-1" onclick={onReset}>
        {$_('host.reset')}
      </button>
    {/if}

    {#if phase !== 'lobby' && phase !== 'finished'}
      <button type="button" class="btn btn-danger" onclick={onReset}>
        {$_('host.reset')}
      </button>
    {/if}
  </div>

  <!-- Number calling controls -->
  {#if phase === 'playing'}
    <div class="space-y-3">
      <!-- Call next button -->
      <button
        type="button"
        class="btn btn-primary w-full py-3 text-lg"
        onclick={onCallNext}
        disabled={settings.autoCall || remainingNumbers === 0}
      >
        {$_('host.callNext')}
        <span class="text-sm opacity-70 ml-2">
          ({$_('game.numbersRemaining', { values: { count: remainingNumbers } })})
        </span>
      </button>

      <!-- Auto call toggle -->
      <div class="flex items-center justify-between">
        <span class="text-white/80">{$_('host.autoCall')}</span>
        <button
          type="button"
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {settings.autoCall ? 'bg-primary-500' : 'bg-white/20'}"
          onclick={() => onToggleAutoCall(!settings.autoCall)}
          aria-label={$_('host.autoCall')}
          aria-pressed={settings.autoCall}
        >
          <span
            class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {settings.autoCall ? 'translate-x-6' : 'translate-x-1'}"
          ></span>
        </button>
      </div>

      <!-- Speed slider -->
      {#if settings.autoCall}
        <div class="space-y-1">
          <div class="flex justify-between text-sm">
            <span class="text-white/70">{$_('host.speed')}</span>
            <span class="text-white">{$_('host.seconds', { values: { count: speedSeconds } })}</span>
          </div>
          <input
            type="range"
            min={MIN_CALL_INTERVAL / 1000}
            max={MAX_CALL_INTERVAL / 1000}
            value={speedSeconds}
            onchange={handleSpeedChange}
            class="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
        </div>
      {/if}

      <!-- Timeout button -->
      <button
        type="button"
        class="btn btn-secondary w-full"
        onclick={() => onCreateTimeout(60)}
      >
        {$_('host.timeout')} (60s)
      </button>
    </div>
  {/if}

  <!-- Pattern selection -->
  {#if phase === 'lobby' || phase === 'paused'}
    <div class="space-y-2">
      <button
        type="button"
        class="btn btn-secondary w-full flex items-center justify-between"
        onclick={() => showPatternSelector = !showPatternSelector}
      >
        <span>{$_('pattern.selectPattern')}</span>
        <span class="text-sm opacity-70">{currentPattern.name}</span>
      </button>

      {#if showPatternSelector}
        <PatternSelector
          {currentPattern}
          onSelect={(pattern) => {
            onSetPattern(pattern);
            showPatternSelector = false;
          }}
        />
      {/if}
    </div>
  {/if}
</div>
