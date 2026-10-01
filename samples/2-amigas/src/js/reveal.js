/**
 * Scroll reveals: elements with [data-reveal] (and section
 * headings) pop up as they enter the screen. Skipped entirely
 * for reduced motion; content is always visible without JS.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './env.js';

export function initReveals() {
  if (prefersReducedMotion()) return;
  const groups = [
    ['.section-head > *', { y: 30 }],
    ['.flavour-card', { y: 60, rotation: (i) => [-4, 2, -2][i % 3] }],
    ['.story__art', { scale: 0.85, rotation: -4 }],
    ['.story__copy > *', { y: 30 }],
    ['.milestone', { y: 40 }],
    ['.dip__copy > *', { y: 30 }],
    ['.dip__play', { scale: 0.9 }],
    ['.recipe', { y: 60, rotation: (i) => (i % 2 ? 3 : -3) }],
    ['.find__copy > *', { y: 30 }],
    ['.map', { scale: 0.92, rotation: 2 }],
    ['.contact__grid > *', { y: 40 }],
  ];
  groups.forEach(([sel, from]) => {
    const els = gsap.utils.toArray(sel);
    if (!els.length) return;
    ScrollTrigger.batch(els, {
      start: 'top 88%',
      once: true,
      onEnter: (batch) =>
        gsap.from(batch, { ...from, opacity: 0, duration: 0.8, ease: 'back.out(1.4)', stagger: 0.08, clearProps: 'transform,opacity' }),
    });
  });
}
