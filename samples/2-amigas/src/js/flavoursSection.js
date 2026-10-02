/**
 * Flavours section: product-shot cards (an accessible tab list), the
 * detail panel, and the heat dial: a brushed-steel gauge drawn on a
 * canvas with a spring-damped needle, over a real-time flame shader.
 */
import gsap from 'gsap';
import { flavours } from '../config/flavours.js';
import { getFlavour, getFlavourIndex, setFlavour, onFlavourChange } from './state.js';
import { prefersReducedMotion, cappedDPR, watchVisibility } from './env.js';
import { createFlame } from './flame.js';

const $ = (sel, root = document) => root.querySelector(sel);
const shu = ([a, b]) => `${a.toLocaleString('en-CA')}–${b.toLocaleString('en-CA')}`;
export const heatPips = (n) => `<span class="pips" aria-hidden="true">${Array.from({ length: 5 }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;

export function initFlavoursSection() {
  initCards();
  const dial = initHeatDial();
  const panel = $('[data-flavour-panel]');

  const fill = (f, animate) => {
    $('[data-fd-name]').textContent = f.name;
    $('[data-fd-tagline]').textContent = f.tagline;
    $('[data-fd-desc]').textContent = f.description;
    $('[data-fd-heatword]').textContent = f.kind;
    $('[data-fd-pairing]').textContent = f.pairing;
    $('[data-fd-ingredients]').innerHTML = f.ingredients.map((x) => `<li>${x}</li>`).join('');
    panel.setAttribute('aria-labelledby', `flavour-tab-${f.id}`);
    panel.style.setProperty('--card', f.accent);
    dial.set(f);
    if (animate && !prefersReducedMotion()) {
      gsap.fromTo(panel.querySelectorAll('.flavour-detail__copy > *'), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.04, ease: 'power3.out', overwrite: true });
    }
  };
  fill(getFlavour(), false);
  onFlavourChange((f) => fill(f, true));
}

/** Product shots arrive from the 3D stage once it has rendered them. */
export function setProductShots(shots) {
  document.querySelectorAll('[data-shot]').forEach((img) => {
    const src = shots.jars[+img.dataset.shot];
    if (!src) return;
    img.src = src;
    img.closest('.shot')?.classList.add('has-shot');
  });
  const group = document.querySelector('[data-group-shot]');
  if (group && shots.group) {
    group.innerHTML = `<img src="${shots.group}" alt="Three jars of 2 Amigas salsa on a stone counter with tomatoes, chiles, lime, garlic and cilantro." />`;
    group.classList.add('has-shot');
  }
}

/* ───────────── Product cards (role="tablist") ───────────── */

function initCards() {
  const list = $('[data-flavour-tabs]');
  list.innerHTML = flavours
    .map(
      (f, i) => `<button type="button" role="tab" class="flavour-card" id="flavour-tab-${f.id}" aria-controls="flavour-panel" data-index="${i}" style="--card:${f.accent}">
        <span class="shot"><img data-shot="${i}" alt="${f.name} jar" width="720" height="864" /></span>
        <span class="flavour-card__body">
          <span class="flavour-card__name">${f.name}</span>
          <span class="flavour-card__kind">${f.kind}</span>
          <span class="flavour-card__meta">${heatPips(f.heat)}<span>${f.heatLabel}</span><span class="flavour-card__shu">${shu(f.scoville)} SHU</span></span>
        </span>
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

/* ───────────── Heat dial ───────────── */

const START = Math.PI * 0.75; // 7:30 position
const SWEEP = Math.PI * 1.5; // 270°

