/**
 * Tiny shared store for the currently selected flavour.
 * Every switcher (hero, flavour cards, chip-dip) calls setFlavour();
 * everything that cares (3D jar, heat meter, bowl...) subscribes
 * with onFlavourChange().
 */
import { flavours, defaultFlavourIndex } from '../config/flavours.js';

let current = defaultFlavourIndex;
const listeners = new Set();

export const getFlavourIndex = () => current;
export const getFlavour = () => flavours[current];

/** Select a flavour by index or id. `source` lets listeners ignore their own echo. */
export function setFlavour(indexOrId, source = 'unknown') {
  const index = typeof indexOrId === 'string' ? flavours.findIndex((f) => f.id === indexOrId) : indexOrId;
  if (index < 0 || index >= flavours.length || index === current) return;
  current = index;
  applyAccent(flavours[index]);
  listeners.forEach((fn) => fn(flavours[index], index, source));
}

/** Subscribe; returns an unsubscribe function. */
export function onFlavourChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Pushes the flavour colours into CSS so the whole page re-tints. */
export function applyAccent(f) {
  const root = document.documentElement;
  root.style.setProperty('--accent', f.accent);
  root.style.setProperty('--accent-deep', f.accentDeep);
  root.style.setProperty('--salsa', f.salsa);
  root.dataset.flavour = f.id;
  root.dataset.heat = String(f.heat);
}
