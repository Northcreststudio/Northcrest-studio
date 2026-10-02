/**
 * Fills the page with copy from src/config/content.js and builds the
 * static pieces (logos, recipe cards, map, contact details).
 */
import * as content from '../config/content.js';
import { flavours } from '../config/flavours.js';
import { setFlavour } from './state.js';
import { socialIcons, cityMap } from './illustrations.js';
import { heatPips } from './flavoursSection.js';
import { prefersReducedMotion } from './env.js';
import logoSvg from '../assets/logo.svg?raw';
import markSvg from '../assets/logo-mark.svg?raw';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const text = (sel, value) => $$(sel).forEach((el) => (el.textContent = value));

// Each inline copy of the logo needs its own <title> id to stay valid HTML.
let logoCount = 0;
const inlineLogo = (svg) => svg.replaceAll('amg-title', `amg-title-${logoCount++}`);

export function renderSections() {
  const { brand, hero, explode, marquee, flavoursSection, story, dip, recipes, findUs, contact, footer } = content;

  $$('[data-logo]').forEach((el) => (el.innerHTML = inlineLogo(logoSvg)));
  $$('[data-logo-mark]').forEach((el) => (el.innerHTML = markSvg));

  /* Hero */
  text('[data-hero-eyebrow]', hero.eyebrow);
  text('[data-hero-top]', hero.headlineTop);
  text('[data-hero-accent]', hero.headlineAccent);
  text('[data-hero-bottom]', hero.headlineBottom);
  text('[data-hero-body]', hero.body);
  text('[data-hero-hint] span', hero.dragHint);
  text('[data-scroll-cue] .scroll-cue__text', hero.scrollCue);

  /* Captions shown while the ingredients float */
  text('[data-explode-heading]', explode.heading);
  $('[data-explode-captions]').innerHTML = explode.captions
    .map((c, i) => `<li class="explode-caption"><span class="explode-caption__num">${i + 1} / ${explode.captions.length}</span><h3>${c.title}</h3><p>${c.text}</p></li>`)
    .join('');

  /* Facts ribbon */
  $('[data-marquee]').innerHTML = marquee.map((m) => `<li>${m}</li>`).join('');

  /* Flavours headings */
  text('[data-fl-eyebrow]', flavoursSection.eyebrow);
  text('[data-fl-heading]', flavoursSection.heading);
  text('[data-fl-body]', flavoursSection.body);
  text('[data-fd-ing-label]', flavoursSection.ingredientsLabel);
  text('[data-fd-pair-label]', flavoursSection.pairingLabel);

  /* Story */
  text('[data-st-eyebrow]', story.eyebrow);
  text('[data-st-heading]', story.heading);
  $('[data-st-paragraphs]').innerHTML = story.paragraphs.map((p) => `<p>${p}</p>`).join('');
  text('[data-st-sig]', `${story.signature}`);
  $('[data-st-milestones]').innerHTML = story.milestones
    .map((m) => `<li class="milestone"><span class="milestone__year">${m.year}</span><span class="milestone__text">${m.text}</span></li>`)
    .join('');

  /* Chip-dip copy */
  text('[data-dip-eyebrow]', dip.eyebrow);
  text('[data-dip-heading]', dip.heading);
  text('[data-dip-body]', dip.body);
  text('[data-dip-button]', dip.keyboardButton);
  text('[data-dip-count-label]', dip.counterLabel);

  /* Recipes: each card pairs with a jar (product shot fills in later) */
  text('[data-rc-eyebrow]', recipes.eyebrow);
  text('[data-rc-heading]', recipes.heading);
  $('[data-recipes]').innerHTML = recipes.items
    .map((r) => {
      const i = Math.max(0, flavours.findIndex((x) => x.id === r.flavourId));
      const f = flavours[i];
      return `<li class="recipe" style="--card:${f.accent}">
        <div class="recipe__head"><span class="recipe__time">${r.time}</span>${heatPips(f.heat)}</div>
        <h3>${r.title}</h3>
        <p>${r.text}</p>
        <button type="button" class="recipe__pair" data-pick-flavour="${f.id}">
          <span class="shot shot--thumb"><img data-shot="${i}" alt="" width="720" height="864" /></span>
          <span><span class="recipe__pair-label">Pairs with</span><strong>${f.name}</strong></span>
        </button>
      </li>`;
    })
    .join('');
  $$('[data-pick-flavour]').forEach((btn) =>
    btn.addEventListener('click', () => {
      setFlavour(btn.dataset.pickFlavour, 'recipe');
      document.getElementById('flavours').scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    })
  );

  /* Find us */
  text('[data-fu-eyebrow]', findUs.eyebrow);
  text('[data-fu-heading]', findUs.heading);
  text('[data-fu-body]', findUs.body);
  renderMap(findUs.locations);

  /* Contact: shown as text with copy buttons (mail/phone links are unreliable in embeds) */
  text('[data-ct-eyebrow]', contact.eyebrow);
  text('[data-ct-heading]', contact.heading);
  text('[data-ct-body]', contact.body);
  $('[data-signup-input]').placeholder = contact.placeholder;
  text('[data-signup-button]', contact.button);
  text('[data-ct-wholesale-heading]', contact.wholesaleHeading);
  text('[data-ct-wholesale-body]', contact.wholesaleBody);
  const copyRow = (value) => `<span class="copy-row"><span class="copy-row__value">${value}</span><button type="button" class="copy-btn" data-copy="${value}">Copy</button></span>`;
  $('[data-ct-wholesale-email]').innerHTML = copyRow(brand.wholesaleEmail);
  $('[data-ct-phone]').innerHTML = copyRow(brand.phone);
  $$('[data-copy]').forEach((b) =>
    b.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(b.dataset.copy);
        b.textContent = 'Copied';
      } catch {
        const range = document.createRange();
        range.selectNodeContents(b.previousElementSibling);
        const sel = getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        b.textContent = 'Selected';
      }
      setTimeout(() => (b.textContent = 'Copy'), 1600);
    })
  );
  $('[data-socials]').innerHTML = contact.socials
    .map((s) => `<li><a href="${s.href}" target="_blank" rel="noopener" aria-label="2 Amigas on ${s.label}">${socialIcons[s.network] || s.label}</a></li>`)
    .join('');

  /* Footer */
  $('[data-footer-links]').innerHTML = footer.links.map((l) => `<li><a href="${l.href}">${l.label}</a></li>`).join('');
  text('[data-footer-copy]', `© ${new Date().getFullYear()} ${brand.name}, ${brand.city}`);
  const credit = $('[data-footer-credit]');
  credit.href = footer.credit.href;
  credit.textContent = footer.credit.label;
  credit.target = '_blank';
  credit.rel = 'noopener';
}

