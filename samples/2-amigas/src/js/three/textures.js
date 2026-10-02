/**
 * Procedural texture toolkit shared by the 3D scenes.
 * Everything is generated on canvases at load time (no image files):
 * tileable noise for bump/roughness, stone, wood, salsa, studio light.
 */
import * as THREE from 'three';

/* ───────── Tileable fractal value noise ───────── */

function hash(x, y, seed) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
const fade = (t) => t * t * (3 - 2 * t);

/**
 * Returns a Float32Array (size*size) of fractal noise in 0..1 that tiles.
 * @param {number} size  pixels per side
 * @param {number} freq  base cells across the tile
 */
export function fbm(size, { freq = 8, octaves = 4, seed = 1, gain = 0.5 } = {}) {
  const out = new Float32Array(size * size);
  let amp = 1;
  let total = 0;
  for (let o = 0; o < octaves; o++) {
    const f = freq << o;
    for (let y = 0; y < size; y++) {
      const fy = (y / size) * f;
      const y0 = Math.floor(fy);
      const ty = fade(fy - y0);
      for (let x = 0; x < size; x++) {
        const fx = (x / size) * f;
        const x0 = Math.floor(fx);
        const tx = fade(fx - x0);
        const a = hash(x0 % f, y0 % f, seed + o);
        const b = hash((x0 + 1) % f, y0 % f, seed + o);
        const c = hash(x0 % f, (y0 + 1) % f, seed + o);
        const d = hash((x0 + 1) % f, (y0 + 1) % f, seed + o);
        out[y * size + x] += amp * (a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty);
      }
    }
    total += amp;
    amp *= gain;
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}

/** Paint a canvas pixel-by-pixel: fn(x, y, i) → [r, g, b] (0–255). */
export function paint(size, fn, h = size) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = h;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const [r, g, b] = fn(x, y, i);
      img.data[i * 4] = r;
      img.data[i * 4 + 1] = g;
      img.data[i * 4 + 2] = b;
      img.data[i * 4 + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

export function canvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** Wraps a canvas as a texture. Colour maps are sRGB, data maps (bump, roughness) are linear. */
export function tex(c, { color = true, repeat = null, renderer = null } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  if (renderer) t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}

export const hex = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/* ───────── Studio lighting environment ───────── */

/**
 * A photo-studio HDR environment: a dark room with large softboxes
 * and strip lights. This is what draws the long, soft highlights on
 * the glass, lid and glossy chiles, like a real product shoot.
 */
export function studioEnvironment(renderer, { warmth = 1 } = {}) {
  const env = new THREE.Scene();
  const room = new THREE.Mesh(
    new THREE.SphereGeometry(20, 32, 16),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.018, 0.014, 0.012), side: THREE.BackSide })
  );
  env.add(room);
  const box = (w, h, pos, intensity, tint = [1, 0.96, 0.9]) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(tint[0] * intensity, tint[1] * intensity, tint[2] * intensity * warmth), side: THREE.DoubleSide })
    );
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    env.add(m);
  };
  box(7, 5, [-7, 6, 6], 7); // big key softbox, front-left above
  box(1.2, 9, [8, 2, 3], 9); // tall strip light, right (the classic glass highlight)
  box(1, 8, [-8, 1, -5], 5, [1, 0.8, 0.62]); // warm rim strip behind-left
  box(10, 10, [0, 12, 0], 1.6); // soft overhead fill
  box(6, 2, [2, -4, 8], 0.6, [1, 0.85, 0.7]); // faint bounce off the counter
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(env, 0.02);
  pmrem.dispose();
  return rt.texture;
}

/* ───────── Surfaces ───────── */

/** Honed dark stone counter: colour, roughness and bump maps. */
export function stoneMaps(renderer, size = 1024) {
  const n1 = fbm(size, { freq: 4, octaves: 6, seed: 11 });
  const n2 = fbm(size, { freq: 24, octaves: 3, seed: 23 });
  // Honed basalt: near-uniform, fine speckle, the faintest cloud.
  const base = [33, 29, 27];
  const light = [52, 47, 43];
  const color = paint(size, (x, y, i) => {
    const c = mix(base, light, (n1[i] - 0.5) * 0.35 + 0.18);
    const speck = n2[i] > 0.8 ? 10 : n2[i] < 0.2 ? -6 : 0;
    return [c[0] + speck, c[1] + speck, c[2] + speck];
  });
  const rough = paint(size, (x, y, i) => {
    const r = 175 + (n1[i] - 0.5) * 40 + (n2[i] - 0.5) * 40;
    return [r, r, r];
  });
  const bump = paint(size, (x, y, i) => {
    const b = 128 + (n2[i] - 0.5) * 120;
    return [b, b, b];
  });
  return {
    map: tex(color, { repeat: [3, 3], renderer }),
    roughnessMap: tex(rough, { color: false, repeat: [3, 3] }),
    bumpMap: tex(bump, { color: false, repeat: [3, 3] }),
  };
}

