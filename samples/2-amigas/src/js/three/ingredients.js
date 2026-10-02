/**
 * Procedural, physically shaded ingredients. No model or image files:
 * geometry is built in code and every texture is painted on a canvas.
 * Geometries, textures and materials are cached and shared, so a few
 * dozen ingredients stay cheap.
 *
 * To add an ingredient: write a factory below, add it to `factories`,
 * then use its key in a flavour's `ingredients3D` (src/config/flavours.js).
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { fbm, paint, canvas, tex, hex, mix } from './textures.js';
import { chipGeometry, chipMaterial } from './chip.js';

const cache = new Map();
const once = (key, make) => {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
};
const v2 = (x, y) => new THREE.Vector2(x, y);
const lathe = (pts, seg = 32, n = 24, phiStart, phiLen) => new THREE.LatheGeometry(new THREE.SplineCurve(pts).getPoints(n), seg, phiStart, phiLen);

/* ───────── shared surface detail ───────── */

const skinBump = () => once('skinBump', () => {
  const n = fbm(256, { freq: 24, octaves: 3, seed: 61 });
  return tex(paint(256, (x, y, i) => { const v = 100 + n[i] * 110; return [v, v, v]; }), { color: false, repeat: [2, 2] });
});
/** Lengthwise streaks for chile skins (light catching tiny ridges, corking). */
const streakBump = () => once('streakBump', () => {
  const n = fbm(256, { freq: 6, octaves: 3, seed: 62 });
  return tex(paint(256, (x, y, i) => { const v = 110 + Math.sin(x * 0.9 + n[i] * 12) * 30 + n[i] * 50; return [v, v, v]; }), { color: false });
});

/** Vertical colour ramp (bottom → top) with fine mottling, for lathe/sphere UVs. */
function ramp(key, stops, { streaks = 0, size = 256 } = {}) {
  return once(`ramp:${key}`, () => {
    const n = fbm(size, { freq: 12, octaves: 3, seed: key.length * 13 });
    const cols = stops.map(([t, h]) => [t, hex(h)]);
    return tex(paint(size, (x, y, i) => {
      const v = 1 - y / size;
      let k = 0;
      while (k < cols.length - 2 && v > cols[k + 1][0]) k++;
      const [t0, c0] = cols[k];
      const [t1, c1] = cols[k + 1];
      let c = mix(c0, c1, Math.min(1, Math.max(0, (v - t0) / (t1 - t0))));
      const m = (n[i] - 0.5) * 0.16 + (streaks ? Math.sin(x * 0.7 + n[i] * 10) * streaks : 0);
      c = [c[0] * (1 + m), c[1] * (1 + m), c[2] * (1 + m)];
      return c;
    }));
  });
}

const phys = (key, opts) => once(`mat:${key}`, () => new THREE.MeshPhysicalMaterial(opts));

/* ───────── leaves (sepals, cilantro) ───────── */

/** Narrow curled sepal radiating from a stem. */
function sepals(count, len, width, color, droop = 0.9) {
  const geo = once(`sepal:${len}:${width}:${droop}`, () => {
    const g = new THREE.PlaneGeometry(len, width, 8, 1);
    g.translate(len / 2, 0, 0);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) / len;
      p.setY(i, p.getY(i) * (1 - x * 0.85)); // taper to a point
      p.setZ(i, -droop * len * x * x + Math.sin(x * 9) * 0.006);
    }
    g.rotateX(-Math.PI / 2);
    g.computeVertexNormals();
    return g;
  });
  const m = phys(`sepal:${color}`, { color, roughness: 0.55, side: THREE.DoubleSide, sheen: 0.4, sheenColor: new THREE.Color('#bfe39a') });
  const grp = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const s = new THREE.Mesh(geo, m);
    s.rotation.y = (i / count) * Math.PI * 2 + Math.sin(i * 3.1) * 0.25;
    s.rotation.z = 0.12;
    s.castShadow = true;
    grp.add(s);
  }
  return grp;
}

/** Curved stem as a tube. */
function stem(key, points, radius, color) {
  const geo = once(`stem:${key}`, () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), 12, radius, 8, false));
  const m = new THREE.Mesh(geo, phys(`stem:${color}`, { color, roughness: 0.7, bumpMap: skinBump(), bumpScale: 0.6 }));
  m.castShadow = true;
  return m;
}

/* ───────── factories ───────── */

