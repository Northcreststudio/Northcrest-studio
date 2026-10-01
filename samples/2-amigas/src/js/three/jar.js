/**
 * The procedural salsa jar: glass, salsa, label, lid.
 * Everything is built from code (lathe + cylinder geometry), and
 * the label/lid art is painted onto canvases at runtime using the
 * real logo SVG, so swapping src/assets/logo.svg updates the jar too.
 */
import * as THREE from 'three';
import { brand } from '../../config/content.js';

const v2 = (x, y) => new THREE.Vector2(x, y);

/** Smooth a rough profile into many points for a nicer lathe. */
function smoothProfile(points, divisions = 64) {
  const curve = new THREE.SplineCurve(points);
  return curve.getPoints(divisions);
}

/* Jar dimensions (local units). The jar is ~2.5 units tall with lid. */
export const JAR = {
  bottom: -1.15,
  neckTop: 1.08,
  lidHeight: 0.26,
  mouthY: 1.1,
  height: 2.5,
};

export function buildJar({ segments = 64, labelTexture, salsaTexture, lidTexture }) {
  const group = new THREE.Group();

  // Glass outer profile: flat base, straight sides, rounded shoulder, short threaded neck.
  const glassProfile = smoothProfile([
    v2(0.001, -1.15), v2(0.8, -1.15), v2(0.94, -1.12), v2(0.995, -1.03), v2(1.0, -0.9),
    v2(1.0, 0.6), v2(0.985, 0.74), v2(0.93, 0.85), v2(0.84, 0.92), v2(0.8, 0.96), v2(0.8, 1.08),
  ], 80);
  const glassGeo = new THREE.LatheGeometry(glassProfile, segments);

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.06,
    metalness: 0,
    transparent: true,
    opacity: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.6,
    depthWrite: false,
  });
  // Fresnel: nearly clear face-on, brighter and more opaque at the edges,
  // which is what makes glass read as glass.
  glassMat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `float fres = pow(1.0 - clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0), 2.2);
      gl_FragColor = vec4(outgoingLight + vec3(fres * 0.35), diffuseColor.a * (0.45 + fres * 4.0));`
    );
  };
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.renderOrder = 3;

  // A faint back-face pass gives the glass some thickness.
  const glassBack = new THREE.Mesh(
    glassGeo,
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.1, transparent: true, opacity: 0.1, side: THREE.BackSide, depthWrite: false })
  );
  glassBack.renderOrder = 2;

  // Salsa fill: slightly inside the glass, with a gently domed top.
  const salsaProfile = smoothProfile([
    v2(0.001, -1.09), v2(0.82, -1.09), v2(0.93, -1.02), v2(0.955, -0.9), v2(0.955, 0.6),
    v2(0.935, 0.72), v2(0.87, 0.81), v2(0.76, 0.86), v2(0.4, 0.88), v2(0.001, 0.885),
  ], 64);
  const salsaMat = new THREE.MeshStandardMaterial({ map: salsaTexture, roughness: 0.32, metalness: 0 });
  const salsa = new THREE.Mesh(new THREE.LatheGeometry(salsaProfile, segments), salsaMat);

  // Label: an open cylinder wrapping ~234° around the front.
  const labelArc = Math.PI * 1.3;
  const labelGeo = new THREE.CylinderGeometry(1.008, 1.008, 1.18, segments * 2, 1, true, -labelArc / 2, labelArc);
  const labelMat = new THREE.MeshStandardMaterial({ map: labelTexture, roughness: 0.55, metalness: 0 });
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.y = -0.18;
  label.renderOrder = 4;

  // Lid with knurled ridges (vertices pushed out in a wave around the rim).
  const lidPivot = new THREE.Group();
  lidPivot.position.y = JAR.neckTop;
  const lidGeo = new THREE.CylinderGeometry(0.87, 0.87, JAR.lidHeight, 144, 2);
  const pos = lidGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    if (r < 0.86) continue; // skip cap centres
    const a = Math.atan2(x, z);
    const k = 1 + 0.018 * Math.max(0, Math.cos(a * 48));
    pos.setX(i, x * k);
    pos.setZ(i, z * k);
  }
  lidGeo.computeVertexNormals();
  const lidMat = new THREE.MeshStandardMaterial({ color: 0xffb01f, roughness: 0.32, metalness: 0.45 });
  const lid = new THREE.Mesh(lidGeo, lidMat);
  lid.position.y = JAR.lidHeight / 2;
  const lidTop = new THREE.Mesh(
    new THREE.CircleGeometry(0.8, segments),
    new THREE.MeshStandardMaterial({ map: lidTexture, roughness: 0.4, metalness: 0.2 })
  );
  lidTop.rotation.x = -Math.PI / 2;
  lidTop.position.y = JAR.lidHeight + 0.002;
  // Rolled rim at the lid's bottom edge.
  const lidRim = new THREE.Mesh(new THREE.TorusGeometry(0.875, 0.03, 8, segments * 2), lidMat);
  lidRim.rotation.x = Math.PI / 2;
  lidRim.position.y = 0.01;
  lidPivot.add(lid, lidTop, lidRim);

  // Glass screw threads on the neck (visible when the lid pops off).
  const threadMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.1, transparent: true, opacity: 0.35, clearcoat: 1 });
  [0.99, 1.04].forEach((y) => {
    const thread = new THREE.Mesh(new THREE.TorusGeometry(0.805, 0.012, 6, segments), threadMat);
    thread.rotation.x = Math.PI / 2;
    thread.position.y = y;
    group.add(thread);
  });

  group.add(salsa, label, glassBack, glass, lidPivot);
  return { group, lidPivot, materials: { salsaMat, labelMat } };
}

