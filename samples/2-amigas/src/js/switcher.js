/**
 * Flavour switcher: a keyboard-friendly radio group.
 * Tab moves focus into the group, arrow keys move between
 * flavours (and select them), like a native radio group.
 * Any number of switchers can exist; they all stay in sync.
 */
import { flavours } from '../config/flavours.js';
import { getFlavourIndex, setFlavour, onFlavourChange } from './state.js';

export function createSwitcher(el) {
  el.setAttribute('role', 'radiogroup');
  el.innerHTML = flavours
    .map(
      (f, i) => `<button type="button" role="radio" class="switcher__opt" data-index="${i}" style="--opt:${f.accent}">
        <span class="switcher__dot" aria-hidden="true"></span>
        <span class="switcher__name">${f.name}</span>
        <span class="switcher__heat" aria-hidden="true">${'●'.repeat(f.heat)}</span>
        <span class="visually-hidden">, heat ${f.heat} of 5</span>
      </button>`
    )
    .join('') + '<span class="switcher__pill" aria-hidden="true"></span>';

  const buttons = [...el.querySelectorAll('.switcher__opt')];
  const pill = el.querySelector('.switcher__pill');

  // Slide the highlight pill under the selected option.
  const placePill = () => {
    const b = buttons[getFlavourIndex()];
    if (!b || !b.offsetWidth) return;
    pill.style.width = `${b.offsetWidth}px`;
    pill.style.height = `${b.offsetHeight}px`;
    pill.style.transform = `translate(${b.offsetLeft}px, ${b.offsetTop}px)`;
  };

  const sync = () => {
    const cur = getFlavourIndex();
    buttons.forEach((b, i) => {
      b.setAttribute('aria-checked', String(i === cur));
      b.tabIndex = i === cur ? 0 : -1;
    });
    placePill();
  };

  buttons.forEach((b, i) => {
    b.addEventListener('click', () => setFlavour(i, 'switcher'));
    b.addEventListener('keydown', (e) => {
      const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      let next = null;
      if (dir) next = (i + dir + buttons.length) % buttons.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = buttons.length - 1;
      if (next === null) return;
      e.preventDefault();
      setFlavour(next, 'switcher');
      buttons[next].focus();
    });
  });

  onFlavourChange(sync);
  new ResizeObserver(placePill).observe(el);
  sync();
}
