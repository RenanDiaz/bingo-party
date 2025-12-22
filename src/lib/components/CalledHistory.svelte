<script lang="ts">
  import { _ } from 'svelte-i18n';
  import type { NumberCall } from '../../../shared/types';
  import { getColumnColorClass } from '../utils/numberFormatter';

  interface Props {
    callHistory: NumberCall[];
    maxDisplay?: number;
  }

  let { callHistory, maxDisplay = 10 }: Props = $props();

  const recentCalls = $derived(
    [...callHistory].reverse().slice(0, maxDisplay)
  );
</script>

<div class="space-y-2">
  <div class="flex items-center justify-between">
    <h3 class="text-white/70 text-sm font-medium">{$_('game.calledNumbers')}</h3>
    <span class="text-white/50 text-xs">
      {$_('game.numbersCalled', { values: { count: callHistory.length } })}
    </span>
  </div>

  <div class="flex flex-wrap gap-1 max-h-32 overflow-y-auto scrollbar-thin">
    {#each recentCalls as call, i (call.timestamp)}
      <div
        class="w-10 h-10 flex items-center justify-center rounded-lg font-semibold text-white text-sm {getColumnColorClass(call.column)} {i === 0 ? 'ring-2 ring-white ring-offset-2 ring-offset-primary-900' : 'opacity-80'}"
      >
        {call.number}
      </div>
    {/each}

    {#if callHistory.length === 0}
      <p class="text-white/40 text-sm italic">
        {$_('game.waitingForHost')}
      </p>
    {/if}
  </div>
</div>
