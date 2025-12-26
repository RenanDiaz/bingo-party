<script lang="ts">
  import { _ } from 'svelte-i18n';
  import type { Pattern } from '../../../shared/types';
  import { PRESET_PATTERNS } from '../../../shared/patterns';
  import { locale } from '../i18n';
  import PatternPreview from './PatternPreview.svelte';

  interface Props {
    currentPattern: Pattern;
    onSelect: (pattern: Pattern) => void;
  }

  let { currentPattern, onSelect }: Props = $props();
</script>

<div class="space-y-3 max-h-80 overflow-y-auto scrollbar-thin p-1">
  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
    {#each PRESET_PATTERNS as pattern (pattern.id)}
      <button
        type="button"
        class="card p-2 text-left transition-all {currentPattern.id === pattern.id ? 'ring-2 ring-accent-gold' : 'hover:bg-white/5'}"
        onclick={() => onSelect(pattern)}
      >
        <div class="flex items-center gap-2">
          <PatternPreview {pattern} size="small" />
          <div class="flex-1 min-w-0">
            <p class="text-white text-sm font-medium truncate">
              {$locale?.startsWith('es') && pattern.nameEs ? pattern.nameEs : pattern.name}
            </p>
            {#if pattern.description}
              <p class="text-white/50 text-xs truncate">
                {$locale?.startsWith('es') && pattern.descriptionEs ? pattern.descriptionEs : pattern.description}
              </p>
            {/if}
          </div>
        </div>
      </button>
    {/each}
  </div>
</div>
