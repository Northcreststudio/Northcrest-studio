/**
 * Fills the page with copy from src/config/content.js and
 * builds the static illustrated bits (logos, banners, cards, map).
 */
import * as content from '../config/content.js';
import { flavours } from '../config/flavours.js';
import { setFlavour, onFlavourChange, getFlavour } from './state.js';
import { papelPicado, recipeIcons, socialIcons, storyArt, cityMap, miniJar } from './illustrations.js';
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

  /* Logos + decorative banners */
  $$('[data-logo]').forEach((el) => (el.innerHTML = inlineLogo(logoSvg)));
  $$('[data-logo-mark]').forEach((el) => (el.innerHTML = markSvg));
  renderPapel();
  let lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    renderPapel();
  });

  /* Hero */
  text('[data-hero-eyebrow]', hero.eyebrow);
  text('[data-hero-top]', hero.headlineTop);
  text('[data-hero-accent]', hero.headlineAccent);
  text('[data-hero-bottom]', hero.headlineBottom);
  text('[data-hero-body]', hero.body);
  text('[data-hero-hint] span', hero.dragHint);
  text('[data-scroll-cue] .scroll-cue__text', hero.scrollCue);

  /* Explode captions (shown over the 3D while ingredients fly) */
  text('[data-explode-heading]', explode.heading);
  $('[data-explode-captions]').innerHTML = explode.captions
    .map((c, i) => `<li class="explode-caption" data-caption="${i}"><span class="explode-caption__num">0${i + 1}</span><h3>${c.title}</h3><p>${c.text}</p></li>`)
    .join('');

  /* Marquee: duplicated so the loop is seamless */
  const items = marquee.map((m) => `<span>${m}</span><span class="marquee__star" aria-hidden="true">✺</span>`).join('');
  $('[data-marquee]').innerHTML = `<div class="marquee__group">${items}</div><div class="marquee__group">${items}</div>`;

  /* Flavours section heading (cards + detail live in flavoursSection.js) */
  text('[data-fl-eyebrow]', flavoursSection.eyebrow);
  text('[data-fl-heading]', flavoursSection.heading);
  text('[data-fl-body]', flavoursSection.body);
  text('[data-fd-ing-label]', flavoursSection.ingredientsLabel);
  text('[data-fd-pair-label]', flavoursSection.pairingLabel + ':');

  /* Story */
  text('[data-st-eyebrow]', story.eyebrow);
  text('[data-st-heading]', story.heading);
  $('[data-st-paragraphs]').innerHTML = story.paragraphs.map((p) => `<p>${p}</p>`).join('');
  text('[data-st-sig]', `${story.signature}`);
  $('[data-story-art]').innerHTML = storyArt(markSvg);
  $('[data-st-milestones]').innerHTML = story.milestones
    .map((m, i) => `<li class="milestone" style="--i:${i}"><span class="milestone__year">${m.year}</span><span>${m.text}</span></li>`)
    .join('');

  /* Chip-dip copy */
  text('[data-dip-eyebrow]', dip.eyebrow);
  text('[data-dip-heading]', dip.heading);
  text('[data-dip-body]', dip.body);
  text('[data-dip-button]', dip.keyboardButton);
  text('[data-dip-count-label]', dip.counterLabel);
  text('[data-dip-message]', dip.idleMessage);

  /* Recipes */
  text('[data-rc-eyebrow]', recipes.eyebrow);
  text('[data-rc-heading]', recipes.heading);
  $('[data-recipes]').innerHTML = recipes.items
    .map((r) => {
      const f = flavours.find((x) => x.id === r.flavourId) || flavours[0];
      return `<li class="recipe" style="--card:${f.accent}">
        <div class="recipe__art">${recipeIcons[r.icon] || ''}</div>
        <span class="recipe__time">${r.time}</span>
        <h3>${r.title}</h3>
        <p>${r.text}</p>
        <button type="button" class="recipe__pair" data-pick-flavour="${f.id}">
          <span class="recipe__pair-jar">${miniJar(f, { withLabel: false })}</span>
          Try it with <strong>${f.name}</strong>
        </button>
      </li>`;
    })
    .join('');
  // "Try it with" buttons select the flavour and jump to its details.
  $$('[data-pick-flavour]').forEach((btn) =>
    btn.addEventListener('click', () => {
      setFlavour(btn.dataset.pickFlavour, 'recipe');
      document.getElementById('flavours').scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    })
  );
  initTilt($$('.recipe'));

  /* Find us */
  text('[data-fu-eyebrow]', findUs.eyebrow);
  text('[data-fu-heading]', findUs.heading);
  text('[data-fu-body]', findUs.body);
  renderMap(findUs.locations);

  /* Contact */
  text('[data-ct-eyebrow]', contact.eyebrow);
  text('[data-ct-heading]', contact.heading);
  text('[data-ct-body]', contact.body);
  $('[data-signup-input]').placeholder = contact.placeholder;
  text('[data-signup-button]', contact.button);
  text('[data-ct-wholesale-heading]', contact.wholesaleHeading);
  text('[data-ct-wholesale-body]', contact.wholesaleBody);
  const mail = $('[data-ct-wholesale-email]');
  mail.href = `mailto:${brand.wholesaleEmail}`;
  mail.textContent = brand.wholesaleEmail;
  const phone = $('[data-ct-phone]');
  phone.href = `tel:${brand.phone.replace(/[^\d+]/g, '')}`;
  phone.textContent = brand.phone;
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

  /* Bowl / chip bits follow the current flavour */
  const applyBits = (f) => {
    const root = document.documentElement;
    f.salsaBits.forEach((c, i) => root.style.setProperty(`--bit${i + 1}`, c));
  };
  applyBits(getFlavour());
  onFlavourChange(applyBits);
}

