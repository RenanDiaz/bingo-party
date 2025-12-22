<script lang="ts">
  import type { Pattern } from '../../../shared/types';
  import { GRID_SIZE } from '../../../shared/constants';

  interface Props {
    pattern: Pattern;
    size?: 'small' | 'medium' | 'large';
  }

  let { pattern, size = 'medium' }: Props = $props();

  const sizeClasses = {
    small: 'w-10 h-10',
    medium: 'w-16 h-16',
    large: 'w-24 h-24',
  };

  const cellSizeClasses = {
    small: 'w-1.5 h-1.5',
    medium: 'w-2.5 h-2.5',
    large: 'w-4 h-4',
  };
</script>

<div class="{sizeClasses[size]} flex items-center justify-center">
  <div class="grid grid-cols-5 gap-0.5">
    {#each { length: GRID_SIZE } as _, row}
      {#each { length: GRID_SIZE } as _, col}
        {@const isRequired = pattern.grid[row]?.[col] ?? false}
        {@const isCenter = row === 2 && col === 2}
        <div
          class="{cellSizeClasses[size]} rounded-sm {isRequired ? 'bg-accent-gold' : isCenter ? 'bg-white/30' : 'bg-white/10'}"
        ></div>
      {/each}
    {/each}
  </div>
</div>
