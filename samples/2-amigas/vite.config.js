import { defineConfig } from 'vite';

// `npm run build`          → dist/           everything bundled (Netlify / Vercel)
// `npm run build:artifact` → dist-artifact/  Three.js + GSAP left external and
//                            loaded from jsDelivr via an import map (see scripts/make-artifact.mjs)
const isCdnLib = (id) => id === 'three' || id.startsWith('three/') || id === 'gsap' || id.startsWith('gsap/');

export default defineConfig(({ mode }) => ({
  base: './', // relative paths: the build works from any folder or sub-path
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 900,
    outDir: mode === 'artifact' ? 'dist-artifact' : 'dist',
    rollupOptions: mode === 'artifact' ? { external: isCdnLib } : {},
  },
}));
