<script lang="ts">
  import { _ } from 'svelte-i18n';
  import type { BingoCard } from '../../../shared/types';
  import { MAX_CARDS, MIN_CARDS } from '../../../shared/constants';
  import CardPreview from './CardPreview.svelte';

  interface Props {
    cards: BingoCard[];
    selectedIds: string[];
    onSelect: (cardIds: string[]) => void;
    onRegenerate: () => void;
    onConfirm: () => void;
    disabled?: boolean;
  }

  let {
    cards,
    selectedIds,
    onSelect,
    onRegenerate,
    onConfirm,
    disabled = false,
  }: Props = $props();

  function toggleCard(cardId: string) {
    if (selectedIds.includes(cardId)) {
      onSelect(selectedIds.filter(id => id !== cardId));
    } else if (selectedIds.length < MAX_CARDS) {
      onSelect([...selectedIds, cardId]);
    }
  }

  const canConfirm = $derived(selectedIds.length >= MIN_CARDS);
</script>

<div class="space-y-4">
  <div class="text-center">
    <h2 class="text-xl font-bold text-white">{$_('cardSelector.title')}</h2>
    <p class="text-white/70 text-sm">{$_('cardSelector.subtitle')}</p>
    <p class="text-white/50 text-xs mt-1">
      {$_('game.playingWith', { values: { count: selectedIds.length } })}
    </p>
  </div>

  <!-- Card grid -->
  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 justify-items-center">
    {#each cards as card (card.id)}
      <CardPreview
        {card}
        selected={selectedIds.includes(card.id)}
        onSelect={() => toggleCard(card.id)}
        disabled={disabled || (!selectedIds.includes(card.id) && selectedIds.length >= MAX_CARDS)}
      />
    {/each}
  </div>

  <!-- Actions -->
  <div class="flex flex-col sm:flex-row gap-2 justify-center">
    <button
      type="button"
      class="btn btn-secondary"
      onclick={onRegenerate}
      disabled={disabled}
    >
      {$_('cardSelector.regenerate')}
    </button>
    <button
      type="button"
      class="btn btn-primary"
      onclick={onConfirm}
      disabled={!canConfirm || disabled}
    >
      {$_('cardSelector.confirm')}
    </button>
  </div>
</div>
