/**
 * The salsa jar, built from code and shaded physically:
 * refractive glass (transmission + IOR), wet chunky salsa, a printed
 * paper label and a knurled black steel lid with a gold-printed seal.
 * The label art is painted at runtime from the real logo SVG, so
 * swapping src/assets/logo.svg updates the jar too.
 */
import * as THREE from 'three';
import { brand } from '../../config/content.js';
import { fbm, canvas, tex, salsaMaps } from './textures.js';

const v2 = (x, y) => new THREE.Vector2(x, y);
const smoothProfile = (pts, n = 64) => new THREE.SplineCurve(pts).getPoints(n);

/* Jar dimensions (local units). The jar's base sits on y = 0. */
export const JAR = {
  bottom: 0,
  neckTop: 2.23,
  lidHeight: 0.27,
  mouthY: 2.25,
  height: 2.5,
  centreY: 1.2,
};

export function buildJar({ segments = 96, look, lidTexture, lidMetal, quality = 'high' }) {
  const group = new THREE.Group();

  // Mason-style glass: thick base, straight walls, rounded shoulder, threaded neck.
  const glassProfile = smoothProfile([
    v2(0.001, 0), v2(0.84, 0), v2(0.95, 0.03), v2(0.995, 0.12), v2(1.0, 0.25),
    v2(1.0, 1.75), v2(0.985, 1.89), v2(0.93, 2.0), v2(0.84, 2.07), v2(0.8, 2.11), v2(0.8, 2.23),
  ], 90);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.03,
    transmission: 1,
    thickness: 0.12,
    ior: 1.5,
    attenuationColor: new THREE.Color('#e3efe6'),
    attenuationDistance: 1.4,
    specularIntensity: 1,
    envMapIntensity: 1.25,
  });
  if (quality === 'low') {
    // Phones: skip the extra transmission pass, fake glass with a fresnel edge.
    Object.assign(glassMat, { transmission: 0, transparent: true, opacity: 0.16, depthWrite: false });
    glassMat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <opaque_fragment>',
        `float fres = pow(1.0 - clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0), 2.4);
        gl_FragColor = vec4(outgoingLight + vec3(fres * 0.25), diffuseColor.a * (0.4 + fres * 4.5));`
      );
    };
  }
  const glass = new THREE.Mesh(new THREE.LatheGeometry(glassProfile, segments), glassMat);
  glass.castShadow = false; // the salsa inside casts the shadow
  glass.renderOrder = 3;

  // Glass screw threads on the neck
  const threadGeo = new THREE.TorusGeometry(0.808, 0.014, 8, segments);
  [2.14, 2.2].forEach((y) => {
    const t = new THREE.Mesh(threadGeo, glassMat);
    t.rotation.x = Math.PI / 2;
    t.position.y = y;
    group.add(t);
  });

  // Salsa: slightly inside the glass, filled into the shoulder.
  const salsaProfile = smoothProfile([
    v2(0.001, 0.07), v2(0.83, 0.07), v2(0.93, 0.12), v2(0.958, 0.25), v2(0.958, 1.78),
    v2(0.935, 1.9), v2(0.87, 1.98), v2(0.76, 2.03), v2(0.4, 2.05), v2(0.001, 2.055),
  ], 70);
  const salsaMat = new THREE.MeshPhysicalMaterial({
    map: look.salsa.map,
    bumpMap: look.salsa.bumpMap,
    bumpScale: 1.4,
    roughness: 0.34,
    clearcoat: 0.6,
    clearcoatRoughness: 0.18,
  });
  const salsa = new THREE.Mesh(new THREE.LatheGeometry(salsaProfile, segments), salsaMat);
  salsa.castShadow = true;

  // Paper label wrapping ~234° of the jar.
  const labelArc = Math.PI * 1.3;
  const labelMat = new THREE.MeshPhysicalMaterial({
    map: look.label.map,
    roughnessMap: look.label.roughnessMap,
    bumpMap: look.label.bumpMap,
    bumpScale: 0.6,
    roughness: 1,
    sheen: 0.4,
    sheenRoughness: 0.8,
    sheenColor: new THREE.Color('#ffffff'),
  });
  const label = new THREE.Mesh(new THREE.CylinderGeometry(1.006, 1.006, 1.18, segments * 2, 1, true, -labelArc / 2, labelArc), labelMat);
  label.position.y = 1.02;
  label.castShadow = true;

  // Lid: knurled steel band, printed top, rolled edges.
  const lidPivot = new THREE.Group();
  lidPivot.position.y = JAR.neckTop - 0.11;
  const lidGeo = new THREE.CylinderGeometry(0.87, 0.87, JAR.lidHeight, 240, 4);
  const p = lidGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    if (Math.hypot(x, z) < 0.86) continue;
    const edge = Math.abs(p.getY(i)) > JAR.lidHeight * 0.42 ? 0.3 : 1; // ridges soften toward the edges
    const k = 1 + 0.011 * edge * Math.pow(Math.max(0, Math.cos(Math.atan2(x, z) * 90)), 0.6);
    p.setX(i, x * k);
    p.setZ(i, z * k);
  }
  lidGeo.computeVertexNormals();
  const lidMat = new THREE.MeshPhysicalMaterial({ color: '#141111', metalness: 0.85, roughness: 0.38, clearcoat: 0.4, clearcoatRoughness: 0.3 });
  const lid = new THREE.Mesh(lidGeo, lidMat);
  lid.position.y = JAR.lidHeight / 2;
  lid.castShadow = true;
  const lidTop = new THREE.Mesh(
    new THREE.CircleGeometry(0.86, segments),
    new THREE.MeshPhysicalMaterial({ map: lidTexture, metalnessMap: lidMetal, metalness: 1, roughness: 0.34, clearcoat: 0.5 })
  );
  lidTop.rotation.x = -Math.PI / 2;
  lidTop.position.y = JAR.lidHeight + 0.001;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.872, 0.022, 10, segments * 2), lidMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = JAR.lidHeight;
  const rimLow = rim.clone();
  rimLow.position.y = 0.01;
  lidPivot.add(lid, lidTop, rim, rimLow);

  group.add(salsa, label, glass, lidPivot);
  return { group, lidPivot, materials: { salsaMat, labelMat } };
}

