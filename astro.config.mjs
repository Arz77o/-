import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare'; //[cite: 3]

export default defineConfig({
  output: 'server', // Keeps Server-Side Rendering (SSR) enabled
  adapter: cloudflare(), // Switched from node()[cite: 3]
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  },
});