function tomato() {
  const g = new THREE.Group();
  const geo = once('tomato', () => {
    const s = new THREE.SphereGeometry(0.38, 56, 36);
    const p = s.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const a = Math.atan2(x, z);
      const lat = y / 0.38;
      const lobe = 1 + 0.045 * Math.cos(a * 5) * (1 - Math.abs(lat)) ** 0.7;
      const dimple = lat > 0.85 ? (lat - 0.85) * 0.5 : 0; // stem shoulder sinks in
      p.setXYZ(i, x * lobe, y * 0.84 - dimple * 0.38, z * lobe);
    }
    s.computeVertexNormals();
    return s;
  });
  const mat = phys('tomato', {
    map: ramp('tomato', [[0, '#9E140B'], [0.55, '#C21F0E'], [0.86, '#C93514'], [1, '#B4561E']]),
    roughness: 0.22, clearcoat: 0.9, clearcoatRoughness: 0.12, bumpMap: skinBump(), bumpScale: 0.25,
  });
  const body = new THREE.Mesh(geo, mat);
  body.castShadow = true;
  const cap = sepals(6, 0.2, 0.05, '#3E6A24', 0.6);
  cap.position.y = 0.27;
  const st = stem('tomato', [[0, 0.26, 0], [0.01, 0.33, 0], [0.05, 0.38, 0.02]], 0.018, '#5A7A31');
  g.add(body, cap, st);
  return g;
}