/* ───────── Label + lid artwork ───────── */

const loadImage = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

/**
 * Loads the logo SVGs as images in label ink and lid gold.
 * (The SVG's CSS variables are swapped for real colours so it paints on a canvas.)
 */
export async function loadLogoImages(logoSvg, markSvg) {
  const recolor = (svg, ink, accent) =>
    loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replaceAll('var(--logo-ink,#1C1411)', ink).replaceAll('var(--logo-accent,#B3311E)', accent))}`);
  const [logo, markGold] = await Promise.all([recolor(logoSvg, '#1C1411', '#A92C1B'), recolor(markSvg, '#D9B472', '#D9B472')]);
  return { logo, markGold };
}

const FONT = {
  display: (px) => `${Math.round(px)}px Gloock, "Bodoni Moda", Georgia, serif`,
  body: (px, w = 500) => `${w} ${Math.round(px)}px "Hanken Grotesk", "Helvetica Neue", Arial, sans-serif`,
  caps: (px, w = 600) => `${w} ${Math.round(px)}px "Big Shoulders Text", "Arial Narrow", sans-serif`,
};

function spaced(ctx, text, x, y, spacing, align = 'center') {
  ctx.textAlign = align;
  if ('letterSpacing' in ctx) {
    ctx.letterSpacing = `${spacing}px`;
    ctx.fillText(text, x + (align === 'center' ? spacing / 2 : 0), y);
    ctx.letterSpacing = '0px';
  } else ctx.fillText(text, x, y);
}

function wrap(ctx, text, x, y, maxW, lh) {
  let line = '';
  text.split(' ').forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lh;
    } else line = test;
  });
  if (line) ctx.fillText(line, x, y);
  return y;
}

/**
 * Prints the label for one flavour: colour, roughness (ink is glossier
 * than paper) and bump (paper fibre + pressed ink) maps.
 */
export function makeLabel(f, images, renderer, { width = 2048 } = {}) {
  const W = width;
  const H = Math.round(W / 3.49);
  const k = W / 2048;
  const c = canvas(W, H);
  const ctx = c.getContext('2d');
  const u = (x) => x * W;
  const ink = f.label.ink;

  // Paper with fibre and slightly aged edges
  const fibre = fbm(256, { freq: 32, octaves: 3, seed: 3 });
  const fc = canvas(256);
  const fctx = fc.getContext('2d');
  const fi = fctx.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) {
    const v = 240 + (fibre[i] - 0.5) * 22;
    fi.data.set([v, v, v, 255], i * 4);
  }
  fctx.putImageData(fi, 0, 0);
  ctx.fillStyle = f.label.paper;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = ctx.createPattern(fc, 'repeat');
  ctx.fillRect(0, 0, W, H);
  const vg = ctx.createLinearGradient(0, 0, 0, H);
  vg.addColorStop(0, 'rgba(150,115,80,0.9)');
  vg.addColorStop(0.1, 'rgba(255,255,255,1)');
  vg.addColorStop(0.9, 'rgba(255,255,255,1)');
  vg.addColorStop(1, 'rgba(150,115,80,0.9)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';

  // Double rules top and bottom
  ctx.fillStyle = ink;
  [[0.055, 3], [0.075, 1.2], [0.92, 1.2], [0.94, 3]].forEach(([y, t]) => ctx.fillRect(0, H * y, W, t * k));
  ctx.textBaseline = 'alphabetic';

  /* Front panel */
  const mid = u(0.5);
  if (images.logo) {
    const lw = u(0.2);
    const lh = (lw * images.logo.height) / images.logo.width;
    ctx.drawImage(images.logo, mid - lw / 2, H * 0.13, lw, lh);
  }
  ctx.fillStyle = ink;
  ctx.font = FONT.display(H * 0.15);
  ctx.textAlign = 'center';
  ctx.fillText(f.name, mid, H * 0.54);
  ctx.fillStyle = f.accentDeep;
  ctx.fillRect(mid - u(0.035), H * 0.585, u(0.07), 3 * k);
  ctx.font = FONT.caps(H * 0.05, 700);
  spaced(ctx, f.kind.toUpperCase(), mid, H * 0.67, H * 0.012);
  ctx.fillStyle = ink;
  ctx.font = FONT.caps(H * 0.036, 600);
  spaced(ctx, `HEAT ${f.heat} OF 5 · ${f.heatLabel.toUpperCase()}`, mid, H * 0.765, H * 0.008);
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(mid - H * 0.12 + i * H * 0.06, H * 0.815, H * 0.013, 0, Math.PI * 2);
    if (i < f.heat) {
      ctx.fillStyle = f.accentDeep;
      ctx.fill();
    } else {
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2 * k;
      ctx.stroke();
    }
  }
  ctx.fillStyle = ink;
  ctx.font = FONT.caps(H * 0.034, 600);
  spaced(ctx, '250 mL · 8.5 FL OZ', u(0.42), H * 0.895, H * 0.006);
  spaced(ctx, 'HECHO A MANO', u(0.58), H * 0.895, H * 0.006);

  /* Left panel: ingredients + storage */
  const lx = u(0.17);
  const colW = u(0.15);
  ctx.font = FONT.caps(H * 0.042, 700);
  spaced(ctx, 'INGREDIENTS', lx, H * 0.2, H * 0.008, 'left');
  ctx.font = FONT.body(H * 0.034, 500);
  const y = wrap(ctx, f.ingredients.join(', ') + '.', lx, H * 0.27, colW, H * 0.046);
  ctx.font = FONT.body(H * 0.03, 400);
  wrap(ctx, 'Refrigerate after opening and enjoy within 3 weeks. No preservatives.', lx, y + H * 0.06, colW, H * 0.042);
  ctx.font = FONT.caps(H * 0.032, 600);
  spaced(ctx, `MADE IN ${brand.city.toUpperCase()}`, lx, H * 0.86, H * 0.006, 'left');

  /* Right panel: nutrition facts */
  const rx = u(0.665);
  const rw = u(0.16);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.5 * k;
  ctx.strokeRect(rx, H * 0.15, rw, H * 0.62);
  ctx.textAlign = 'left';
  ctx.font = FONT.display(H * 0.05);
  ctx.fillText('Nutrition Facts', rx + H * 0.02, H * 0.22);
  ctx.font = FONT.body(H * 0.026, 500);
  ctx.fillText('Per 2 tbsp (30 mL)', rx + H * 0.02, H * 0.262);
  ctx.fillRect(rx, H * 0.283, rw, 7 * k);
  const hot = f.heat > 3;
  [['Calories', hot ? '15' : '10'], ['Fat', '0 g'], ['Sodium', '120 mg'], ['Carbohydrate', hot ? '3 g' : '2 g'], ['Sugars', hot ? '2 g' : '1 g'], ['Protein', '0 g']].forEach(([key, val], i) => {
    const fy = H * (0.345 + i * 0.066);
    ctx.font = FONT.body(H * 0.03, i === 0 ? 600 : 500);
    ctx.textAlign = 'left';
    ctx.fillText(key, rx + H * 0.02, fy);
    ctx.textAlign = 'right';
    ctx.fillText(val, rx + rw - H * 0.02, fy);
    ctx.fillRect(rx + H * 0.02, fy + H * 0.02, rw - H * 0.04, 1.2 * k);
  });
  ctx.font = FONT.caps(H * 0.03, 600);
  spaced(ctx, `LOTE ${String(40 + f.heat * 3).padStart(3, '0')} · BEST BEFORE 2027-03`, rx, H * 0.86, H * 0.005, 'left');

  /* Barcode on the far edge (seen when the jar turns) */
  let bx = u(0.862);
  let seed = 7 + f.heat;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  while (bx < u(0.94)) {
    const bw = (1 + Math.floor(rnd() * 3)) * 3 * k;
    if (rnd() > 0.42) ctx.fillRect(bx, H * 0.3, bw, H * 0.42);
    bx += bw + 2.5 * k;
  }
  ctx.textAlign = 'left';
  ctx.font = FONT.body(H * 0.03, 500);
  ctx.fillText(`6 27843 0${f.heat}1${f.heat}5 ${f.heat}`, u(0.862), H * 0.78);

  // Data maps: ink is slightly glossier and pressed into the paper.
  const px = ctx.getImageData(0, 0, W, H).data;
  const rough = canvas(W, H);
  const bump = canvas(W, H);
  const rctx = rough.getContext('2d');
  const bctx = bump.getContext('2d');
  const rimg = rctx.createImageData(W, H);
  const bimg = bctx.createImageData(W, H);
  for (let i = 0, n = W * H; i < n; i++) {
    const lum = (px[i * 4] + px[i * 4 + 1] + px[i * 4 + 2]) / 3;
    const isInk = lum < 150;
    const r = isInk ? 130 : 228;
    const b = isInk ? 96 : 150 + (lum - 225) * 1.6;
    const o = i * 4;
    rimg.data[o] = rimg.data[o + 1] = rimg.data[o + 2] = r;
    bimg.data[o] = bimg.data[o + 1] = bimg.data[o + 2] = b;
    rimg.data[o + 3] = bimg.data[o + 3] = 255;
  }
  rctx.putImageData(rimg, 0, 0);
  bctx.putImageData(bimg, 0, 0);

  return {
    map: tex(c, { renderer }),
    roughnessMap: tex(rough, { color: false }),
    bumpMap: tex(bump, { color: false }),
  };
}

/** All per-flavour textures for the jar. */
export function makeLook(f, images, renderer, { labelWidth = 2048, salsaSize = 512 } = {}) {
  return { label: makeLabel(f, images, renderer, { width: labelWidth }), salsa: salsaMaps(f, renderer, salsaSize) };
}

/** Lid top: black enamel with the seal printed in gold foil (the metalness map marks the foil). */
export function makeLidTextures(images, renderer, size = 512) {
  const c = canvas(size);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#141111';
  ctx.fillRect(0, 0, size, size);
  if (images.markGold) ctx.drawImage(images.markGold, size * 0.19, size * 0.19, size * 0.62, size * 0.62);
  const m = canvas(size);
  const mctx = m.getContext('2d');
  mctx.fillStyle = '#5a5a5a';
  mctx.fillRect(0, 0, size, size);
  if (images.markGold) {
    mctx.filter = 'brightness(4) grayscale(1)';
    mctx.drawImage(images.markGold, size * 0.19, size * 0.19, size * 0.62, size * 0.62);
  }
  return { map: tex(c, { renderer }), metalnessMap: tex(m, { color: false }) };
}
