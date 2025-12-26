<script lang="ts">
  import { _ } from 'svelte-i18n';

  interface Props {
    canClaim: boolean;
    onClaim: () => void;
    disabled?: boolean;
  }

  let { canClaim, onClaim, disabled = false }: Props = $props();
</script>

{#if canClaim}
  <div class="fixed bottom-6 left-0 right-0 z-50 px-4 pointer-events-none">
    <button
      type="button"
      class="btn-bingo w-full max-w-xs mx-auto block pointer-events-auto shadow-[0_0_30px_rgba(251,191,36,0.5)]"
      onclick={onClaim}
      {disabled}
    >
      {$_('bingo.claimBingo')}
    </button>
  </div>
{/if}
