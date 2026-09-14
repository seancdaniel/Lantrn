import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const standalone = mode === 'standalone';
  return {
    // Relative for the inlined standalone bundle; absolute for a hosted deploy.
    base: standalone ? './' : '/',
    plugins: [react(), ...(standalone ? [viteSingleFile()] : [])],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    build: {
      outDir: standalone ? 'dist-standalone' : 'dist',
      target: 'es2020',
      cssCodeSplit: !standalone,
      assetsInlineLimit: standalone ? 100_000_000 : 4096,
    },
  };
});