/* ───────────── Canvas textures ───────────── */

const loadImage = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

/** Loads the logo SVGs as images so they can be painted onto canvases. */
export async function loadLogoImages(logoUrl, markUrl) {
  const [logo, mark] = await Promise.all([loadImage(logoUrl), loadImage(markUrl)]);
  return { logo, mark };
}

const toTexture = (canvas, renderer) => {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return tex;
};

function scallopBand(ctx, w, y, h, color, down) {
  ctx.fillStyle = color;
  ctx.fillRect(0, down ? y : y + h * 0.45, w, h * 0.55);
  const r = h * 0.45;
  for (let x = r; x < w + r; x += r * 2) {
    ctx.beginPath();
    ctx.arc(x, down ? y + h * 0.55 : y + h * 0.45, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function chili(ctx, x, y, s, fill) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 32, s / 32);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(21, 9);
  ctx.bezierCurveTo(24, 14, 22, 21, 17, 25);
  ctx.bezierCurveTo(13, 28, 8, 29, 4, 28);
  ctx.bezierCurveTo(8, 26, 11, 22, 12, 17);
  ctx.bezierCurveTo(13, 13, 15, 9, 18, 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2FA84F';
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(17, 9);
  ctx.quadraticCurveTo(19, 5, 23, 6);
  ctx.stroke();
  ctx.restore();
}

/** Paints the jar label for one flavour. */
export function makeLabelTexture(f, images, renderer, { width = 2048 } = {}) {
  const W = width;
  const H = Math.round(width * 0.29);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const u = (x) => x * W;
  const display = (px) => `${Math.round(px)}px "Bagel Fat One", "Arial Rounded MT Bold", sans-serif`;
  const body = (px, weight = 700) => `${weight} ${Math.round(px)}px "DM Sans", system-ui, sans-serif`;

  // Paper + subtle grain
  ctx.fillStyle = f.label.paper;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(34,16,63,0.035)';
  for (let i = 0; i < 1400; i++) ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);

  // Papel-picado style scalloped bands top and bottom
  const band = H * 0.12;
  scallopBand(ctx, W, 0, band, f.accent, true);
  scallopBand(ctx, W, H - band, band, f.accent, false);
  // tiny cut-out dots in the bands
  ctx.fillStyle = f.label.paper;
  for (let x = H * 0.06; x < W; x += H * 0.12) {
    ctx.beginPath();
    ctx.arc(x, band * 0.3, H * 0.012, 0, Math.PI * 2);
    ctx.arc(x, H - band * 0.3, H * 0.012, 0, Math.PI * 2);
    ctx.fill();
  }

  // Logo lockup, front and centre
  const midX = u(0.5);
  if (images.logo) {
    const lw = u(0.25);
    const lh = lw * (images.logo.height / images.logo.width || 100 / 380);
    ctx.drawImage(images.logo, midX - lw / 2, H * 0.17, lw, lh);
  } else {
    ctx.fillStyle = f.label.ink;
    ctx.font = display(H * 0.16);
    ctx.textAlign = 'center';
    ctx.fillText(brand.name, midX, H * 0.34);
  }

  // Flavour name
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = f.accentDeep;
  ctx.font = display(H * 0.17);
  ctx.fillText(f.name, midX, H * 0.64);

  // Heat chilis + label
  const cs = H * 0.075;
  const startX = midX - (5 * cs * 1.1) / 2 - u(0.045);
  for (let i = 0; i < 5; i++) chili(ctx, startX + i * cs * 1.1, H * 0.68, cs, i < f.heat ? f.accent : 'rgba(34,16,63,0.15)');
  ctx.fillStyle = f.label.ink;
  ctx.font = body(H * 0.045, 800);
  ctx.textAlign = 'left';
  ctx.fillText(`HEAT ${f.heat}/5 · ${f.heatLabel.toUpperCase()}`, startX + 5 * cs * 1.1 + H * 0.02, H * 0.735);

  // Left panel: "homemade salsa" stamp
  ctx.textAlign = 'center';
  ctx.fillStyle = f.label.ink;
  ctx.font = display(H * 0.075);
  ctx.fillText('Homemade', u(0.25), H * 0.4);
  ctx.fillText('Salsa', u(0.25), H * 0.49);
  ctx.font = body(H * 0.04, 700);
  ctx.fillText('SMALL BATCH · HECHO A MANO', u(0.25), H * 0.58);
  ctx.strokeStyle = f.accent;
  ctx.lineWidth = H * 0.012;
  ctx.beginPath();
  ctx.arc(u(0.25), H * 0.46, H * 0.25, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.font = body(H * 0.038, 500);
  ctx.fillText('250 mL', u(0.25), H * 0.7);

  // Right panel: ingredients
  ctx.textAlign = 'left';
  ctx.font = body(H * 0.04, 800);
  const rx = u(0.66);
  ctx.fillText('INGREDIENTS', rx, H * 0.32);
  ctx.font = body(H * 0.036, 500);
  let y = H * 0.4;
  const maxW = u(0.17);
  let line = '';
  f.ingredients.join(', ').split(' ').forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW) {
      ctx.fillText(line, rx, y);
      line = word;
      y += H * 0.05;
    } else line = test;
  });
  if (line) ctx.fillText(line, rx, y);
  ctx.font = body(H * 0.034, 700);
  ctx.fillText(`Made in ${brand.city}`, rx, H * 0.78);

  // Little marigold flowers between panels
  [0.375, 0.625].forEach((p) => {
    const fx = u(p);
    const fy = H * 0.5;
    ctx.fillStyle = '#FFB01F';
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(fx + Math.cos(a) * H * 0.04, fy + Math.sin(a) * H * 0.04, H * 0.028, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#E5197A';
    ctx.beginPath();
    ctx.arc(fx, fy, H * 0.03, 0, Math.PI * 2);
    ctx.fill();
  });

  return toTexture(c, renderer);
}

