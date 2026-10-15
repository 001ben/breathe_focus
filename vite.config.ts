import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
export default defineConfig({
  plugins: [svelte()], base: './', server: { host: '127.0.0.1' },
  build: { target: 'chrome116', rolldownOptions: {
    input: { popup: 'index.html', background: 'src/background.ts', audio: 'offscreen.html' },
    output: { entryFileNames: '[name].js', chunkFileNames: 'assets/[name]-[hash].js' },
  } },
});