/** Stylised map with pins linked to the location list. */
function renderMap(locations) {
  const map = $('[data-map]');
  map.insertAdjacentHTML('afterbegin', cityMap());
  map.insertAdjacentHTML(
    'beforeend',
    `<div class="map__pins">${locations
      .map((l, i) => `<span class="map__pin" data-pin="${i}" style="left:${l.map.x}%;top:${l.map.y}%" aria-hidden="true"><span class="map__dot">${i + 1}</span><span class="map__tip">${l.name}</span></span>`)
      .join('')}</div>`
  );
  $('[data-locations]').innerHTML = locations
    .map(
      (l, i) => `<li><button type="button" class="location" data-loc="${i}">
        <span class="location__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <span class="location__body">
          <span class="location__name">${l.name}</span>
          <span class="location__meta">${l.type} · ${l.area}</span>
        </span>
        <span class="location__when">${l.when}</span>
      </button></li>`
    )
    .join('');
  const setActive = (i) => {
    $$('[data-pin]').forEach((p) => p.classList.toggle('is-active', +p.dataset.pin === i));
    $$('[data-loc]').forEach((b) => {
      b.classList.toggle('is-active', +b.dataset.loc === i);
      b.setAttribute('aria-pressed', String(+b.dataset.loc === i));
    });
  };
  $$('[data-loc]').forEach((b) => {
    const i = +b.dataset.loc;
    ['click', 'mouseenter', 'focus'].forEach((ev) => b.addEventListener(ev, () => setActive(i)));
  });
  setActive(0);
}
