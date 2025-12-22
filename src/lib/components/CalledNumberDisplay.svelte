<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { getColumnForNumber, formatNumber } from '../../../shared/types';
  import { getColumnColorClass } from '../utils/numberFormatter';

  interface Props {
    currentNumber: number | null;
    animate?: boolean;
  }

  let { currentNumber, animate = true }: Props = $props();

  const column = $derived(currentNumber ? getColumnForNumber(currentNumber) : null);
  const colorClass = $derived(column ? getColumnColorClass(column) : 'bg-white/20');
  const formatted = $derived(currentNumber ? formatNumber(currentNumber) : '—');
</script>

<div class="text-center">
  <p class="text-white/70 text-sm mb-2">{$_('game.currentNumber')}</p>
  <div
    class="inline-flex items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-2xl {colorClass} shadow-xl {animate && currentNumber ? 'animate-pop' : ''}"
  >
    <span class="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
      {formatted}
    </span>
  </div>
</div>