/** Cross-section of a ripe tomato: wall, septa, gel pockets, seeds. */
const tomatoFace = () => once('tomatoFace', () => {
  const S = 512;
  const c = canvas(S);
  const ctx = c.getContext('2d');
  const cx = S / 2;
  ctx.fillStyle = '#C42410';
  ctx.beginPath(); ctx.arc(cx, cx, S / 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#D53A1B';
  ctx.beginPath(); ctx.arc(cx, cx, S * 0.44, 0, Math.PI * 2); ctx.fill();
  const lobes = 4;
  for (let i = 0; i < lobes; i++) {
    const a = (i / lobes) * Math.PI * 2 + 0.4;
    const lx = cx + Math.cos(a) * S * 0.24;
    const ly = cx + Math.sin(a) * S * 0.24;
    // gel pocket
    const gg = ctx.createRadialGradient(lx, ly, 0, lx, ly, S * 0.15);
    gg.addColorStop(0, '#F07A2E');
    gg.addColorStop(0.7, '#E2531E');
    gg.addColorStop(1, '#C93416');
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.ellipse(lx, ly, S * 0.15, S * 0.11, a, 0, Math.PI * 2);
    ctx.fill();
    // seeds
    for (let k = 0; k < 9; k++) {
      const sa = a + (k - 4) * 0.16;
      const sr = S * (0.2 + (k % 3) * 0.03);
      ctx.fillStyle = '#F2DDA0';
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(sa) * sr, cx + Math.sin(sa) * sr, S * 0.014, S * 0.009, sa, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // central columella
  const cg = ctx.createRadialGradient(cx, cx, 0, cx, cx, S * 0.1);
  cg.addColorStop(0, '#E9A27D');
  cg.addColorStop(1, '#D63B1C');
  ctx.fillStyle = cg;
  ctx.beginPath(); ctx.arc(cx, cx, S * 0.1, 0, Math.PI * 2); ctx.fill();
  return tex(c);
});

function tomatoHalf() {
  const g = new THREE.Group();
  const dome = new THREE.Mesh(
    once('tomatoHalfDome', () => new THREE.SphereGeometry(0.38, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.84, 1)),
    phys('tomatoHalfSkin', { map: ramp('tomatoH', [[0, '#C21F0E'], [1, '#B33A14']]), roughness: 0.22, clearcoat: 0.9, clearcoatRoughness: 0.12, bumpMap: skinBump(), bumpScale: 0.25, side: THREE.DoubleSide })
  );
  const face = new THREE.Mesh(
    once('tomatoFaceGeo', () => new THREE.CircleGeometry(0.38, 48).rotateX(Math.PI / 2)),
    phys('tomatoFace', { map: tomatoFace(), roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, emissive: new THREE.Color('#5a1405'), emissiveMap: tomatoFace(), emissiveIntensity: 0.12 })
  );
  dome.castShadow = face.castShadow = true;
  g.add(dome, face);
  g.rotation.x = Math.PI; // show the cut face first
  return g;
}

function tomatillo() {
  const g = new THREE.Group();
  const fruit = new THREE.Mesh(
    once('tomatillo', () => new THREE.SphereGeometry(0.3, 40, 28).scale(1, 0.82, 1)),
    phys('tomatillo', { map: ramp('tomatillo', [[0, '#6E8A27'], [0.7, '#93AC3D'], [1, '#B4B85A']]), roughness: 0.28, clearcoat: 0.7, bumpMap: skinBump(), bumpScale: 0.2 })
  );
  fruit.castShadow = true;
  // Papery husk, split open along one side
  const husk = new THREE.Mesh(
    once('husk', () => {
      const geo = lathe([v2(0.001, -0.2), v2(0.2, -0.14), v2(0.36, 0.02), v2(0.3, 0.2), v2(0.12, 0.34), v2(0.02, 0.4)], 40, 20, 0.6, Math.PI * 1.45);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const a = Math.atan2(p.getX(i), p.getZ(i));
        const k = 1 + 0.08 * Math.sin(a * 5) + 0.04 * Math.sin(a * 13);
        p.setX(i, p.getX(i) * k);
        p.setZ(i, p.getZ(i) * k);
      }
      geo.computeVertexNormals();
      return geo;
    }),
    phys('husk', { map: ramp('husk', [[0, '#B9A46A'], [0.6, '#CDBE88'], [1, '#9C8A50']], { streaks: 0.08 }), roughness: 0.75, side: THREE.DoubleSide, transparent: true, opacity: 0.92, sheen: 0.6, sheenColor: new THREE.Color('#fff2c8') })
  );
  husk.castShadow = true;
  const st = stem('tomatillo', [[0, 0.38, 0], [0.02, 0.46, 0], [0.06, 0.5, 0]], 0.016, '#7A6E3A');
  g.add(fruit, husk, st);
  return g;
}

function chileFactory(key, { length, radius, tip, colors, corking = 0 }) {
  return () => {
    const g = new THREE.Group();
    const geo = once(`chile:${key}`, () => {
      const pts = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 20; // 0 = tip, 1 = shoulder
        const r = radius * Math.pow(Math.sin(Math.min(1, t * (1 + tip)) * Math.PI * 0.5), 0.6 + tip) * (t > 0.95 ? 1 - (t - 0.95) * 10 : 1);
        pts.push(v2(Math.max(0.002, r), t * length));
      }
      pts.push(v2(0.001, length));
      const geo2 = new THREE.LatheGeometry(pts, 40);
      const p = geo2.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i);
        const t = 1 - y / length;
        const a = Math.atan2(p.getX(i), p.getZ(i));
        const flat = 1 + 0.05 * Math.cos(a * 3); // chiles are never perfectly round
        p.setX(i, p.getX(i) * flat + 0.28 * length * t * t);
        p.setZ(i, p.getZ(i) * flat);
      }
      geo2.computeVertexNormals();
      geo2.translate(-0.1 * length, -length / 2, 0);
      return geo2;
    });
    const body = new THREE.Mesh(geo, phys(`chile:${key}`, {
      map: ramp(`chile:${key}`, colors, { streaks: corking }),
      roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08, bumpMap: streakBump(), bumpScale: 0.35,
    }));
    body.castShadow = true;
    const cap = new THREE.Mesh(
      once(`calyx:${key}`, () => lathe([v2(0.001, -0.03), v2(radius * 0.9, -0.02), v2(radius * 1.05, 0.02), v2(radius * 0.5, 0.05), v2(0.03, 0.07)], 24, 10)),
      phys('calyx', { color: '#3F6A22', roughness: 0.5, bumpMap: skinBump(), bumpScale: 0.5 })
    );
    cap.position.set(-0.1 * length, length / 2 - 0.01, 0);
    const st = stem(`chile:${key}`, [[-0.1 * length, length / 2 + 0.04, 0], [-0.1 * length + 0.01, length / 2 + 0.12, 0], [-0.1 * length + 0.07, length / 2 + 0.18, 0.02]], 0.022, '#567532');
    g.add(body, cap, st);
    return g;
  };
}

