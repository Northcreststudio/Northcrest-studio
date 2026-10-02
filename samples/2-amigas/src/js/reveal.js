/**
 * Scroll reveals: content eases up into place as it enters the screen.
 * Content is fully visible without JS and for reduced motion; the
 * animation starts from a visible resting state (slight offset only).
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './env.js';

export function initReveals() {
  if (prefersReducedMotion()) return;
  const groups = [
    '.section-head > *',
    '.flavour-card',
    '.story__copy > *',
    '.story__shot',
    '.milestone',
    '.dip__copy > *',
    '.recipe',
    '.find__copy > *',
    '.map',
    '.contact__grid > *',
  ];
  groups.forEach((sel) => {
    const els = gsap.utils.toArray(sel);
    if (!els.length) return;
    ScrollTrigger.batch(els, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => gsap.from(batch, { y: 28, opacity: 0.2, duration: 1.1, ease: 'power3.out', stagger: 0.07, clearProps: 'transform,opacity' }),
    });
  });
}
