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
  <button
    type="button"
    class="btn-bingo w-full max-w-xs mx-auto block"
    onclick={onClaim}
    {disabled}
  >
    {$_('bingo.claimBingo')}
  </button>
{/if}
