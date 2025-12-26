<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { locale } from 'svelte-i18n';
  import type { Pattern } from '../../../shared/types';
  import PatternPreview from './PatternPreview.svelte';

  interface Props {
    pattern: Pattern;
    changedBy: string;
    isOpen?: boolean;
    onClose?: () => void;
  }

  let { pattern, changedBy, isOpen = true, onClose }: Props = $props();

  const patternName = $derived(
    $locale?.startsWith('es') && pattern.nameEs ? pattern.nameEs : pattern.name
  );

  const patternDescription = $derived(
    $locale?.startsWith('es') && pattern.descriptionEs
      ? pattern.descriptionEs
      : pattern.description
  );
</script>

{#if isOpen}
  <div
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
    role="dialog"
    aria-modal="true"
  >
    <div class="card p-6 max-w-sm w-full text-center space-y-4 animate-bounce-in">
      <!-- Alert icon -->
      <div class="text-5xl">🎯</div>

      <!-- Title -->
      <h2 class="text-xl font-bold text-accent-gold">
        {$_('pattern.changed')}
      </h2>

      <!-- Changed by info -->
      <p class="text-primary-200 text-sm">
        {$_('pattern.changedBy', { values: { name: changedBy } })}
      </p>

      <!-- Pattern preview -->
      <div class="flex flex-col items-center gap-3 py-4">
        <PatternPreview {pattern} size="large" />
        <div>
          <div class="text-lg font-semibold text-white">
            {patternName}
          </div>
          {#if patternDescription}
            <div class="text-sm text-primary-300">
              {patternDescription}
            </div>
          {/if}
        </div>
      </div>

      <!-- Close button -->
      <button
        type="button"
        class="btn btn-primary w-full"
        onclick={onClose}
      >
        {$_('common.understood')}
      </button>
    </div>
  </div>
{/if}
