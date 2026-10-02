/**
 * Chip-dip scene: a stoneware bowl of salsa on a walnut board.
 * Drag the tortilla chip into the bowl; the salsa coat rises as far as
 * the chip goes under, droplets fly (and land on the board), ripples
 * spread across the surface. Let go to eat it; a fresh chip comes up.
 *
 * Lazy-loaded when the section gets near the screen (see chipDip.js).
 */
import * as THREE from 'three';
import { flavours } from '../../config/flavours.js';
import { studioEnvironment, woodMaps, salsaMaps, fbm, paint, tex, radial } from './textures.js';
import { chipGeometry, chipMaterial, CHIP_TIP } from './chip.js';
import { isMobile, isLowPower, cappedDPR, prefersReducedMotion, clamp, watchVisibility } from '../env.js';

const SURFACE_Y = 0.68; // salsa level in the bowl
const SALSA_R = 1.4;
const CHIP_SCALE = 1.3;
const v2 = (x, y) => new THREE.Vector2(x, y);

export function createDipScene({ host, flavourIndex, onDip, onEat, onReady }) {
  const renderer = new THREE.WebGLRenderer({ antialias: !isLowPower, powerPreference: 'high-performance' });
  renderer.setPixelRatio(cappedDPR());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.domElement.className = 'dip__gl';
  host.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0f0b09');
  scene.environment = studioEnvironment(renderer);
  scene.environmentIntensity = 0.8;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);

  const key = new THREE.SpotLight('#ffe4c4', 260, 0, 0.55, 1, 2);
  key.position.set(-3.5, 8.5, 3);
  key.target.position.set(0, 0, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
  key.shadow.radius = 8;
  key.shadow.blurSamples = 16;
  key.shadow.bias = -0.0004;
  const rim = new THREE.DirectionalLight('#ffd9b0', 1.2);
  rim.position.set(4, 3, -5);
  scene.add(key, key.target, rim, new THREE.HemisphereLight('#f0e2d2', '#140d0a', 0.1));

  /* Walnut board */
  const wood = woodMaps(renderer, isMobile ? 512 : 1024);
  [wood.map, wood.roughnessMap, wood.bumpMap].forEach((t) => t.repeat.set(2.5, 2.5));
  const table = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.MeshPhysicalMaterial({ ...wood, bumpScale: 0.8, roughness: 1, clearcoat: 0.25, clearcoatRoughness: 0.5 }));
  table.rotation.x = -Math.PI / 2;
  table.receiveShadow = true;
  scene.add(table);

  /* Stoneware bowl: speckled matte outside, glossy cream glaze inside */
  const speck = fbm(256, { freq: 48, octaves: 2, seed: 91 });
  const outerMap = tex(paint(256, (x, y, i) => (speck[i] > 0.8 ? [24, 20, 18] : [58 + speck[i] * 18, 50 + speck[i] * 16, 46 + speck[i] * 14])), { repeat: [4, 2] });
  const innerMap = tex(paint(256, (x, y, i) => (speck[i] > 0.86 ? [120, 100, 82] : [232 - speck[i] * 14, 222 - speck[i] * 14, 204 - speck[i] * 12])), { repeat: [4, 2] });
  const lathe = (pts, n) => new THREE.LatheGeometry(new THREE.SplineCurve(pts).getPoints(n), isMobile ? 64 : 96);
  const outer = new THREE.Mesh(
    lathe([v2(0.001, 0), v2(0.68, 0), v2(0.74, 0.04), v2(0.72, 0.1), v2(1.08, 0.3), v2(1.45, 0.6), v2(1.6, 0.86), v2(1.62, 0.92)], 40),
    new THREE.MeshPhysicalMaterial({ map: outerMap, roughness: 0.78, bumpMap: tex(paint(128, (x, y, i) => { const v = 120 + speck[i * 4 % speck.length] * 90; return [v, v, v]; }), { color: false, repeat: [6, 3] }), bumpScale: 0.6 })
  );
  const inner = new THREE.Mesh(
    lathe([v2(1.56, 0.92), v2(1.5, 0.83), v2(1.36, 0.56), v2(1.0, 0.31), v2(0.5, 0.17), v2(0.001, 0.15)], 40),
    new THREE.MeshPhysicalMaterial({ map: innerMap, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide })
  );
  const lip = new THREE.Mesh(new THREE.TorusGeometry(1.59, 0.036, 12, isMobile ? 96 : 160), inner.material);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 0.92;
  [outer, inner, lip].forEach((m) => {
    m.castShadow = true;
    m.receiveShadow = true;
  });
  const bowlAO = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), new THREE.MeshBasicMaterial({ map: tex(radial(128, [[0, 'rgba(0,0,0,0.75)'], [0.38, 'rgba(0,0,0,0.5)'], [0.62, 'rgba(0,0,0,0.1)'], [1, 'rgba(0,0,0,0)']])), transparent: true, depthWrite: false }));
  bowlAO.rotation.x = -Math.PI / 2;
  bowlAO.position.y = 0.004;
  scene.add(outer, inner, lip, bowlAO);

  /* Salsa surface: lumpy, wet, with chunks sitting in it */
  const looks = flavours.map((f) => salsaMaps(f, renderer, isMobile ? 256 : 512));
  looks.forEach((l) => [l.map, l.bumpMap].forEach((t) => t.repeat.set(1.6, 1.6)));
  const surfGeo = new THREE.RingGeometry(0.001, SALSA_R, 72, 18);
  const lump = fbm(64, { freq: 6, octaves: 3, seed: 5 });
  const sp = surfGeo.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const x = sp.getX(i);
    const y = sp.getY(i);
    const n = lump[(Math.floor((x / 3 + 0.5) * 63) & 63) * 64 + (Math.floor((y / 3 + 0.5) * 63) & 63)];
    const edge = Math.hypot(x, y) / SALSA_R;
    sp.setZ(i, (n - 0.5) * 0.07 * (1 - edge * edge) + edge ** 6 * 0.02); // meniscus at the wall
  }
  surfGeo.computeVertexNormals();
  surfGeo.rotateX(-Math.PI / 2);
  const salsaMat = new THREE.MeshPhysicalMaterial({ map: looks[flavourIndex].map, bumpMap: looks[flavourIndex].bumpMap, bumpScale: 2.5, roughness: 0.26, clearcoat: 0.8, clearcoatRoughness: 0.12 });
  const surface = new THREE.Mesh(surfGeo, salsaMat);
  surface.position.y = SURFACE_Y;
  surface.receiveShadow = true;
  scene.add(surface);

  const CHUNKS = isMobile ? 40 : 80;
  const chunkMat = new THREE.MeshPhysicalMaterial({ roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.15 });
  const chunks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.055, 0), chunkMat, CHUNKS);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const sv = new THREE.Vector3();
  const pv = new THREE.Vector3();
  for (let i = 0; i < CHUNKS; i++) {
    const a = i * 2.39996;
    const r = Math.sqrt((i + 0.5) / CHUNKS) * SALSA_R * 0.9;
    pv.set(Math.cos(a) * r, SURFACE_Y + 0.005, Math.sin(a) * r);
    q.setFromEuler(new THREE.Euler(i, i * 2, i * 3));
    const k = 0.6 + ((i * 7) % 5) / 6;
    sv.set(k * 1.3, k * 0.55, k);
    chunks.setMatrixAt(i, m4.compose(pv, q, sv));
  }
  chunks.castShadow = true;
  scene.add(chunks);
  const colorChunks = (f) => {
    const c = new THREE.Color();
    for (let i = 0; i < CHUNKS; i++) chunks.setColorAt(i, c.set(f.salsaBits[i % 5 === 0 ? 1 : i % 3 === 0 ? 2 : 0]));
    chunks.instanceColor.needsUpdate = true;
  };
  colorChunks(flavours[flavourIndex]);

  /* A few chips resting on the board beside the bowl */
  const plainChip = chipMaterial();
  [[-2.35, 0.03, 1.2, -1.45, 0.4], [-2.0, 0.07, 1.65, -1.35, -0.9], [-2.7, 0.05, 1.9, -1.6, 2.2], [2.3, 0.03, 1.5, -1.5, 1.1]].forEach(([x, y, z, rx, rz]) => {
    const c = new THREE.Mesh(chipGeometry(), plainChip);
    c.scale.setScalar(CHIP_SCALE);
    c.position.set(x, y, z);
    c.rotation.set(rx, 0, rz);
    c.castShadow = true;
    c.receiveShadow = true;
    scene.add(c);
  });

  /* The chip you hold */
  const coatMat = chipMaterial({ coat: true });
  const chip = new THREE.Mesh(chipGeometry(), coatMat);
  chip.scale.setScalar(CHIP_SCALE);
  chip.castShadow = true;
  scene.add(chip);
  const setCoatColours = (f) => {
    coatMat.userData.uniforms.uSalsa.value.set(f.salsa);
    coatMat.userData.uniforms.uBit.value.set(f.salsaBits[0]);
    coatMat.userData.uniforms.uPale.value.set(f.salsaBits[1]);
  };
  setCoatColours(flavours[flavourIndex]);

  /* Droplets, crumbs, ripples */
  const DROPS = isMobile ? 50 : 90;
  const dropMat = new THREE.MeshPhysicalMaterial({ color: flavours[flavourIndex].salsa, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05 });
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), dropMat, DROPS);
  drops.castShadow = true;
  drops.count = 0;
  scene.add(drops);
  const dropState = [];
  const CRUMBS = isMobile ? 24 : 40;
  const crumbs = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(0.06, 0), new THREE.MeshPhysicalMaterial({ color: '#D9A44A', roughness: 0.6, sheen: 0.3 }), CRUMBS);
  crumbs.castShadow = true;
  crumbs.count = 0;
  scene.add(crumbs);
  const crumbState = [];
  const ripples = Array.from({ length: 6 }, () => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = SURFACE_Y + 0.03;
    m.userData = { life: 1, x: 0, z: 0 };
    scene.add(m);
    return m;
  });
  let rippleIdx = 0;
  const ripple = (x, z, size = 1) => {
    const r = ripples[rippleIdx++ % ripples.length];
    r.userData = { life: 0, x, z, size };
    r.position.x = x;
    r.position.z = z;
  };

  /* ── Framing ── */
  const rest = new THREE.Vector3(-1.9, 1.75, 0.6);
  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const dist = Math.max(7.6, 6.2 / camera.aspect);
    const halfW = Math.tan(THREE.MathUtils.degToRad(16)) * dist * camera.aspect;
    // Frame the bowl right of centre and the chip on the left.
    const lookX = -Math.min(0.55, halfW * 0.2);
    camera.position.set(lookX, dist * 0.6, dist * 0.8);
    camera.lookAt(lookX, 0.65, 0);
    camera.updateProjectionMatrix();
    rest.x = lookX - halfW * 0.6;
    if (state && !state.dragging && !state.busy) {
      state.goal.copy(rest);
      state.pos.copy(rest);
    }
    invalidate();
  };

  /* ── Chip state ── */
  const state = {
    pos: rest.clone(),
    goal: rest.clone(),
    tilt: 0,
    coat: -1,
    dragging: false,
    dipped: false,
    busy: false,
    lastX: 0,
    lastT: 0,
    vx: 0,
    rippleClock: 0,
    eat: null,
  };
  chip.position.copy(rest);

  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const ndc = new THREE.Vector2();
  const hit = new THREE.Vector3();
  const pointerToWorld = (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.ray.intersectPlane(plane, hit) ? hit : null;
  };
  const grabOffset = new THREE.Vector3();
  const canvas = renderer.domElement;

  // Only grab when the pointer is on (or right next to) the chip.
  const nearChip = (e) => {
    const r = canvas.getBoundingClientRect();
    const p = chip.position.clone().project(camera);
    const sx = (p.x * 0.5 + 0.5) * r.width + r.left;
    const sy = (-p.y * 0.5 + 0.5) * r.height + r.top;
    return Math.hypot(e.clientX - sx, e.clientY - sy) < Math.max(70, r.width * 0.12);
  };
  canvas.addEventListener('pointerdown', (e) => {
    if (state.busy || !nearChip(e)) return;
    const w = pointerToWorld(e);
    if (!w) return;
    state.dragging = true;
    state.dipped = false;
    grabOffset.copy(state.pos).sub(w);
    state.lastX = e.clientX;
    state.lastT = performance.now();
    canvas.setPointerCapture(e.pointerId);
    host.classList.add('is-dragging', 'has-interacted');
    invalidate();
  });
  canvas.addEventListener('pointermove', (e) => {
    canvas.style.cursor = state.dragging ? 'grabbing' : nearChip(e) && !state.busy ? 'grab' : 'default';
    if (!state.dragging) return;
    const w = pointerToWorld(e);
    if (!w) return;
    state.goal.copy(w).add(grabOffset);
    const now = performance.now();
    state.vx = (e.clientX - state.lastX) / Math.max(1, now - state.lastT);
    state.lastX = e.clientX;
    state.lastT = now;
    invalidate();
  });
  const endDrag = () => {
    if (!state.dragging) return;
    state.dragging = false;
    host.classList.remove('is-dragging');
    if (state.dipped) eat();
    else state.goal.copy(rest);
    invalidate();
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  /* Constrain the chip so it can't pass through the bowl or the board */
  const constrain = (p) => {
    const tipDrop = -CHIP_TIP.y * CHIP_SCALE;
    p.y = clamp(p.y, tipDrop + 0.05, 3.2);
    const tipY = p.y - tipDrop;
    if (tipY < 0.95 && Math.abs(p.x) < 1.9) {
      // inside the bowl: keep clear of the walls and the bottom
      p.x = clamp(p.x, -1.2, 1.2);
      p.y = Math.max(p.y, 0.3 + tipDrop);
    }
    p.x = clamp(p.x, -3.2, 3.2);
    return p;
  };

  const tipWorld = new THREE.Vector3();
  const splash = (x, y, z, f, strength) => {
    const reduce = prefersReducedMotion();
    const n = Math.round((reduce ? 6 : 14 + f.heat * 4) * strength * (isMobile ? 0.6 : 1));
    for (let i = 0; i < n && dropState.length < DROPS; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (reduce ? 1 : 1.6 + Math.random() * 2.4) * strength;
      dropState.push({ p: new THREE.Vector3(x, y + 0.02, z), v: new THREE.Vector3(Math.cos(a) * sp * 0.6, 2.2 + Math.random() * 2.8 * strength, Math.sin(a) * sp * 0.6), r: 0.025 + Math.random() * 0.045, landed: false, life: 0 });
    }
    ripple(x, z, 1);
    if (!reduce) setTimeout(() => ripple(x, z, 1.6), 140);
  };

  /* Eat: lift toward the camera, crumbs, then a fresh chip */
  const eat = () => {
    state.busy = true;
    state.eat = { t: 0, from: state.pos.clone() };
    onEat?.(project(state.pos));
  };
  const project = (p) => {
    const v = p.clone().project(camera);
    return { x: (v.x * 0.5 + 0.5) * host.clientWidth, y: (-v.y * 0.5 + 0.5) * host.clientHeight };
  };
  const crumbBurst = (p) => {
    const n = prefersReducedMotion() ? 6 : CRUMBS;
    crumbState.length = 0;
    for (let i = 0; i < n; i++) {
      crumbState.push({ p: p.clone(), v: new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2.5, (Math.random() - 0.2) * 2.5), rot: new THREE.Euler(Math.random() * 6, Math.random() * 6, 0), s: 0.5 + Math.random() * 0.9, landed: false });
    }
  };

  /** Keyboard / button path: dunk it automatically. */
  const autoDip = () => {
    if (state.busy || state.dragging) return;
    state.busy = true;
    host.classList.add('has-interacted');
    const tipDrop = -CHIP_TIP.y * CHIP_SCALE;
    const above = new THREE.Vector3(0.1, SURFACE_Y + tipDrop + 0.8, 0);
    const inSalsa = new THREE.Vector3(0.1, SURFACE_Y + tipDrop - 0.32, 0);
    state.dipped = false;
    state.goal.copy(above);
    setTimeout(() => state.goal.copy(inSalsa), prefersReducedMotion() ? 150 : 650);
    setTimeout(() => state.goal.copy(above), prefersReducedMotion() ? 450 : 1350);
    setTimeout(() => {
      state.busy = false;
      eat();
    }, prefersReducedMotion() ? 600 : 1800);
    invalidate();
  };

  /* Flavour change: swap the bowl's salsa and the coat */
  let current = flavourIndex;
  const setFlavour = (i) => {
    current = i;
    const f = flavours[i];
    salsaMat.map = looks[i].map;
    salsaMat.bumpMap = looks[i].bumpMap;
    dropMat.color.set(f.salsa);
    colorChunks(f);
    setCoatColours(f);
    state.coat = -1;
    invalidate();
  };

  /* ── Loop: renders only while something is moving ── */
  let dirty = 2;
  let raf = 0;
  let visible = false;
  let last = performance.now();
  function invalidate() {
    dirty = Math.max(dirty, 2);
    if (visible && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  }
  const m = new THREE.Matrix4();
  const qq = new THREE.Quaternion();
  const one = new THREE.Vector3();
  function loop() {
    raf = 0;
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    let active = false;
    const f = flavours[current];

    // Eating animation
    if (state.eat) {
      state.eat.t += dt;
      const e = state.eat.t;
      if (e < 0.35) {
        state.goal.set(state.eat.from.x * 0.6, state.eat.from.y + 1.1, 2.4);
      } else if (!state.eat.crunched) {
        state.eat.crunched = true;
        crumbBurst(chip.position.clone().add(new THREE.Vector3(0, -0.3, 0)));
        chip.visible = false;
      } else if (e > 1.0) {
        // fresh chip rises from the pile
        state.coat = -1;
        coatMat.userData.uniforms.uCoat.value = -1;
        state.pos.set(rest.x - 0.3, 0.4, rest.z + 0.8);
        state.goal.copy(rest);
        chip.visible = true;
        state.eat = null;
        state.busy = false;
      }
      active = true;
    }

    // Chip follows its goal with a little lag; tilts as it swings
    const before = state.pos.clone();
    constrain(state.goal);
    const k = 1 - Math.exp(-dt * (state.dragging ? 18 : 7));
    state.pos.lerp(state.goal, k);
    constrain(state.pos);
    const speedX = (state.pos.x - before.x) / Math.max(dt, 1e-3);
    state.tilt += (clamp(-speedX * 0.08, -0.5, 0.5) - state.tilt) * (1 - Math.exp(-dt * 8));
    chip.position.copy(state.pos);
    chip.rotation.set(-0.38, 0.18 + state.tilt * 0.3, state.tilt);
    if (state.pos.distanceToSquared(state.goal) > 1e-6 || Math.abs(state.tilt) > 1e-3) active = true;

    // Dunk detection: how deep is the tip under the surface?
    chip.updateMatrixWorld();
    tipWorld.copy(CHIP_TIP).applyMatrix4(chip.matrixWorld);
    const depth = SURFACE_Y - tipWorld.y;
    const inBowl = Math.hypot(tipWorld.x, tipWorld.z) < SALSA_R * 0.95;
    if (inBowl && depth > 0 && chip.visible) {
      // coat climbs to where the surface crosses the chip (in chip space)
      const level = CHIP_TIP.y + depth / CHIP_SCALE / Math.cos(0.38) + 0.03;
      if (level > state.coat) {
        state.coat = level;
        coatMat.userData.uniforms.uCoat.value = level;
      }
      if (!state.dipped && (state.dragging || state.busy)) {
        state.dipped = true;
        splash(tipWorld.x, SURFACE_Y, tipWorld.z, f, 1);
        onDip?.(project(tipWorld));
      }
      state.rippleClock += dt;
      if (state.rippleClock > 0.35 && Math.abs(speedX) > 0.4) {
        state.rippleClock = 0;
        ripple(tipWorld.x, tipWorld.z, 0.7);
      }
    }

    // Droplets
    for (let i = dropState.length - 1; i >= 0; i--) {
      const d = dropState[i];
      d.life += dt;
      if (!d.landed) {
        d.v.y -= 9.8 * dt;
        d.p.addScaledVector(d.v, dt);
        const r = Math.hypot(d.p.x, d.p.z);
        if (r < SALSA_R && d.p.y < SURFACE_Y && d.v.y < 0) {
          dropState.splice(i, 1); // back into the bowl
          if (Math.random() < 0.3) ripple(d.p.x, d.p.z, 0.4);
          continue;
        }
        if (r >= SALSA_R && r < 1.65 && d.p.y < 0.92 && d.p.y > 0.3) {
          dropState.splice(i, 1);
          continue;
        }
        if (d.p.y < d.r * 0.3) {
          d.p.y = d.r * 0.25;
          d.landed = true; // a splat on the board
        }
      } else if (d.life > 7) {
        dropState.splice(i, 1);
        continue;
      }
      active = active || !d.landed;
    }
    drops.count = dropState.length;
    dropState.forEach((d, i) => {
      const stretch = d.landed ? 0 : Math.min(1.8, d.v.length() * 0.18);
      one.set(d.r * (d.landed ? 1.5 : 1), d.r * (d.landed ? 0.35 : 1 + stretch), d.r * (d.landed ? 1.5 : 1));
      qq.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.landed ? new THREE.Vector3(0, 1, 0) : d.v.clone().normalize());
      drops.setMatrixAt(i, m.compose(d.p, qq, one));
    });
    drops.instanceMatrix.needsUpdate = true;

    // Crumbs
    crumbs.count = crumbState.length;
    crumbState.forEach((c, i) => {
      if (!c.landed) {
        c.v.y -= 9.8 * dt;
        c.p.addScaledVector(c.v, dt);
        c.rot.x += dt * 6;
        c.rot.y += dt * 4;
        if (c.p.y < 0.03) {
          c.p.y = 0.03;
          c.landed = true;
        }
        active = true;
      }
      crumbs.setMatrixAt(i, m.compose(c.p, qq.setFromEuler(c.rot), one.setScalar(c.s)));
    });
    crumbs.instanceMatrix.needsUpdate = true;

    // Ripples
    ripples.forEach((r) => {
      const u = r.userData;
      if (u.life >= 1) return;
      u.life = Math.min(1, u.life + dt * 0.9);
      const s = (0.08 + u.life * 0.55) * u.size;
      r.scale.set(s, s, 1);
      r.material.opacity = (1 - u.life) * 0.35;
      active = true;
    });

    renderer.render(scene, camera);
    if (active) dirty = 2;
    else dirty--;
    if (visible && dirty > 0) raf = requestAnimationFrame(loop);
  }

  new ResizeObserver(resize).observe(host);
  resize();
  watchVisibility(host, (v) => {
    visible = v;
    if (v) invalidate();
  });
  renderer.compile(scene, camera);
  invalidate();
  onReady?.();

  return { setFlavour, autoDip, isBusy: () => state.busy || state.dragging };
}