/** Chunky salsa texture: base colour with blobs of tomato, onion, herbs. */
export function makeSalsaTexture(f, renderer, size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = f.salsa;
  ctx.fillRect(0, 0, size, size);
  // Seeded-ish randomness so every load looks the same.
  let seed = f.id.length * 9301;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  // Darker flecks first (char + depth), then the chunky bits on top.
  for (let i = 0; i < 260; i++) {
    ctx.globalAlpha = 0.18 + rnd() * 0.2;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(rnd() * size, rnd() * size, 1 + rnd() * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 520; i++) {
    ctx.globalAlpha = 0.35 + rnd() * 0.5;
    ctx.fillStyle = f.salsaBits[i % 7 === 0 ? 1 : i % 3 === 0 ? 2 : 0];
    const x = rnd() * size;
    const y = rnd() * size;
    const r = (1.5 + rnd() * (i % 6 === 0 ? 6 : 3)) * (size / 512);
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.6 + rnd() * 0.6), rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const tex = toTexture(c, renderer);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  return tex;
}

/** Lid top: marigold disc with the chili mark. */
export function makeLidTexture(images, renderer, size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size * 0.4, size * 0.4, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, '#FFC94D');
  g.addColorStop(1, '#F59E0B');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#22103F';
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = size * 0.012;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.42, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#FFF3E0';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.32, 0, Math.PI * 2);
  ctx.fill();
  if (images.mark) ctx.drawImage(images.mark, size * 0.24, size * 0.22, size * 0.52, size * 0.52);
  return toTexture(c, renderer);
}

/** Soft round shadow that sits under the jar. */
export function makeShadowTexture(renderer) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(34,16,63,0.55)');
  g.addColorStop(0.5, 'rgba(34,16,63,0.22)');
  g.addColorStop(1, 'rgba(34,16,63,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return toTexture(c, renderer);
}