function initHeatDial() {
  const root = $('[data-heat]');
  const canvas = $('[data-heat-dial]');
  const flameCanvas = $('[data-heat-flames]');
  const num = $('[data-heat-num]');
  const word = $('[data-heat-word]');
  const shuEl = $('[data-heat-shu]');
  const ctx = canvas.getContext('2d');
  const flame = createFlame(flameCanvas, { dpr: cappedDPR() });
  let face = null; // pre-rendered static dial
  let S = 0;
  let dpr = 1;

  const needle = { v: 0, vel: 0, target: 1 };
  let heat = 1;

  const angleFor = (v) => START + (v / 5) * SWEEP;

  const buildFace = () => {
    const r = canvas.getBoundingClientRect();
    dpr = cappedDPR();
    S = Math.round(r.width * dpr);
    if (!S) return;
    canvas.width = canvas.height = S;
    face = document.createElement('canvas');
    face.width = face.height = S;
    const g = face.getContext('2d');
    const c = S / 2;
    const R = S * 0.47;

    // Brushed steel bezel
    const bezel = g.createConicGradient ? g.createConicGradient(0, c, c) : null;
    if (bezel) {
      [[0, '#6d6660'], [0.12, '#d8d0c6'], [0.25, '#59524c'], [0.38, '#bfb6ab'], [0.5, '#4a443f'], [0.62, '#cfc6bb'], [0.75, '#5d5650'], [0.88, '#e2dbd2'], [1, '#6d6660']].forEach(([o, col]) => bezel.addColorStop(o, col));
      g.fillStyle = bezel;
    } else g.fillStyle = '#8a837b';
    g.beginPath();
    g.arc(c, c, R, 0, Math.PI * 2);
    g.fill();
    // fine brushing rings
    g.globalAlpha = 0.08;
    for (let k = 0; k < 40; k++) {
      g.strokeStyle = k % 2 ? '#000' : '#fff';
      g.lineWidth = 1;
      g.beginPath();
      g.arc(c, c, R - k * (S * 0.0015), 0, Math.PI * 2);
      g.stroke();
    }
    g.globalAlpha = 1;
    // Inner bevel + dial face
    const bevel = g.createLinearGradient(0, c - R, 0, c + R);
    bevel.addColorStop(0, '#0a0807');
    bevel.addColorStop(1, '#3a332e');
    g.fillStyle = bevel;
    g.beginPath();
    g.arc(c, c, R * 0.9, 0, Math.PI * 2);
    g.fill();
    const fg = g.createRadialGradient(c, c * 0.8, 0, c, c, R * 0.87);
    fg.addColorStop(0, '#221a16');
    fg.addColorStop(1, '#0c0908');
    g.fillStyle = fg;
    g.beginPath();
    g.arc(c, c, R * 0.87, 0, Math.PI * 2);
    g.fill();

    // Heat band: cool → hot
    const band = g.createConicGradient ? g.createConicGradient(START, c, c) : null;
    if (band) {
      [[0, '#5f7a22'], [0.25, '#c9a33a'], [0.5, '#e2701f'], [0.75, '#c83a1e']].forEach(([o, col]) => band.addColorStop(o, col));
      g.strokeStyle = band;
    } else g.strokeStyle = '#c83a1e';
    g.lineWidth = S * 0.018;
    g.beginPath();
    g.arc(c, c, R * 0.74, START, START + SWEEP);
    g.stroke();

    // Ticks: majors at each heat level, minors every 0.25
    g.strokeStyle = '#e9dfd2';
    for (let i = 0; i <= 20; i++) {
      const a = angleFor(i / 4);
      const major = i % 4 === 0;
      g.lineWidth = major ? S * 0.008 : S * 0.003;
      const r1 = R * (major ? 0.62 : 0.66);
      const r2 = R * 0.7;
      g.beginPath();
      g.moveTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1);
      g.lineTo(c + Math.cos(a) * r2, c + Math.sin(a) * r2);
      g.stroke();
    }
    g.fillStyle = '#e9dfd2';
    g.font = `600 ${Math.round(S * 0.07)}px "Big Shoulders Text", "Arial Narrow", sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (let i = 0; i <= 5; i++) {
      const a = angleFor(i);
      g.fillText(String(i), c + Math.cos(a) * R * 0.5, c + Math.sin(a) * R * 0.5);
    }
    g.font = `600 ${Math.round(S * 0.034)}px "Big Shoulders Text", "Arial Narrow", sans-serif`;
    g.fillStyle = 'rgba(233,223,210,0.6)';
    if ('letterSpacing' in g) g.letterSpacing = `${S * 0.006}px`;
    g.fillText('HEAT INDEX', c, c + R * 0.3);
    g.fillText('2 AMIGAS · CALGARY', c, c + R * 0.62);
    if ('letterSpacing' in g) g.letterSpacing = '0px';
  };

  const draw = () => {
    if (!face) return;
    const c = S / 2;
    const R = S * 0.47;
    ctx.clearRect(0, 0, S, S);
    ctx.drawImage(face, 0, 0);
    const a = angleFor(needle.v);
    // needle with a soft drop shadow
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(a);
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = S * 0.02;
    ctx.shadowOffsetY = S * 0.012;
    ctx.fillStyle = '#efe5d6';
    ctx.beginPath();
    ctx.moveTo(-R * 0.16, -S * 0.012);
    ctx.lineTo(R * 0.7, -S * 0.003);
    ctx.lineTo(R * 0.72, 0);
    ctx.lineTo(R * 0.7, S * 0.003);
    ctx.lineTo(-R * 0.16, S * 0.012);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#c83a1e';
    ctx.fillRect(R * 0.5, -S * 0.0045, R * 0.2, S * 0.009);
    ctx.restore();
    // centre cap
    const cap = ctx.createRadialGradient(c - S * 0.01, c - S * 0.012, 0, c, c, S * 0.05);
    cap.addColorStop(0, '#f1ebe3');
    cap.addColorStop(0.5, '#8d857c');
    cap.addColorStop(1, '#2c2723');
    ctx.fillStyle = cap;
    ctx.beginPath();
    ctx.arc(c, c, S * 0.045, 0, Math.PI * 2);
    ctx.fill();
    // glass reflection
    const gl = ctx.createLinearGradient(c - R, c - R, c + R * 0.3, c + R * 0.2);
    gl.addColorStop(0, 'rgba(255,255,255,0.13)');
    gl.addColorStop(0.45, 'rgba(255,255,255,0.03)');
    gl.addColorStop(0.46, 'rgba(255,255,255,0)');
    ctx.fillStyle = gl;
    ctx.beginPath();
    ctx.arc(c, c, R * 0.87, 0, Math.PI * 2);
    ctx.fill();
  };

  // Animation loop (only while on screen)
  let running = false;
  let visible = false;
  let last = 0;
  let time = 0;
  const tick = (now) => {
    if (!running) return;
    requestAnimationFrame(tick);
    const dt = Math.min((now - last) / 1000 || 0.016, 0.05);
    last = now;
    time += dt;
    const reduce = prefersReducedMotion();
    let goal = needle.target;
    if (heat >= 5 && !reduce) goal = 4.97 + Math.sin(time * 53) * 0.03 + Math.sin(time * 31) * 0.02; // buzzing against the stop
    if (reduce) needle.v = goal;
    else {
      // spring-damper: a real gauge overshoots a touch, then settles
      const k = 70;
      const damp = 11;
      needle.vel += (k * (goal - needle.v) - damp * needle.vel) * dt;
      needle.v += needle.vel * dt;
    }
    draw();
    flame?.draw(time, dt);
  };
  const update = () => {
    const should = visible && !document.hidden;
    if (should && !running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(tick);
    } else if (!should) running = false;
  };
  watchVisibility(root, (v) => {
    visible = v;
    update();
  });
  document.addEventListener('visibilitychange', update);
  new ResizeObserver(() => {
    buildFace();
    draw();
  }).observe(canvas);
  document.fonts?.ready.then(() => {
    buildFace();
    draw();
  });

  return {
    set(f) {
      heat = f.heat;
      needle.target = f.heat;
      num.textContent = f.heat;
      word.textContent = f.heatLabel;
      shuEl.textContent = `${shu(f.scoville)}`;
      canvas.setAttribute('aria-valuenow', String(f.heat));
      canvas.setAttribute('aria-valuetext', `${f.heat} out of 5, ${f.heatLabel}, about ${shu(f.scoville)} Scoville heat units`);
      root.classList.toggle('is-max', f.heat >= 5);
      flame?.setHeat(f.heat / 5);
      if (prefersReducedMotion()) {
        needle.v = f.heat;
        flame?.draw(0, 1);
        draw();
      }
    },
  };
}
