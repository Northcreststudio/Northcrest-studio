/**
 * Procedural 3D ingredients: no model files, just geometry.
 * Each factory returns a small Group roughly 0.4–0.6 units across.
 * Geometries and materials are cached and shared between copies,
 * so 30 ingredients cost very little.
 *
 * To add a new ingredient: write a factory below, add it to
 * `factories`, then use its key in a flavour's `ingredients3D`.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const cache = new Map();
const once = (key, make) => {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
};

const mat = (color, opts = {}) => once(`m:${color}:${JSON.stringify(opts)}`, () => new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0, ...opts }));
const v2 = (x, y) => new THREE.Vector2(x, y);

/* ───────── helpers ───────── */

/** Bendy chili body: a tapered lathe, then curved along its length. */
function chiliGeometry(key, { length = 0.9, radius = 0.11, bend = 0.32 }) {
  return once(key, () => {
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16; // 0 = tip, 1 = shoulder
      const r = radius * Math.pow(Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.5), 0.8) * (t > 0.93 ? 1 - (t - 0.93) * 8 : 1);
      pts.push(v2(Math.max(0.001, r), t * length));
    }
    pts.push(v2(0.001, length));
    const g = new THREE.LatheGeometry(pts, 18);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      const t = 1 - y / length;
      p.setX(i, p.getX(i) + bend * t * t);
    }
    g.computeVertexNormals();
    g.translate(-bend * 0.3, -length / 2, 0);
    return g;
  });
}

function stem(color = '#2F7A2A', h = 0.14) {
  const m = new THREE.Mesh(once(`stem:${h}`, () => new THREE.CylinderGeometry(0.025, 0.035, h, 8)), mat(color));
  return m;
}

/** Star-shaped leafy cap (tomato calyx, tomatillo husk). */
function calyx(color, size = 0.16, droop = 0.4, count = 5) {
  const g = new THREE.Group();
  const geo = once(`calyx:${size}`, () => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.quadraticCurveTo(size * 0.35, size * 0.5, 0, size);
    s.quadraticCurveTo(-size * 0.35, size * 0.5, 0, 0);
    return new THREE.ShapeGeometry(s, 6);
  });
  for (let i = 0; i < count; i++) {
    const leaf = new THREE.Mesh(geo, mat(color, { side: THREE.DoubleSide }));
    const piv = new THREE.Group();
    piv.rotation.y = (i / count) * Math.PI * 2;
    leaf.rotation.x = -Math.PI / 2 + droop;
    piv.add(leaf);
    g.add(piv);
  }
  return g;
}

/* ───────── ingredient factories ───────── */

function tomato() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(once('tomato', () => {
    const geo = new THREE.SphereGeometry(0.26, 28, 18);
    const p = geo.attributes.position;
    // gentle lobes + a squashed top for a beefsteak look
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const a = Math.atan2(x, z);
      const k = 1 + 0.05 * Math.cos(a * 5) * (1 - Math.abs(y) / 0.26);
      p.setXYZ(i, x * k, y * 0.82, z * k);
    }
    geo.computeVertexNormals();
    return geo;
  }), mat('#E8341C', { roughness: 0.28 }));
  const cap = calyx('#2F8A2E', 0.13, 0.25, 5);
  cap.position.y = 0.2;
  const s = stem();
  s.position.y = 0.25;
  g.add(body, cap, s);
  return g;
}

function tomatillo() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(once('tomatillo', () => new THREE.SphereGeometry(0.22, 24, 16).scale(1, 0.85, 1)), mat('#A3CF4A', { roughness: 0.35 }));
  const husk = calyx('#D9C27A', 0.24, 1.2, 6);
  husk.position.y = 0.16;
  const s = stem('#8A7A3A', 0.1);
  s.position.y = 0.22;
  g.add(body, husk, s);
  return g;
}

function chiliFactory(color, key) {
  return () => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(chiliGeometry(`chili:${key}`, { length: 0.86, radius: 0.1, bend: 0.3 }), mat(color, { roughness: 0.2 }));
    const cap = calyx('#2F7A2A', 0.08, 0.6, 5);
    cap.position.set(-0.09, 0.42, 0);
    const s = stem('#2F7A2A', 0.16);
    s.position.set(-0.08, 0.5, 0);
    s.rotation.z = 0.4;
    g.add(body, cap, s);
    return g;
  };
}

function habanero() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(once('habanero', () => {
    const pts = [v2(0.001, -0.18), v2(0.06, -0.16), v2(0.14, -0.08), v2(0.19, 0.03), v2(0.18, 0.12), v2(0.12, 0.19), v2(0.001, 0.21)];
    const geo = new THREE.LatheGeometry(new THREE.SplineCurve(pts).getPoints(16), 24);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      const k = 1 + 0.12 * Math.cos(Math.atan2(x, z) * 4);
      p.setX(i, x * k);
      p.setZ(i, z * k);
    }
    geo.computeVertexNormals();
    return geo;
  }), mat('#FF8A00', { roughness: 0.18 }));
  const s = stem('#2F7A2A', 0.12);
  s.position.y = 0.25;
  g.add(body, s);
  return g;
}

