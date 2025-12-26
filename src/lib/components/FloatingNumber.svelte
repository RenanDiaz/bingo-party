<script lang="ts">
  import { getColumnForNumber, formatNumber } from '../../../shared/types';
  import { getColumnColorClass } from '../utils/numberFormatter';

  interface Props {
    currentNumber: number | null;
  }

  let { currentNumber }: Props = $props();

  const column = $derived(currentNumber ? getColumnForNumber(currentNumber) : null);
  const colorClass = $derived(column ? getColumnColorClass(column) : 'bg-white/20');
  const formatted = $derived(currentNumber ? formatNumber(currentNumber) : '');
</script>

{#if currentNumber}
  <div class="fixed top-16 left-1/2 -translate-x-1/2 z-40 md:hidden pointer-events-none">
    <div
      class="flex items-center justify-center w-14 h-14 rounded-xl {colorClass} shadow-lg animate-pop"
    >
      <span class="text-2xl font-bold text-white drop-shadow-md">
        {formatted}
      </span>
    </div>
  </div>
{/if}
