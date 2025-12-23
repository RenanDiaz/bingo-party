<script lang="ts">
  import { _ } from 'svelte-i18n';
  import type { BingoCard, CellValue } from '../../../shared/types';
  import { COLUMNS } from '../../../shared/types';
  import { COLUMN_COLORS, GRID_SIZE } from '../../../shared/constants';

  interface Props {
    card: BingoCard;
    markedCells: boolean[][];
    winningCells?: boolean[][];
    calledNumbers?: number[];
    highlightCalled?: boolean;
    onMark?: (row: number, col: number) => void;
    disabled?: boolean;
    compact?: boolean;
  }

  let {
    card,
    markedCells,
    winningCells = [],
    calledNumbers = [],
    highlightCalled = false,
    onMark,
    disabled = false,
    compact = false,
  }: Props = $props();

  const calledSet = $derived(new Set(calledNumbers));

  // Subscribe to translations at top level
  const freeLabel = $derived($_('bingo.free'));

  function handleCellClick(row: number, col: number) {
    if (disabled) return;

    const cellValue = card.grid[row][col];

    // Can't unmark FREE space
    if (cellValue === 'FREE') return;

    // Can only mark called numbers
    if (!markedCells[row][col] && !calledSet.has(cellValue)) return;

    onMark?.(row, col);
  }

  function getCellClass(row: number, col: number): string {
    const cellValue = card.grid[row][col];
    const isMarked = markedCells[row]?.[col] ?? false;
    const isWinning = winningCells[row]?.[col] ?? false;
    const isFree = cellValue === 'FREE';
    const isCalled = cellValue !== 'FREE' && calledSet.has(cellValue);

    if (isWinning) {
      return 'bingo-cell bingo-cell-winning';
    }
    if (isFree || isMarked) {
      return isFree
        ? 'bingo-cell bingo-cell-free'
        : 'bingo-cell bingo-cell-marked';
    }
    // Highlight called but unmarked numbers if the setting is enabled
    if (isCalled && !disabled && highlightCalled) {
      return 'bingo-cell bingo-cell-called ring-2 ring-accent-gold bg-accent-gold/20';
    }
    return 'bingo-cell bingo-cell-unmarked';
  }
</script>

<div class="card p-2 {compact ? 'max-w-[200px]' : 'max-w-[320px]'} w-full mx-auto">
  <!-- Header row with B-I-N-G-O -->
  <div class="grid grid-cols-5 gap-1 mb-1">
    {#each COLUMNS as column, i}
      <div
        class="aspect-square flex items-center justify-center font-bold text-white rounded-lg {COLUMN_COLORS[column]} {compact ? 'text-sm' : 'text-lg'}"
      >
        {column}
      </div>
    {/each}
  </div>

  <!-- Card grid -->
  <div class="grid grid-cols-5 gap-1">
    {#each { length: GRID_SIZE } as _, row}
      {#each { length: GRID_SIZE } as _, col}
        {@const cellValue = card.grid[row][col]}
        <button
          type="button"
          class={getCellClass(row, col)}
          class:text-xs={compact}
          class:text-lg={!compact}
          onclick={() => handleCellClick(row, col)}
          disabled={disabled}
          aria-label={cellValue === 'FREE' ? freeLabel : `${COLUMNS[col]}-${cellValue}`}
        >
          {#if cellValue === 'FREE'}
            <span class="text-xs font-bold">{freeLabel}</span>
          {:else}
            {cellValue}
          {/if}
        </button>
      {/each}
    {/each}
  </div>
</div>