function onion() {
  // A stack of onion rings reads instantly at small sizes.
  const g = new THREE.Group();
  const ringMat = mat('#F6ECF4', { roughness: 0.3 });
  const edgeMat = mat('#B65C9D', { roughness: 0.35 });
  [[0.24, 0.04, edgeMat], [0.17, 0.035, ringMat], [0.1, 0.03, ringMat]].forEach(([r, t, m]) => {
    const ring = new THREE.Mesh(once(`ring:${r}`, () => new THREE.TorusGeometry(r, t, 10, 36)), m);
    g.add(ring);
  });
  return g;
}

function cilantro() {
  const g = new THREE.Group();
  const leafGeo = once('cilantro-leaf', () => {
    // Three-lobed, frilly leaf
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(0.08, 0.02, 0.12, 0.08, 0.1, 0.12);
    s.bezierCurveTo(0.14, 0.14, 0.12, 0.2, 0.06, 0.2);
    s.bezierCurveTo(0.05, 0.26, -0.05, 0.26, -0.06, 0.2);
    s.bezierCurveTo(-0.12, 0.2, -0.14, 0.14, -0.1, 0.12);
    s.bezierCurveTo(-0.12, 0.08, -0.08, 0.02, 0, 0);
    return new THREE.ShapeGeometry(s, 8);
  });
  const leafMat = mat('#3E9D3A', { side: THREE.DoubleSide, roughness: 0.5 });
  const stemMesh = new THREE.Mesh(once('cil-stem', () => new THREE.CylinderGeometry(0.012, 0.016, 0.4, 6)), mat('#5DAA3E'));
  stemMesh.position.y = -0.1;
  g.add(stemMesh);
  [[0, 0.1, 0], [-0.9, 0, 0.6], [0.9, -0.05, -0.6], [0.2, 0.06, 2.4]].forEach(([rz, y, ry]) => {
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    const piv = new THREE.Group();
    piv.position.y = y;
    piv.rotation.set(0.3, ry, rz);
    piv.add(leaf);
    g.add(piv);
  });
  return g;
}

function limeTexture() {
  return once('lime-tex', () => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#4FA83A';
    ctx.beginPath(); ctx.arc(128, 128, 128, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#F4F9D9';
    ctx.beginPath(); ctx.arc(128, 128, 116, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 10; i++) {
      const a0 = (i / 10) * Math.PI * 2 + 0.05;
      const a1 = ((i + 1) / 10) * Math.PI * 2 - 0.05;
      ctx.fillStyle = i % 2 ? '#B9E26A' : '#C6EA7A';
      ctx.beginPath();
      ctx.moveTo(128 + Math.cos((a0 + a1) / 2) * 10, 128 + Math.sin((a0 + a1) / 2) * 10);
      ctx.arc(128, 128, 106, a0, a1);
      ctx.closePath();
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

function lime() {
  const g = new THREE.Group();
  const face = mat('#ffffff', { map: limeTexture(), roughness: 0.25 });
  const rind = mat('#4FA83A', { roughness: 0.35 });
  const slice = new THREE.Mesh(once('lime', () => new THREE.CylinderGeometry(0.26, 0.26, 0.06, 32)), [rind, face, face]);
  slice.rotation.x = Math.PI / 2;
  g.add(slice);
  return g;
}

function mango() {
  const g = new THREE.Group();
  const m = mat('#FFB020', { roughness: 0.22 });
  const geo = once('mango', () => new RoundedBoxGeometry(0.24, 0.24, 0.24, 3, 0.05));
  const a = new THREE.Mesh(geo, m);
  const b = new THREE.Mesh(geo, m);
  b.position.set(0.18, 0.12, -0.06);
  b.scale.setScalar(0.7);
  b.rotation.set(0.4, 0.6, 0.2);
  g.add(a, b);
  return g;
}

function garlic() {
  const g = new THREE.Group();
  const geo = once('garlic', () => {
    const pts = [v2(0.001, -0.15), v2(0.08, -0.12), v2(0.11, -0.02), v2(0.09, 0.08), v2(0.04, 0.15), v2(0.001, 0.19)];
    const lg = new THREE.LatheGeometry(new THREE.SplineCurve(pts).getPoints(12), 16);
    lg.scale(1, 1, 0.75);
    return lg;
  });
  const m = mat('#F5EBD8', { roughness: 0.4 });
  [[0, 0, 0, 0], [0.13, -0.02, 0.02, -0.5], [-0.12, -0.03, 0.03, 0.5]].forEach(([x, y, z, rz]) => {
    const c = new THREE.Mesh(geo, m);
    c.position.set(x, y, z);
    c.rotation.z = rz;
    g.add(c);
  });
  return g;
}

export const factories = {
  tomato,
  tomatillo,
  chiliRed: chiliFactory('#E8251C', 'red'),
  chiliGreen: chiliFactory('#2E9E3A', 'green'),
  habanero,
  onion,
  cilantro,
  lime,
  mango,
  garlic,
};

/** Builds one ingredient by name (falls back to a tomato for unknown names). */
export function makeIngredient(type) {
  const g = (factories[type] || factories.tomato)();
  g.userData.type = type;
  return g;
}
