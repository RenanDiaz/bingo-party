<script lang="ts">
  import { _ } from 'svelte-i18n';
  import type { BingoCard } from '../../../shared/types';
  import { COLUMNS } from '../../../shared/types';
  import { COLUMN_COLORS, GRID_SIZE } from '../../../shared/constants';

  interface Props {
    card: BingoCard;
    selected?: boolean;
    onSelect?: () => void;
    disabled?: boolean;
  }

  let {
    card,
    selected = false,
    onSelect,
    disabled = false,
  }: Props = $props();
</script>

<button
  type="button"
  class="card p-2 w-full max-w-[160px] transition-all duration-200 {selected ? 'ring-2 ring-accent-gold shadow-lg shadow-accent-gold/20' : ''} {disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}"
  onclick={onSelect}
  {disabled}
>
  {#if selected}
    <div class="absolute -top-2 -right-2 bg-accent-gold text-primary-900 text-xs font-bold px-2 py-0.5 rounded-full">
      {$_('cardSelector.selected')}
    </div>
  {/if}

  <!-- Mini header -->
  <div class="grid grid-cols-5 gap-0.5 mb-0.5">
    {#each COLUMNS as column}
      <div class="h-4 flex items-center justify-center font-bold text-white text-[10px] rounded {COLUMN_COLORS[column]}">
        {column}
      </div>
    {/each}
  </div>

  <!-- Mini grid -->
  <div class="grid grid-cols-5 gap-0.5">
    {#each { length: GRID_SIZE } as _, row}
      {#each { length: GRID_SIZE } as _, col}
        {@const cellValue = card.grid[row][col]}
        <div
          class="h-5 flex items-center justify-center text-[9px] font-semibold rounded {cellValue === 'FREE' ? 'bg-accent-gold text-primary-900' : 'bg-white/90 text-primary-900'}"
        >
          {cellValue === 'FREE' ? '★' : cellValue}
        </div>
      {/each}
    {/each}
  </div>
</button>
