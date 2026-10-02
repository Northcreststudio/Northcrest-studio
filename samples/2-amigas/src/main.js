/**
 * 2 Amigas: entry point.
 * Paints the page from the config files, wires up the interactive
 * sections, then lazy-loads the 3D stage (which also renders the
 * product shots used further down the page).
 */
import './styles/tokens.css';
import './styles/main.css';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import gsap from 'gsap';
import { getFlavour, getFlavourIndex, applyAccent, onFlavourChange } from './js/state.js';
import { renderSections } from './js/sections.js';
import { initNav } from './js/nav.js';
import { createSwitcher } from './js/switcher.js';
import { initFlavoursSection, setProductShots } from './js/flavoursSection.js';
import { initChipDip } from './js/chipDip.js';
import { initSignup } from './js/signup.js';
import { initReveals } from './js/reveal.js';
import { loadingLines } from './config/content.js';
import { prefersReducedMotion, onReducedMotionChange } from './js/env.js';

gsap.registerPlugin(ScrollTrigger);

const loader = startLoader();
const webgl = hasWebGL();

applyAccent(getFlavour());
renderSections();
initNav();
document.querySelectorAll('[data-switcher]').forEach(createSwitcher);
initFlavoursSection();
initChipDip({ webgl });
initSignup();
initReveals();
document.documentElement.classList.toggle('reduced-motion', prefersReducedMotion());
onReducedMotionChange((r) => document.documentElement.classList.toggle('reduced-motion', r));

boot3D().finally(() => loader.done());

/** Lazy-loads Three.js and the jar scene. Without WebGL the page stays fully readable. */
async function boot3D() {
  if (!webgl) {
    document.documentElement.classList.add('no-webgl');
    return;
  }
  try {
    loader.progress(0.25);
    const { createStage } = await import('./js/three/stage.js');
    loader.progress(0.4);
    const stage = await createStage({
      host: document.getElementById('jar-canvas'),
      slot: document.querySelector('[data-jar-slot]'),
      stageEl: document.querySelector('.stage'),
      captionsEl: document.querySelector('[data-explode-captions]'),
      progressEl: document.querySelector('[data-explode-bar]'),
      flavourIndex: getFlavourIndex(),
      onProgress: (p) => loader.progress(p),
    });
    setProductShots(stage.shots);
    onFlavourChange((_, i) => stage.setFlavour(i));
    loader.progress(1);
    document.documentElement.classList.add('gl-ready');
    requestAnimationFrame(() => ScrollTrigger.refresh());
  } catch (err) {
    console.warn('3D stage failed; the page continues without it.', err);
    document.documentElement.classList.add('no-webgl');
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

/** Loading screen: the seal, a kitchen line, and a real progress figure. */
function startLoader() {
  const el = document.getElementById('loader');
  const line = el.querySelector('[data-loader-line]');
  const bar = el.querySelector('[data-loader-bar]');
  const pct = el.querySelector('[data-loader-pct]');
  const started = performance.now();
  let i = 0;
  const timer = setInterval(() => {
    i = (i + 1) % loadingLines.length;
    line.textContent = loadingLines[i];
  }, 900);
  document.documentElement.classList.add('is-loading');
  let finished = false;
  let shown = 0;
  const api = {
    progress(p) {
      shown = Math.max(shown, p);
      bar.style.transform = `scaleX(${shown})`;
      pct.textContent = `${Math.round(shown * 100)}%`;
    },
    done() {
      if (finished) return;
      finished = true;
      const wait = Math.max(0, 800 - (performance.now() - started));
      setTimeout(() => {
        clearInterval(timer);
        api.progress(1);
        el.classList.add('is-done');
        document.documentElement.classList.remove('is-loading');
        document.documentElement.classList.add('is-loaded');
        setTimeout(() => el.remove(), 1000);
      }, wait);
    },
  };
  api.progress(0.08);
  setTimeout(api.done, 15000); // never trap anyone behind the loader
  return api;
}
