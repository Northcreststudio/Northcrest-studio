/**
 * Device + preference checks shared across the site.
 * Used to scale down effects on phones and calm things down
 * for people who prefer reduced motion.
 */
const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

/** True when the visitor has asked their OS for less motion. Live value. */
export const prefersReducedMotion = () => reducedQuery.matches;

/** Run `fn(isReduced)` whenever the reduced-motion preference changes. */
export const onReducedMotionChange = (fn) => reducedQuery.addEventListener('change', (e) => fn(e.matches));

/** Phones / touch-first devices get lighter 3D and fewer particles. */
export const isMobile = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;

/** Rough "this device is not a beast" signal. */
export const isLowPower = isMobile || (navigator.hardwareConcurrency || 8) <= 4;

/** Device pixel ratio, capped so phones do not render 9x the pixels. */
export const cappedDPR = () => Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;
/** Maps v from [a,b] to [0,1], clamped. */
export const range = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
export const smooth = (t) => t * t * (3 - 2 * t);

/** Calls `onChange(visible)` as an element enters/leaves the viewport. */
export function watchVisibility(el, onChange, rootMargin = '100px') {
  const io = new IntersectionObserver(([entry]) => onChange(entry.isIntersecting), { rootMargin });
  io.observe(el);
  return () => io.disconnect();
}
