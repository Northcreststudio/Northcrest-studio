import { defineConfig } from 'vite';

// base: './' makes the build work from any folder or sub-path
// (Netlify, Vercel, a /samples/2-amigas/ path, even opened locally via preview).
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    assetsInlineLimit: 0, // keep the logo SVGs as real files (easy to find + swap)
    chunkSizeWarningLimit: 900,
  },
});
