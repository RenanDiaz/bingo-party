<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import '../app.css';
  import '../lib/i18n';
  import { initLocaleFromStorage } from '../lib/i18n';
  import { isLoading } from 'svelte-i18n';
  import LanguageSelector from '$lib/components/LanguageSelector.svelte';

  onMount(() => {
    initLocaleFromStorage();
  });

  let { children } = $props();
</script>

{#if $isLoading}
  <div class="min-h-screen flex items-center justify-center">
    <div class="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
  </div>
{:else}
  <div class="min-h-screen">
    <!-- Header -->
    <header class="fixed top-0 left-0 right-0 z-40 bg-primary-900/80 backdrop-blur-sm border-b border-white/10">
      <div class="container mx-auto px-4 h-14 flex items-center justify-between">
        <a href="/" class="flex items-center gap-2">
          <span class="text-2xl">🎰</span>
          <span class="font-bold text-xl text-white">BingoParty</span>
        </a>
        <LanguageSelector />
      </div>
    </header>

    <!-- Main content -->
    <main class="pt-14 min-h-screen">
      {@render children()}
    </main>
  </div>
{/if}
