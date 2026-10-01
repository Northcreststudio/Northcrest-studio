/**
 * Chip-dip interaction.
 * Drag the tortilla chip into the bowl. When its tip hits the salsa
 * we splash particles, coat the chip, and show a flavour-specific
 * message. Let go and the chip gets eaten (CRUNCH!) and a fresh
 * one pops in. A button does the same for keyboard users.
 */
import gsap from 'gsap';
import { getFlavour, onFlavourChange } from './state.js';
import { dip as dipCopy } from '../config/content.js';
import { bowlBack, bowlFront, chip as chipSvg } from './illustrations.js';
import { prefersReducedMotion, isMobile, cappedDPR, clamp, watchVisibility } from './env.js';

const $ = (sel, root = document) => root.querySelector(sel);

export function initChipDip() {
  const play = $('[data-dip-play]');
  const chip = $('[data-dip-chip]');
  const back = $('[data-dip-bowl]');
  const front = $('[data-dip-bowl-front]');
  const msg = $('[data-dip-message]');
  const count = $('[data-dip-count]');
  const button = $('[data-dip-button]');
  const hint = $('[data-dip-hint]');
  const crunch = $('[data-dip-crunch]');
  const fx = createSplashFx($('[data-dip-fx]'), play);

  back.innerHTML = bowlBack();
  front.innerHTML = bowlFront();
  chip.innerHTML = chipSvg();
  const ripples = [...back.querySelectorAll('.bowl__ripple')];

  let dips = 0;
  let lastMsg = -1;
  let dippedThisDrag = false;
  let busy = false; // true while the chip is being eaten / respawned
  let dragging = false;
  let pos = { x: 0, y: 0, rot: 0 };
  let grab = { x: 0, y: 0 };
  let last = { x: 0, t: 0 };

  const setChip = () => gsap.set(chip, { x: pos.x, y: pos.y, rotation: pos.rot });

  /* Where is the salsa surface, in play-area pixels? (matches the ellipse in bowlBack) */
  const salsaRect = () => {
    const pr = play.getBoundingClientRect();
    const br = back.getBoundingClientRect();
    const sx = br.width / 400;
    const sy = br.height / 250;
    return {
      cx: br.left - pr.left + 200 * sx,
      cy: br.top - pr.top + 76 * sy,
      rx: 164 * sx,
      ry: 28 * sy,
      bottom: br.top - pr.top + 200 * sy,
      scale: sx,
    };
  };

  /* Chip tip position in play-area pixels (tip is at 50%, 95% of the chip box). */
  const tipPoint = () => {
    const pr = play.getBoundingClientRect();
    const cr = chip.getBoundingClientRect();
    const cx = cr.left - pr.left + cr.width / 2;
    const cy = cr.top - pr.top + cr.height / 2;
    const half = chip.offsetHeight * 0.45;
    const a = (pos.rot * Math.PI) / 180;
    return { x: cx - Math.sin(a) * half, y: cy + Math.cos(a) * half };
  };

  const tipInSalsa = () => {
    const t = tipPoint();
    const s = salsaRect();
    const dx = (t.x - s.cx) / (s.rx * 0.92);
    const insideX = Math.abs(dx) < 1;
    // Anywhere from just above the surface down into the bowl counts.
    const insideY = t.y > s.cy - s.ry * 0.5 && t.y < s.bottom;
    return insideX && insideY ? t : null;
  };

  const pickMessage = (f) => {
    const list = f.dipMessages;
    let i = Math.floor(Math.random() * list.length);
    if (list.length > 1 && i === lastMsg) i = (i + 1) % list.length;
    lastMsg = i;
    return list[i];
  };

  /* The dunk itself */
  const doDip = (tip) => {
    const f = getFlavour();
    const reduce = prefersReducedMotion();
    dips++;
    count.textContent = dips;
    chip.classList.add('is-coated');
    msg.textContent = pickMessage(f);
    msg.classList.remove('is-pop');
    void msg.offsetWidth; // restart the CSS pop animation
    msg.classList.add('is-pop');
    msg.style.setProperty('--bubble', f.accent);

    fx.splash(tip.x, tip.y, f, reduce);

    // Ripples on the salsa, centred where the chip went in.
    const s = salsaRect();
    const localX = clamp((tip.x - (s.cx - s.rx)) / s.scale + 36, 60, 340);
    ripples.forEach((r, i) => {
      gsap.fromTo(
        r,
        { attr: { cx: localX, rx: 10, ry: 2 }, opacity: 0.9 },
        { attr: { rx: 70 + i * 40, ry: 12 + i * 6 }, opacity: 0, duration: reduce ? 0.4 : 0.9, delay: i * 0.12, ease: 'power2.out' }
      );
    });

    if (!reduce) {
      // Bowl jiggle, more violent the hotter it is.
      const amp = 2 + f.heat * 1.4;
      gsap.fromTo([back, front], { rotation: 0 }, { keyframes: [{ rotation: -amp * 0.4 }, { rotation: amp * 0.3 }, { rotation: 0 }], duration: 0.5, ease: 'power1.inOut', transformOrigin: '50% 90%' });
      if (f.heat >= 5) gsap.fromTo(play, { x: 0 }, { keyframes: [{ x: -8 }, { x: 7 }, { x: -5 }, { x: 4 }, { x: 0 }], duration: 0.45 });
    }
  };

  /* After a dip: eat the chip, then pop a fresh one in. */
  const eatAndRespawn = () => {
    busy = true;
    const reduce = prefersReducedMotion();
    const t = tipPoint();
    fx.crumbs(t.x, t.y - chip.offsetHeight * 0.4, reduce);
    gsap.fromTo(crunch, { scale: 0.4, opacity: 0, rotation: -12 }, { scale: 1, opacity: 1, rotation: -6, duration: 0.35, ease: 'back.out(3)', onComplete: () => gsap.to(crunch, { opacity: 0, y: -20, duration: 0.4, delay: 0.4, onComplete: () => gsap.set(crunch, { y: 0 }) }) });
    gsap.set(crunch, { left: t.x, top: t.y - chip.offsetHeight * 0.9, xPercent: -50, yPercent: -50 });
    gsap.to(chip, {
      scale: 0,
      rotation: pos.rot + 90,
      duration: reduce ? 0.2 : 0.35,
      ease: 'back.in(2)',
      onComplete: () => {
        chip.classList.remove('is-coated');
        pos = { x: 0, y: 0, rot: 0 };
        gsap.set(chip, { x: 0, y: 0, rotation: -8 });
        gsap.to(chip, { scale: 1, rotation: 0, duration: reduce ? 0.2 : 0.7, ease: 'elastic.out(1, 0.5)', delay: 0.25, onComplete: () => (busy = false) });
      },
    });
  };

  const springBack = () => {
    gsap.to(pos, { x: 0, y: 0, rot: 0, duration: prefersReducedMotion() ? 0.2 : 0.8, ease: 'elastic.out(1, 0.55)', onUpdate: setChip });
  };

  /* Pointer dragging (mouse + touch + pen) */
  chip.addEventListener('pointerdown', (e) => {
    if (busy) return;
    dragging = true;
    dippedThisDrag = false;
    chip.setPointerCapture(e.pointerId);
    chip.classList.add('is-dragging');
    play.classList.add('has-interacted');
    gsap.killTweensOf(pos);
    grab = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    last = { x: e.clientX, t: performance.now() };
  });
  chip.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const pr = play.getBoundingClientRect();
    const home = chip.offsetParent ? { l: chip.offsetLeft, t: chip.offsetTop } : { l: 0, t: 0 };
    // Keep the chip inside the play area.
    pos.x = clamp(e.clientX - grab.x, -home.l, pr.width - home.l - chip.offsetWidth);
    pos.y = clamp(e.clientY - grab.y, -home.t, pr.height - home.t - chip.offsetHeight * 0.6);
    // Tilt with horizontal speed, like it is swinging.
    const now = performance.now();
    const vx = (e.clientX - last.x) / Math.max(1, now - last.t);
    last = { x: e.clientX, t: now };
    pos.rot += (clamp(vx * 22, -28, 28) - pos.rot) * 0.25;
    setChip();

    if (!dippedThisDrag) {
      const tip = tipInSalsa();
      if (tip) {
        dippedThisDrag = true;
        doDip(tip);
      }
    }
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    chip.classList.remove('is-dragging');
    if (dippedThisDrag) eatAndRespawn();
    else springBack();
  };
  chip.addEventListener('pointerup', endDrag);
  chip.addEventListener('pointercancel', endDrag);

  /* Keyboard / button path: animate the chip into the bowl automatically. */
  button.addEventListener('click', () => {
    if (busy || dragging) return;
    busy = true;
    play.classList.add('has-interacted');
    const s = salsaRect();
    const targetX = s.cx - chip.offsetLeft - chip.offsetWidth / 2;
    const targetY = s.cy - chip.offsetTop - chip.offsetHeight * 0.75;
    const reduce = prefersReducedMotion();
    gsap
      .timeline({ onUpdate: setChip })
      .to(pos, { x: targetX, y: targetY - 60, rot: 10, duration: reduce ? 0.2 : 0.6, ease: 'power2.inOut' })
      .to(pos, {
        y: targetY + 20,
        rot: 0,
        duration: reduce ? 0.15 : 0.3,
        ease: 'power2.in',
        onComplete: () => {
          doDip(tipPoint());
          setTimeout(eatAndRespawn, reduce ? 200 : 650);
        },
      });
  });

  // Hide the "Drag me" hint after the first go.
  hint.textContent = 'Drag me!';
  const updateMessageColor = (f) => msg.style.setProperty('--bubble', f.accent);
  onFlavourChange((f) => {
    updateMessageColor(f);
    if (!dips) msg.textContent = dipCopy.idleMessage;
  });
  updateMessageColor(getFlavour());
}

