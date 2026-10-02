/**
 * Chip-dip section (page side).
 * The 3D bowl scene (three/dip.js) is only downloaded and built when
 * the section gets close to the screen. This file handles the message,
 * the counter, the keyboard button and the "Crunch." caption.
 */
import gsap from 'gsap';
import { getFlavour, getFlavourIndex, onFlavourChange } from './state.js';
import { dip as dipCopy } from '../config/content.js';
import { prefersReducedMotion } from './env.js';

const $ = (sel, root = document) => root.querySelector(sel);

export function initChipDip({ webgl = true } = {}) {
  const play = $('[data-dip-play]');
  const msg = $('[data-dip-message]');
  const count = $('[data-dip-count]');
  const button = $('[data-dip-button]');
  const crunch = $('[data-dip-crunch]');
  let dips = 0;
  let lastMsg = -1;
  let scene = null;

  const pickMessage = (f) => {
    const list = f.dipMessages;
    let i = Math.floor(Math.random() * list.length);
    if (list.length > 1 && i === lastMsg) i = (i + 1) % list.length;
    lastMsg = i;
    return list[i];
  };

  const onDip = () => {
    dips++;
    count.textContent = dips;
    msg.textContent = pickMessage(getFlavour());
    if (!prefersReducedMotion()) gsap.fromTo(msg, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    // A hot salsa makes the bowl's table jolt a little.
    if (getFlavour().heat >= 5 && !prefersReducedMotion()) gsap.fromTo(play, { x: 0 }, { keyframes: [{ x: -4 }, { x: 3 }, { x: -2 }, { x: 0 }], duration: 0.35 });
  };
  const onEat = ({ x, y }) => {
    gsap.set(crunch, { left: x, top: y - 40, xPercent: -50, yPercent: -50 });
    gsap.fromTo(crunch, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, delay: 0.3, ease: 'power2.out', onComplete: () => gsap.to(crunch, { opacity: 0, duration: 0.5, delay: 0.5 }) });
  };

  msg.textContent = dipCopy.idleMessage;
  onFlavourChange((f, i) => {
    scene?.setFlavour(i);
    if (!dips) msg.textContent = dipCopy.idleMessage;
  });

  button.addEventListener('click', () => {
    if (!scene) return;
    scene.autoDip();
  });

  if (!webgl) {
    play.classList.add('is-fallback');
    button.disabled = true;
    return;
  }

  // Build the scene when the section is ~1 screen away.
  const io = new IntersectionObserver(
    async ([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      try {
        const { createDipScene } = await import('./three/dip.js');
        scene = createDipScene({ host: play, flavourIndex: getFlavourIndex(), onDip, onEat, onReady: () => play.classList.add('is-ready') });
      } catch (err) {
        console.warn('Chip-dip scene failed to start.', err);
        play.classList.add('is-fallback');
      }
    },
    { rootMargin: '100% 0px' }
  );
  io.observe(play);
}
