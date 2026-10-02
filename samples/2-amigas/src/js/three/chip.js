/**
 * Tortilla chip: a rounded triangle, thin and blistered, gently curved.
 * Shared by the ingredient burst and the chip-dip scene.
 * The dip version adds a salsa "coat" that rises as the chip is dunked.
 */
import * as THREE from 'three';
import { fbm, paint, tex, hex } from './textures.js';

let geoCache = null;
let mapCache = null;

/** Where the chip's tip is, in its own coordinates (used for dunk detection). */
export const CHIP_TIP = new THREE.Vector3(0, -0.45, 0.02);

/**
 * Chip geometry: a finely subdivided sheet, curved like a real fried
 * chip and blistered with noise. The triangle outline comes from the
 * texture's alpha (alphaTest), so the edges stay crisp.
 */
export function chipGeometry() {
  if (geoCache) return geoCache;
  const g = new THREE.PlaneGeometry(0.9, 0.95, 40, 40);
  const p = g.attributes.position;
  const n = fbm(64, { freq: 6, octaves: 3, seed: 17 });
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const nx = Math.floor((x / 0.9 + 0.5) * 63);
    const ny = Math.floor((y / 0.95 + 0.5) * 63);
    const blister = (n[ny * 64 + nx] - 0.5) * 0.045;
    p.setZ(i, x * x * 0.5 + y * y * 0.12 + blister);
  }
  g.computeVertexNormals();
  geoCache = g;
  return g;
}

/** Rounded-triangle outline in texture space (0..1), tip at the bottom. */
function chipPath(ctx, S) {
  const pts = [[0.06, 0.12], [0.94, 0.12], [0.5, 0.97]];
  const r = 0.07 * S;
  ctx.beginPath();
  const P = pts.map(([x, y]) => [x * S, y * S]);
  ctx.moveTo((P[0][0] + P[1][0]) / 2, P[0][1] - 0.025 * S);
  ctx.arcTo(P[1][0], P[1][1], P[2][0], P[2][1], r);
  ctx.arcTo(P[2][0], P[2][1], P[0][0], P[0][1], r * 0.8);
  ctx.arcTo(P[0][0], P[0][1], P[1][0], P[1][1], r);
  ctx.closePath();
}

/** Fried corn colour with toasted blisters, darker edges and salt flecks. Alpha cuts the shape. */
export function chipMaps(size = 512) {
  if (mapCache) return mapCache;
  const big = fbm(size, { freq: 5, octaves: 4, seed: 41 });
  const fine = fbm(size, { freq: 40, octaves: 2, seed: 43 });
  const corn = hex('#DDA548');
  const toast = hex('#9A5A1C');
  const pale = hex('#F0CF84');
  const color = paint(size, (x, y, i) => {
    const t = Math.pow(Math.max(0, big[i] - 0.45) * 2.2, 2);
    let c = [corn[0] + (pale[0] - corn[0]) * fine[i] * 0.5, corn[1] + (pale[1] - corn[1]) * fine[i] * 0.5, corn[2] + (pale[2] - corn[2]) * fine[i] * 0.5];
    c = [c[0] + (toast[0] - c[0]) * t, c[1] + (toast[1] - c[1]) * t, c[2] + (toast[2] - c[2]) * t];
    if (fine[i] > 0.86) c = [250, 246, 236]; // salt
    return c;
  });
  const cctx = color.getContext('2d');
  // Darker fried edge
  cctx.save();
  chipPath(cctx, size);
  cctx.clip();
  cctx.strokeStyle = 'rgba(120,64,18,0.55)';
  cctx.lineWidth = size * 0.05;
  cctx.filter = `blur(${size * 0.012}px)`;
  chipPath(cctx, size);
  cctx.stroke();
  cctx.restore();
  // Cut the outline into alpha
  cctx.globalCompositeOperation = 'destination-in';
  chipPath(cctx, size);
  cctx.fill();
  const bump = paint(size, (x, y, i) => {
    const b = 90 + big[i] * 90 + (fine[i] > 0.86 ? 60 : 0);
    return [b, b, b];
  });
  mapCache = { map: tex(color), bumpMap: tex(bump, { color: false }) };
  return mapCache;
}

/**
 * Chip material. With `coat`, the part of the chip below uCoat (in the
 * chip's own height) turns into glossy salsa with chunky flecks.
 */
export function chipMaterial({ coat = false } = {}) {
  const { map, bumpMap } = chipMaps();
  const m = new THREE.MeshPhysicalMaterial({ map, bumpMap, bumpScale: 1.4, roughness: 0.62, sheen: 0.3, sheenColor: new THREE.Color('#ffe2a8'), alphaTest: 0.5, side: THREE.DoubleSide });
  if (!coat) return m;
  m.userData.uniforms = {
    uCoat: { value: -1 },
    uSalsa: { value: new THREE.Color('#9E2416') },
    uBit: { value: new THREE.Color('#C9442A') },
    uPale: { value: new THREE.Color('#E8DCC4') },
  };
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, m.userData.uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLocal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocal = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vLocal;
        uniform float uCoat; uniform vec3 uSalsa; uniform vec3 uBit; uniform vec3 uPale;
        float hash21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
        float coatMask(){
          float edge = uCoat + 0.025*sin(vLocal.x*38.0) + 0.018*sin(vLocal.x*91.0+1.3);
          return smoothstep(edge + 0.012, edge - 0.012, vLocal.y);
        }`
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        float cm = coatMask();
        vec2 cell = floor(vLocal.xy * 48.0);
        float h = hash21(cell);
        vec3 salsaCol = uSalsa * (0.85 + 0.3*hash21(cell*1.7));
        salsaCol = mix(salsaCol, uBit, step(0.82, h));
        salsaCol = mix(salsaCol, uPale, step(0.95, h));
        diffuseColor.rgb = mix(diffuseColor.rgb, salsaCol, cm);`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.18, coatMask());`
      );
  };
  return m;
}
