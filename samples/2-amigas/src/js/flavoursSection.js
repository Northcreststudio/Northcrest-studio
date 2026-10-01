/**
 * Flavours section: the three jar cards (an accessible tab list),
 * the detail panel, and the animated heat meter with flames.
 */
import gsap from 'gsap';
import { flavours } from '../config/flavours.js';
import { getFlavour, getFlavourIndex, setFlavour, onFlavourChange } from './state.js';
import { miniJar, chiliIcon } from './illustrations.js';
import { prefersReducedMotion, isMobile, cappedDPR, watchVisibility } from './env.js';

const $ = (sel, root = document) => root.querySelector(sel);

// Gauge colours, low heat → high heat
const SEGMENT_COLORS = ['#00A5A0', '#FFB01F', '#FF7A00', '#F2452C', '#E5197A'];
const CX = 150;
const CY = 156;
const R = 112;

export function initFlavoursSection() {
  initCards();
  const heat = initHeatMeter();
  const panel = $('[data-flavour-panel]');

  const fill = (f, animate) => {
    $('[data-fd-name]').textContent = f.name;
    $('[data-fd-tagline]').textContent = f.tagline;
    $('[data-fd-desc]').textContent = f.description;
    $('[data-fd-heatword]').textContent = `Heat ${f.heat}/5 · ${f.heatLabel}`;
    $('[data-fd-pairing]').textContent = f.pairing;
    $('[data-fd-ingredients]').innerHTML = f.ingredients.map((x, i) => `<li style="--i:${i}">${x}</li>`).join('');
    panel.setAttribute('aria-labelledby', `flavour-tab-${f.id}`);
    heat.set(f, animate);
    if (animate && !prefersReducedMotion()) {
      gsap.fromTo(
        panel.querySelectorAll('.flavour-detail__copy > *'),
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.04, ease: 'power3.out', overwrite: true }
      );
    }
  };

  fill(getFlavour(), false);
  onFlavourChange((f) => fill(f, true));
}

/* ───────────── Jar cards (role="tablist") ───────────── */

function initCards() {
  const list = $('[data-flavour-tabs]');
  list.innerHTML = flavours
    .map(
      (f, i) => `<button type="button" role="tab" class="flavour-card" id="flavour-tab-${f.id}" aria-controls="flavour-panel" data-index="${i}" style="--card:${f.accent};--card-deep:${f.accentDeep}">
        <span class="flavour-card__jar">${miniJar(f)}</span>
        <span class="flavour-card__name">${f.name}</span>
        <span class="flavour-card__tag">${f.tagline}</span>
        <span class="flavour-card__heat" aria-label="Heat ${f.heat} of 5">${Array.from({ length: 5 }, (_, k) => chiliIcon(k < f.heat)).join('')}</span>
      </button>`
    )
    .join('');
  const tabs = [...list.querySelectorAll('[role="tab"]')];

  const sync = () => {
    const cur = getFlavourIndex();
    tabs.forEach((t, i) => {
      t.setAttribute('aria-selected', String(i === cur));
      t.tabIndex = i === cur ? 0 : -1;
    });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => setFlavour(i, 'cards'));
    t.addEventListener('keydown', (e) => {
      const dir = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 1, ArrowUp: -1 }[e.key];
      let next = dir ? (i + dir + tabs.length) % tabs.length : null;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = tabs.length - 1;
      if (next === null) return;
      e.preventDefault();
      setFlavour(next, 'cards');
      tabs[next].focus();
    });
  });
  onFlavourChange(sync);
  sync();
}

/* ───────────── Heat meter ───────────── */

