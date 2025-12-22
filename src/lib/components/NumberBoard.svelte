<script lang="ts">
  import { COLUMNS, type BingoColumn } from '../../../shared/types';
  import { COLUMN_COLORS, COLUMN_TEXT_COLORS } from '../../../shared/constants';

  interface Props {
    calledNumbers: number[];
    currentNumber: number | null;
  }

  let { calledNumbers, currentNumber }: Props = $props();

  const calledSet = $derived(new Set(calledNumbers));

  // Generate numbers for each column
  const columnNumbers: Record<BingoColumn, number[]> = {
    B: Array.from({ length: 15 }, (_, i) => i + 1),
    I: Array.from({ length: 15 }, (_, i) => i + 16),
    N: Array.from({ length: 15 }, (_, i) => i + 31),
    G: Array.from({ length: 15 }, (_, i) => i + 46),
    O: Array.from({ length: 15 }, (_, i) => i + 61),
  };

  function getCellClass(num: number): string {
    if (num === currentNumber) {
      return 'number-board-cell number-board-cell-current';
    }
    if (calledSet.has(num)) {
      return 'number-board-cell number-board-cell-called';
    }
    return 'number-board-cell number-board-cell-uncalled';
  }
</script>

<div class="card p-3">
  <div class="grid grid-cols-5 gap-2">
    {#each COLUMNS as column}
      <div class="space-y-1">
        <!-- Column header -->
        <div
          class="w-full aspect-square flex items-center justify-center font-bold text-white rounded-lg text-lg {COLUMN_COLORS[column]}"
        >
          {column}
        </div>

        <!-- Numbers in column -->
        {#each columnNumbers[column] as num}
          <div class={getCellClass(num)}>
            {num}
          </div>
        {/each}
      </div>
    {/each}
  </div>
</div>
