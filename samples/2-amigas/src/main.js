/**
 * 2 Amigas: entry point.
 * Paints the page from the config files, wires up the
 * interactive sections, then lazy-loads the 3D stage.
 */
import './styles/tokens.css';
import './styles/main.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getFlavour, getFlavourIndex, applyAccent, onFlavourChange } from './js/state.js';
import { renderSections } from './js/sections.js';
import { initNav } from './js/nav.js';
import { createSwitcher } from './js/switcher.js';
import { initFlavoursSection } from './js/flavoursSection.js';
import { initChipDip } from './js/chipDip.js';
import { initSignup } from './js/signup.js';
import { initReveals } from './js/reveal.js';
import { miniJar } from './js/illustrations.js';
import { loadingLines } from './config/content.js';
import { prefersReducedMotion, onReducedMotionChange } from './js/env.js';

gsap.registerPlugin(ScrollTrigger);

const loader = startLoader();

applyAccent(getFlavour());
renderSections();
initNav();
document.querySelectorAll('[data-switcher]').forEach(createSwitcher);
initFlavoursSection();
initChipDip();
initSignup();
initReveals();
document.documentElement.classList.toggle('reduced-motion', prefersReducedMotion());
onReducedMotionChange((r) => document.documentElement.classList.toggle('reduced-motion', r));

boot3D().finally(() => loader.done());

/** Lazy-loads Three.js and the jar scene. Falls back to an SVG jar without WebGL. */
async function boot3D() {
  const host = document.getElementById('jar-canvas');
  const slot = document.querySelector('[data-jar-slot]');
  // No WebGL? Draw an illustrated jar into the hero slot instead.
  const showFallback = () => {
    document.documentElement.classList.add('no-webgl');
    host.removeAttribute('role');
    host.removeAttribute('aria-label');
    const paint = () => (slot.innerHTML = miniJar(getFlavour()));
    paint();
    onFlavourChange(paint);
  };

  if (!hasWebGL()) return showFallback();
  try {
    loader.progress(0.35);
    const { createStage } = await import('./js/three/stage.js');
    loader.progress(0.7);
    const stage = await createStage({
      host,
      slot,
      stageEl: document.querySelector('.stage'),
      captionsEl: document.querySelector('[data-explode-captions]'),
      flavourIndex: getFlavourIndex(),
    });
    onFlavourChange((_, i) => stage.setFlavour(i));
    loader.progress(1);
    document.documentElement.classList.add('gl-ready');
    // Layout may have shifted while fonts/3D loaded.
    requestAnimationFrame(() => ScrollTrigger.refresh());
  } catch (err) {
    console.warn('3D stage failed, showing illustrated jar instead.', err);
    showFallback();
  }
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Fun loading screen: cycles kitchen lines and fills a progress bar. */
function startLoader() {
  const el = document.getElementById('loader');
  const line = el.querySelector('[data-loader-line]');
  const bar = el.querySelector('[data-loader-bar]');
  const started = performance.now();
  let i = 0;
  const timer = setInterval(() => {
    i = (i + 1) % loadingLines.length;
    line.textContent = loadingLines[i];
  }, 700);
  document.documentElement.classList.add('is-loading');
  let finished = false;
  const api = {
    progress: (p) => (bar.style.transform = `scaleX(${p})`),
    done() {
      if (finished) return;
      finished = true;
      // Keep the animation on screen long enough to be enjoyed, not endured.
      const wait = Math.max(0, 900 - (performance.now() - started));
      setTimeout(() => {
        clearInterval(timer);
        api.progress(1);
        el.classList.add('is-done');
        document.documentElement.classList.remove('is-loading');
        document.documentElement.classList.add('is-loaded');
        setTimeout(() => el.remove(), 900);
      }, wait);
    },
  };
  api.progress(0.12);
  // Never trap anyone behind the loader.
  setTimeout(api.done, 9000);
  return api;
}