function habanero() {
  const g = new THREE.Group();
  const geo = once('habanero', () => {
    const geo2 = lathe([v2(0.001, -0.24), v2(0.07, -0.21), v2(0.17, -0.12), v2(0.24, 0.02), v2(0.23, 0.14), v2(0.15, 0.23), v2(0.04, 0.26), v2(0.001, 0.25)], 48, 28);
    const p = geo2.attributes.position;
    const n = fbm(64, { freq: 8, octaves: 2, seed: 77 });
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = p.getY(i);
      const a = Math.atan2(x, z);
      const wr = n[(Math.floor(((a + Math.PI) / (Math.PI * 2)) * 63) + Math.floor(((y + 0.25) / 0.5) * 63) * 64) & 4095];
      const k = 1 + 0.1 * Math.cos(a * 4) + (wr - 0.5) * 0.12; // 4 lobes + wrinkles
      p.setX(i, x * k);
      p.setZ(i, z * k);
    }
    geo2.computeVertexNormals();
    return geo2;
  });
  const body = new THREE.Mesh(geo, phys('habanero', {
    map: ramp('habanero', [[0, '#D3550A'], [0.6, '#EA6B0E'], [1, '#E58A1C']]), roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08, bumpMap: skinBump(), bumpScale: 0.3,
  }));
  body.castShadow = true;
  const cap = sepals(5, 0.09, 0.05, '#4B6E26', 0.4);
  cap.position.y = 0.24;
  const st = stem('habanero', [[0, 0.24, 0], [0.01, 0.33, 0], [0.06, 0.38, 0.02]], 0.02, '#567532');
  g.add(body, cap, st);
  return g;
}