/**
 * Papel picado banners: the number of flags follows the screen width,
 * so flags stay the same size on phones and big monitors.
 * data-papel = roughly how many px each flag takes up.
 */
function renderPapel() {
  $$('[data-papel]').forEach((el) => {
    const pitch = +el.dataset.papel || 64;
    const count = Math.max(6, Math.ceil((el.clientWidth || window.innerWidth) / pitch));
    if (el.dataset.count === String(count)) return;
    el.dataset.count = count;
    el.innerHTML = papelPicado(count);
  });
}

/** Stylised map with pins linked to the location list. */
function renderMap(locations) {
  const map = $('[data-map]');
  map.insertAdjacentHTML('afterbegin', cityMap());
  const pins = locations
    .map(
      (l, i) => `<span class="map__pin" data-pin="${i}" style="left:${l.map.x}%;top:${l.map.y}%" aria-hidden="true">
        <svg viewBox="0 0 30 40"><path d="M15 39C6 27 2 21 2 14a13 13 0 0 1 26 0c0 7-4 13-13 25z"/><text x="15" y="19" text-anchor="middle">${i + 1}</text></svg>
        <span class="map__tip">${l.name}</span>
      </span>`
    )
    .join('');
  map.insertAdjacentHTML('beforeend', `<div class="map__pins">${pins}</div>`);

  $('[data-locations]').innerHTML = locations
    .map(
      (l, i) => `<li><button type="button" class="location" data-loc="${i}">
        <span class="location__num" aria-hidden="true">${i + 1}</span>
        <span class="location__body">
          <span class="location__name">${l.name}</span>
          <span class="location__meta"><span class="location__type">${l.type}</span> ${l.when} · ${l.area}</span>
        </span>
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
    b.addEventListener('click', () => setActive(i));
    b.addEventListener('mouseenter', () => setActive(i));
    b.addEventListener('focus', () => setActive(i));
  });
  $$('[data-pin]').forEach((p) => p.addEventListener('mouseenter', () => setActive(+p.dataset.pin)));
  setActive(0);
}

/** Gentle 3D tilt on hover (desktop pointers only, off for reduced motion). */
function initTilt(cards) {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  cards.forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      if (prefersReducedMotion()) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty('--rx', `${(-y * 10).toFixed(2)}deg`);
      card.style.setProperty('--ry', `${(x * 12).toFixed(2)}deg`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
}
