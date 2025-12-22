import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		fs: {
			// Allow serving files from the shared directory (used by both frontend and PartyKit)
			allow: ['..']
		}
	}
});