/**
 * Canvas splash: salsa droplets with gravity, plus chip crumbs.
 * Only animates while particles are alive and the section is visible.
 */
function createSplashFx(canvas, host) {
  const ctx = canvas.getContext('2d');
  const parts = [];
  let raf = 0;
  let running = false;
  let visible = true;
  let dpr = 1;
  let w = 0;
  let h = 0;

  const resize = () => {
    const r = host.getBoundingClientRect();
    dpr = cappedDPR();
    w = r.width;
    h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  };
  new ResizeObserver(resize).observe(host);
  watchVisibility(host, (v) => (visible = v));

  const loop = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.vy += p.g;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      p.rot += p.vr;
      const t = p.life / p.max;
      if (t >= 1 || p.y > h + 40) {
        parts.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = t > 0.7 ? (1 - t) / 0.3 : 1;
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.kind === 'drop') {
        // Stretch drops along their velocity for a juicy look.
        const sp = Math.hypot(p.vx, p.vy);
        ctx.rotate(Math.atan2(p.vy, p.vx) - p.rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r * (1 + sp * 0.08), p.r, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'crumb') {
        ctx.beginPath();
        ctx.moveTo(-p.r, p.r);
        ctx.lineTo(p.r, p.r * 0.6);
        ctx.lineTo(0, -p.r);
        ctx.closePath();
        ctx.fill();
      } else {
        // flame flick for Fuego
        ctx.beginPath();
        ctx.moveTo(0, -p.r * 1.6);
        ctx.quadraticCurveTo(p.r, 0, 0, p.r);
        ctx.quadraticCurveTo(-p.r, 0, 0, -p.r * 1.6);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (parts.length && visible) raf = requestAnimationFrame(loop);
    else {
      running = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
  const start = () => {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(loop);
  };

  const add = (p) => parts.push({ life: 0, rot: 0, vr: 0, g: 0.32, ...p });

  return {
    splash(x, y, f, reduce) {
      const n = Math.round((reduce ? 8 : 22 + f.heat * 8) * (isMobile ? 0.6 : 1));
      const colors = [f.salsa, f.salsa, f.accent, ...f.salsaBits];
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
        const sp = (reduce ? 2 : 4) + Math.random() * (reduce ? 2 : 5 + f.heat);
        add({ kind: 'drop', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 3 + Math.random() * 5, color: colors[i % colors.length], max: 60 + Math.random() * 30 });
      }
      if (f.heat >= 4 && !reduce) {
        for (let i = 0; i < 14; i++) {
          add({ kind: 'flame', x: x + (Math.random() - 0.5) * 60, y, vx: (Math.random() - 0.5) * 2, vy: -3 - Math.random() * 4, g: -0.02, r: 6 + Math.random() * 6, color: i % 2 ? '#FFB01F' : '#FF7A00', max: 40 + Math.random() * 20 });
        }
      }
      start();
    },
    crumbs(x, y, reduce) {
      const n = reduce ? 5 : isMobile ? 10 : 16;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 2 + Math.random() * 4;
        add({ kind: 'crumb', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2, r: 3 + Math.random() * 4, vr: (Math.random() - 0.5) * 0.4, color: i % 3 ? '#F2C35B' : '#D18F2E', max: 50 });
      }
      start();
    },
  };
}