const polar = (deg, r = R) => {
  const a = (deg * Math.PI) / 180;
  return [CX + Math.cos(a) * r, CY - Math.sin(a) * r];
};
const arc = (fromDeg, toDeg, r = R) => {
  const [x1, y1] = polar(fromDeg, r);
  const [x2, y2] = polar(toDeg, r);
  return `M${x1.toFixed(1)} ${y1.toFixed(1)}A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
};

function initHeatMeter() {
  const root = $('[data-heat]');
  const gauge = $('[data-heat-gauge]');
  const segG = $('[data-heat-segments]');
  const tickG = $('[data-heat-ticks]');
  const needle = $('[data-heat-needle]');
  const num = $('[data-heat-num]');
  const word = $('[data-heat-word]');
  const chilis = $('[data-heat-chilis]');

  // Five arc segments from 180° (left) to 0° (right), with small gaps.
  const step = 180 / 5;
  segG.innerHTML = SEGMENT_COLORS.map(
    (c, i) => `<path class="heat__seg" d="${arc(180 - i * step - 2, 180 - (i + 1) * step + 2)}" stroke="${c}" />`
  ).join('');
  tickG.innerHTML = SEGMENT_COLORS.map((_, i) => {
    const [x, y] = polar(180 - (i + 0.5) * step, R + 34);
    return `<text x="${x.toFixed(1)}" y="${(y + 6).toFixed(1)}" text-anchor="middle">${i + 1}</text>`;
  }).join('');
  chilis.innerHTML = Array.from({ length: 5 }, () => chiliIcon(false)).join('');
  const segs = [...segG.children];
  const chiliEls = [...chilis.children];

  const flames = createFlames($('[data-heat-flames]'), root);

  const set = (f, animate) => {
    const v = f.heat;
    const angle = (v - 0.5) * step - 90; // needle rotation, -90 = pointing left
    const reduce = prefersReducedMotion();
    gsap.to(needle, {
      rotation: angle,
      svgOrigin: `${CX} ${CY}`,
      duration: animate && !reduce ? 1.4 : 0,
      ease: 'elastic.out(1, 0.45)',
      overwrite: true,
    });
    segs.forEach((s, i) => s.classList.toggle('is-on', i < v));
    chiliEls.forEach((c, i) => {
      c.classList.toggle('is-on', i < v);
      c.style.setProperty('--d', `${i * 70}ms`);
    });
    gauge.setAttribute('aria-valuenow', String(v));
    gauge.setAttribute('aria-valuetext', `${v} out of 5, ${f.heatLabel}`);
    root.style.setProperty('--heat-color', SEGMENT_COLORS[v - 1]);
    root.classList.toggle('is-max', v >= 5);

    // Count the number up/down for a little extra drama.
    const counter = { n: +num.textContent || 1 };
    gsap.to(counter, {
      n: v,
      duration: animate && !reduce ? 0.6 : 0,
      ease: 'power2.out',
      onUpdate: () => (num.textContent = Math.round(counter.n)),
    });
    word.textContent = f.heatLabel;
    flames.setHeat(v);
  };

  return { set };
}

/**
 * Canvas flame particles rising off the lit part of the gauge.
 * Particle count scales with heat, and is reduced on phones.
 */
function createFlames(canvas, host) {
  const ctx = canvas.getContext('2d');
  const particles = [];
  let heat = 1;
  let running = false;
  let visible = false;
  let raf = 0;
  let w = 0;
  let h = 0;
  let dpr = 1;

  // Pre-rendered soft glow sprites in three flame colours.
  const sprite = (inner, outer) => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, inner);
    grad.addColorStop(0.4, outer);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return c;
  };
  const sprites = [sprite('#FFF6C2', 'rgba(255,190,40,.8)'), sprite('#FFD27A', 'rgba(255,120,0,.75)'), sprite('#FF9A6B', 'rgba(229,25,122,.7)')];

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    dpr = cappedDPR();
    w = r.width;
    h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  };
  new ResizeObserver(resize).observe(canvas);

  // The gauge is drawn in a 300×180 box at the bottom of the canvas.
  const spawn = () => {
    const scale = w / 300;
    const maxDeg = 180 - (heat / 5) * 180;
    const deg = maxDeg + Math.random() * (180 - maxDeg);
    const a = (deg * Math.PI) / 180;
    const offsetY = h - 180 * scale;
    particles.push({
      x: (CX + Math.cos(a) * R) * scale,
      y: offsetY + (CY - Math.sin(a) * R) * scale,
      vx: (Math.random() - 0.5) * 0.6,
      vy: -(0.6 + Math.random() * 1.2) * (0.6 + heat * 0.25),
      life: 0,
      max: 40 + Math.random() * 30 + heat * 6,
      size: (14 + Math.random() * 16) * (0.6 + heat * 0.12) * scale,
      s: sprites[Math.min(2, Math.floor(Math.random() * (heat >= 4 ? 3 : heat >= 2 ? 2 : 1)))],
    });
  };

  const tick = () => {
    raf = requestAnimationFrame(tick);
    const rate = (heat * heat * 0.3 + 0.5) * (isMobile ? 0.55 : 1);
    for (let i = 0; i < rate; i++) if (Math.random() < rate - i) spawn();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life++;
      p.x += p.vx + Math.sin((p.life + i) * 0.15) * 0.35;
      p.y += p.vy;
      const t = p.life / p.max;
      if (t >= 1) {
        particles.splice(i, 1);
        continue;
      }
      const size = p.size * (1 - t * 0.7);
      ctx.globalAlpha = Math.sin(t * Math.PI) * 0.7;
      ctx.drawImage(p.s, p.x - size / 2, p.y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
  };

  const update = () => {
    const should = visible && !prefersReducedMotion() && !document.hidden;
    if (should && !running) {
      running = true;
      resize();
      tick();
    } else if (!should && running) {
      running = false;
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.length = 0;
    }
  };
  watchVisibility(host, (v) => {
    visible = v;
    update();
  });
  document.addEventListener('visibilitychange', update);

  return {
    setHeat(v) {
      heat = v;
    },
  };
}