/** Onion cut face: concentric fleshy rings following the bulb outline. */
const ONION = [v2(0.001, -0.26), v2(0.12, -0.24), v2(0.25, -0.13), v2(0.29, 0.01), v2(0.25, 0.13), v2(0.14, 0.23), v2(0.05, 0.31), v2(0.015, 0.37), v2(0.001, 0.38)];
const onionFace = () => once('onionFace', () => {
  const S = 512;
  const c = canvas(S);
  const ctx = c.getContext('2d');
  const toPx = (x, y) => [(x * 1.25 + 0.5) * S, (1 - (y * 1.25 + 0.5)) * S];
  const outline = new THREE.SplineCurve(ONION).getPoints(40);
  const ringPath = (s, oy) => {
    ctx.beginPath();
    outline.forEach((p, i) => { const [px, py] = toPx(p.x * s, p.y * s + oy); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
    for (let i = outline.length - 1; i >= 0; i--) { const p = outline[i]; const [px, py] = toPx(-p.x * s, p.y * s + oy); ctx.lineTo(px, py); }
    ctx.closePath();
  };
  for (let k = 0; k < 9; k++) {
    const s = 1 - k * 0.105;
    ringPath(s, -0.02 * k * 0.3);
    ctx.fillStyle = k % 2 ? '#F3EEDF' : '#E7E3CC';
    ctx.fill();
    ctx.strokeStyle = 'rgba(190,190,150,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ringPath(1, 0);
  ctx.strokeStyle = '#C9B48A';
  ctx.lineWidth = 6;
  ctx.stroke();
  const t = tex(c);
  t.repeat.set(1.25, 1.25);
  t.offset.set(0.5, 0.5);
  return t;
});

function onionHalf() {
  const g = new THREE.Group();
  const skin = new THREE.Mesh(
    once('onionDome', () => lathe(ONION, 40, 28, 0, Math.PI)),
    phys('onionSkin', { map: ramp('onionSkin', [[0, '#C9AE7E'], [0.5, '#E4D3AE'], [1, '#B9935A']], { streaks: 0.12 }), roughness: 0.55, sheen: 0.8, sheenColor: new THREE.Color('#fff4d6'), bumpMap: streakBump(), bumpScale: 0.3, side: THREE.DoubleSide })
  );
  const face = new THREE.Mesh(
    once('onionFaceGeo', () => {
      const shape = new THREE.Shape();
      const pts = new THREE.SplineCurve(ONION).getPoints(40);
      pts.forEach((p, i) => (i ? shape.lineTo(p.x, p.y) : shape.moveTo(p.x, p.y)));
      for (let i = pts.length - 1; i >= 0; i--) shape.lineTo(-pts[i].x, pts[i].y);
      return new THREE.ShapeGeometry(shape, 12).rotateY(-Math.PI / 2);
    }),
    phys('onionFace', { map: onionFace(), roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.1, sheen: 0.5, emissive: new THREE.Color('#2a2a20'), emissiveMap: onionFace(), emissiveIntensity: 0.15 })
  );
  skin.castShadow = face.castShadow = true;
  g.add(skin, face);
  g.rotation.y = Math.PI / 2;
  return g;
}

/** Cilantro leaflet: lobed, serrated, with lighter veins (alpha-cut). */
const cilantroLeaf = () => once('cilLeaf', () => {
  const S = 256;
  const c = canvas(S);
  const ctx = c.getContext('2d');
  const cx = S / 2;
  ctx.fillStyle = '#3C7A2A';
  ctx.beginPath();
  // three rounded lobes with serrated edges
  const lobes = [[-0.62, 0.62], [0, 0.98], [0.62, 0.62]];
  ctx.moveTo(cx, S * 0.98);
  lobes.forEach(([ang, rr]) => {
    for (let k = -6; k <= 6; k++) {
      const a = -Math.PI / 2 + ang + k * 0.075;
      const r = S * 0.46 * rr * (1 + (k % 2 ? 0.06 : -0.02));
      ctx.lineTo(cx + Math.cos(a) * r, S * 0.98 + Math.sin(a) * r * 1.05);
    }
  });
  ctx.closePath();
  ctx.fill();
  const g = ctx.createLinearGradient(0, 0, 0, S);
  g.addColorStop(0, 'rgba(120,180,80,0.25)');
  g.addColorStop(1, 'rgba(10,40,10,0.25)');
  ctx.fillStyle = g;
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = 'rgba(170,215,130,0.75)';
  ctx.lineWidth = 3;
  [-0.62, 0, 0.62].forEach((ang) => {
    ctx.beginPath();
    ctx.moveTo(cx, S * 0.98);
    ctx.lineTo(cx + Math.cos(-Math.PI / 2 + ang) * S * 0.36, S * 0.98 + Math.sin(-Math.PI / 2 + ang) * S * 0.38);
    ctx.stroke();
  });
  return tex(c);
});

function cilantro() {
  const g = new THREE.Group();
  const leafGeo = once('cilLeafGeo', () => {
    const geo = new THREE.PlaneGeometry(0.26, 0.26, 6, 6);
    geo.translate(0, 0.13, 0);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, (p.getX(i) ** 2) * 1.6 - p.getY(i) * 0.12); // cupped leaf
    geo.computeVertexNormals();
    return geo;
  });
  const leafMat = phys('cilLeaf', { map: cilantroLeaf(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.42, sheen: 0.5, sheenColor: new THREE.Color('#d8f5b0') });
  g.add(stem('cil-main', [[0, -0.32, 0], [0.02, -0.1, 0.01], [0, 0.08, 0], [-0.03, 0.2, 0]], 0.012, '#6E9B44'));
  [[0.02, -0.06, 0.2, 0.9, 0.9], [-0.01, 0.06, -0.4, 2.6, 0.85], [0, 0.2, 0, 0, 1], [0.02, 0.0, 0.6, -2.2, 0.75], [0, -0.16, -0.7, 1.7, 0.7]].forEach(([x, y, rz, ry, s]) => {
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(x, y, 0);
    leaf.rotation.set(0.3, ry, rz);
    leaf.scale.setScalar(s);
    leaf.castShadow = true;
    g.add(leaf);
  });
  return g;
}

/** Lime cross-section: rind, pith, ten juicy segments with vesicles. */
const limeFace = () => once('limeFace', () => {
  const S = 512;
  const c = canvas(S);
  const ctx = c.getContext('2d');
  const cx = S / 2;
  ctx.fillStyle = '#2F6A17';
  ctx.beginPath(); ctx.arc(cx, cx, S / 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#E9EFC9';
  ctx.beginPath(); ctx.arc(cx, cx, S * 0.465, 0, Math.PI * 2); ctx.fill();
  const segs = 10;
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI * 2 + 0.035;
    const a1 = ((i + 1) / segs) * Math.PI * 2 - 0.035;
    const gr = ctx.createRadialGradient(cx, cx, S * 0.04, cx, cx, S * 0.43);
    gr.addColorStop(0, '#D7E58E');
    gr.addColorStop(1, '#A9C548');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos((a0 + a1) / 2) * S * 0.035, cx + Math.sin((a0 + a1) / 2) * S * 0.035);
    ctx.arc(cx, cx, S * 0.43, a0, a1);
    ctx.closePath();
    ctx.fill();
    // juice vesicles: long translucent teardrops radiating outward
    ctx.save();
    ctx.clip();
    for (let k = 0; k < 40; k++) {
      const a = a0 + Math.random() * (a1 - a0);
      const r = S * (0.08 + Math.random() * 0.32);
      ctx.fillStyle = `rgba(${235 + Math.random() * 20},255,${170 + Math.random() * 40},${0.18 + Math.random() * 0.25})`;
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(a) * r, cx + Math.sin(a) * r, S * 0.03, S * 0.008, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.fillStyle = '#EEF2D2';
  ctx.beginPath(); ctx.arc(cx, cx, S * 0.035, 0, Math.PI * 2); ctx.fill();
  return tex(c);
});

function lime() {
  const g = new THREE.Group();
  const face = phys('limeFace', { map: limeFace(), roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06, emissive: new THREE.Color('#ffffff'), emissiveMap: limeFace(), emissiveIntensity: 0.08 });
  const rind = phys('limeRind', { color: '#356F1B', roughness: 0.35, clearcoat: 0.5, bumpMap: skinBump(), bumpScale: 0.6 });
  const slice = new THREE.Mesh(once('lime', () => new THREE.CylinderGeometry(0.34, 0.34, 0.07, 48)), [rind, face, face]);
  slice.rotation.x = Math.PI / 2;
  slice.castShadow = true;
  g.add(slice);
  return g;
}

function mango() {
  const g = new THREE.Group();
  const m = phys('mango', {
    map: ramp('mango', [[0, '#E8890F'], [1, '#F6B02A']]), roughness: 0.24, clearcoat: 1, clearcoatRoughness: 0.1,
    bumpMap: streakBump(), bumpScale: 0.25, emissive: new THREE.Color('#5a2600'), emissiveIntensity: 0.25,
  });
  const geo = once('mango', () => new RoundedBoxGeometry(0.28, 0.28, 0.28, 4, 0.045));
  [[0, 0, 0, 1], [0.24, 0.12, -0.08, 0.75], [-0.12, 0.2, 0.14, 0.6]].forEach(([x, y, z, s], i) => {
    const c = new THREE.Mesh(geo, m);
    c.position.set(x, y, z);
    c.scale.setScalar(s);
    c.rotation.set(i * 0.5, i * 0.8, i * 0.3);
    c.castShadow = true;
    g.add(c);
  });
  return g;
}

function garlic() {
  const g = new THREE.Group();
  const geo = once('garlic', () => {
    const lg = lathe([v2(0.001, -0.17), v2(0.09, -0.14), v2(0.13, -0.03), v2(0.11, 0.08), v2(0.05, 0.17), v2(0.001, 0.22)], 28, 16);
    lg.scale(1, 1, 0.72);
    const p = lg.attributes.position;
    for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) + (p.getY(i) ** 2) * 0.6); // crescent bend
    lg.computeVertexNormals();
    return lg;
  });
  const m = phys('garlic', { map: ramp('garlic', [[0, '#D9C4B0'], [0.35, '#F1E8DA'], [1, '#E9DFCF']], { streaks: 0.05 }), roughness: 0.45, sheen: 1, sheenColor: new THREE.Color('#ffffff'), bumpMap: streakBump(), bumpScale: 0.2 });
  [[0, 0, 0, 0], [0.17, -0.02, 0.03, -0.5], [-0.15, -0.03, 0.04, 0.55]].forEach(([x, y, z, rz]) => {
    const c = new THREE.Mesh(geo, m);
    c.position.set(x, y, z);
    c.rotation.z = rz;
    c.castShadow = true;
    g.add(c);
  });
  return g;
}

function chip() {
  const m = new THREE.Mesh(chipGeometry(), once('chipMat', () => chipMaterial()));
  m.castShadow = true;
  m.scale.setScalar(0.85);
  const g = new THREE.Group();
  g.add(m);
  return g;
}

export const factories = {
  tomato,
  tomatoHalf,
  tomatillo,
  chiliRed: chileFactory('fresno', { length: 0.95, radius: 0.12, tip: 0.2, colors: [[0, '#8E1409'], [0.7, '#B51E0E'], [1, '#A2220F']] }),
  chiliGreen: chileFactory('jalapeno', { length: 0.9, radius: 0.15, tip: 0.6, colors: [[0, '#1E4D12'], [0.6, '#2D6418'], [1, '#2A5A16']], corking: 0.04 }),
  habanero,
  onionHalf,
  onion: onionHalf,
  cilantro,
  lime,
  mango,
  garlic,
  chip,
};

/** Builds one ingredient by name (unknown names fall back to a tomato). */
export function makeIngredient(type) {
  const g = (factories[type] || factories.tomato)();
  g.userData.type = type;
  return g;
}