/** Oiled walnut board for the chip-dip table: straight grain, planks, pores. */
export function woodMaps(renderer, size = 1024) {
  const n = fbm(size, { freq: 3, octaves: 4, seed: 5 });
  const fine = fbm(size, { freq: 96, octaves: 2, seed: 9 });
  const dark = [26, 16, 11];
  const light = [74, 47, 30];
  const planks = 4;
  const grain = (x, y, i) => {
    const plank = Math.floor((y / size) * planks);
    const t = (y / size) * 160 + n[i] * 3.2 + plank * 17.3;
    const line = Math.pow(0.5 + 0.5 * Math.sin(t), 6); // thin dark growth lines
    const tone = 0.55 + (n[(i + plank * 997) % n.length] - 0.5) * 0.9;
    return Math.max(0, Math.min(1, tone - line * 0.35 + (fine[i] - 0.5) * 0.12));
  };
  const seam = (y) => {
    const f = ((y / size) * planks) % 1;
    return f < 0.004 || f > 0.996;
  };
  const color = paint(size, (x, y, i) => (seam(y) ? [10, 6, 4] : mix(dark, light, grain(x, y, i))));
  const rough = paint(size, (x, y, i) => {
    const r = seam(y) ? 255 : 150 + (1 - grain(x, y, i)) * 60;
    return [r, r, r];
  });
  const bump = paint(size, (x, y, i) => {
    const b = seam(y) ? 20 : 110 + grain(x, y, i) * 70 + (fine[i] > 0.85 ? -40 : 0);
    return [b, b, b];
  });
  return {
    map: tex(color, { repeat: [2, 2], renderer }),
    roughnessMap: tex(rough, { color: false, repeat: [2, 2] }),
    bumpMap: tex(bump, { color: false, repeat: [2, 2] }),
  };
}

/**
 * Chunky salsa: roasted base colour with charred flecks, tomato pieces,
 * onion, seeds and herbs. Returns colour + bump (bits sit proud) maps.
 */
export function salsaMaps(f, renderer, size = 512) {
  const n = fbm(size, { freq: 10, octaves: 4, seed: f.id.length * 7 });
  const raw = hex(f.salsa);
  const base = [raw[0] * 0.8, raw[1] * 0.8, raw[2] * 0.8]; // reads truer through glass and tone mapping
  const toCss = (c) => `rgb(${c.map((v) => Math.round(v)).join(',')})`;
  const blend = (h, t) => toCss(mix(hex(h), base, t));
  const color = canvas(size);
  const bump = canvas(size);
  const cx = color.getContext('2d');
  const bx = bump.getContext('2d');
  // Base with low-frequency variation (redder/darker pockets)
  const img = cx.createImageData(size, size);
  const bimg = bx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = n[i];
    const c = mix(base, [base[0] * 0.55, base[1] * 0.5, base[2] * 0.5], Math.max(0, 0.55 - v) * 1.4);
    img.data.set([c[0], c[1], c[2], 255], i * 4);
    const b = 110 + v * 50;
    bimg.data.set([b, b, b, 255], i * 4);
  }
  cx.putImageData(img, 0, 0);
  bx.putImageData(bimg, 0, 0);

  let seed = 1 + f.id.length * 31;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const blob = (ctx, x, y, r, fill, rot, squash) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    // irregular, slightly faceted chunk
    const pts = 7;
    for (let k = 0; k <= pts; k++) {
      const a = (k / pts) * Math.PI * 2;
      const rr = r * (0.7 + rnd() * 0.5);
      const px = x + Math.cos(a + rot) * rr;
      const py = y + Math.sin(a + rot) * rr * squash;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.fill();
  };
  const s = size / 512;
  const [chunk, pale, herb] = f.salsaBits;
  const layers = [
    { n: 320, r: [1, 2.4], fill: 'rgba(22,8,4,0.45)', h: 'rgb(95,95,95)' }, // char flecks
    { n: 240, r: [4, 9], fill: blend(chunk, 0.4), h: 'rgb(190,190,190)' }, // tomato / tomatillo pieces
    { n: 50, r: [2, 4], fill: blend(pale, 0.5), h: 'rgb(210,210,210)' }, // onion
    { n: 70, r: [0.8, 1.5], fill: 'rgba(196,160,96,0.5)', h: 'rgb(200,200,200)' }, // seeds
    { n: 80, r: [1.2, 3], fill: blend(herb, 0.2), h: 'rgb(175,175,175)' }, // herbs
  ];
  layers.forEach((L) => {
    for (let i = 0; i < L.n; i++) {
      const x = rnd() * size;
      const y = rnd() * size;
      const r = (L.r[0] + rnd() * (L.r[1] - L.r[0])) * s;
      const rot = rnd() * 6;
      const sq = 0.5 + rnd() * 0.5;
      // draw wrapped copies so the texture tiles
      for (const dx of [-size, 0, size]) {
        for (const dy of [-size, 0, size]) {
          if (x + dx < -20 || x + dx > size + 20 || y + dy < -20 || y + dy > size + 20) continue;
          const save = seed;
          blob(cx, x + dx, y + dy, r, L.fill, rot, sq);
          seed = save;
          blob(bx, x + dx, y + dy, r * 0.9, L.h, rot, sq);
        }
      }
    }
  });
  return {
    map: tex(color, { repeat: [3, 2], renderer }),
    bumpMap: tex(bump, { color: false, repeat: [3, 2] }),
  };
}

/** Soft radial gradient (contact shadow / backdrop glow). */
export function radial(size, stops) {
  const c = canvas(size);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}
