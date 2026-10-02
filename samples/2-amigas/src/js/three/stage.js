/**
 * The 3D stage: a product-photography set for the jar.
 *
 * A honed stone counter, a studio softbox environment, a key spotlight
 * with soft shadows and a coloured gel glow on the backdrop. The jar is
 * physically shaded (refractive glass, wet salsa, printed paper label).
 *
 * Loaded lazily from main.js. One WebGL canvas sits in a sticky layer
 * behind the hero and the explode section; scroll progress through that
 * wrapper drives the camera and the ingredients (GSAP ScrollTrigger).
 *
 * Scroll timeline (t = 0 → 1 across the whole stage):
 *   0.00–0.28  camera dollies from the hero framing to the wide shot
 *   0.16–0.32  lid unscrews and lifts away
 *   0.24–0.50  ingredients rise out of the jar in slow motion
 *   0.30–0.80  they hang in the air while the camera circles
 *   0.74–0.92  they sink back into the jar
 *   0.88–0.98  lid comes down and screws shut
 *
 * It also renders the product shots used in the flavour cards, the
 * recipe cards and the story section (returned as image URLs).
 */
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { flavours } from '../../config/flavours.js';
import { buildJar, loadLogoImages, makeLook, makeLidTextures, JAR } from './jar.js';
import { makeIngredient } from './ingredients.js';
import { studioEnvironment, stoneMaps, radial, tex } from './textures.js';
import { isMobile, isLowPower, cappedDPR, prefersReducedMotion, clamp, lerp, range, smooth, watchVisibility } from '../env.js';
import logoSvg from '../../assets/logo.svg?raw';
import markSvg from '../../assets/logo-mark.svg?raw';

gsap.registerPlugin(ScrollTrigger);

const FOV = 28;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const BG = new THREE.Color('#0d0a09');
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export async function createStage({ host, slot, stageEl, captionsEl, progressEl, flavourIndex, onProgress = () => {} }) {
  const quality = isLowPower ? 'low' : 'high';

  /* ── Renderer ── */
  const renderer = new THREE.WebGLRenderer({ antialias: !isLowPower, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(cappedDPR());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  if ('transmissionResolutionScale' in renderer) renderer.transmissionResolutionScale = isMobile ? 0.5 : 1;
  renderer.domElement.className = 'stage__gl';
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = BG.clone();
  scene.fog = new THREE.Fog(BG, 16, 42);
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 80);

  /* ── Light ── */
  scene.environment = studioEnvironment(renderer);
  scene.environmentIntensity = 0.95;
  onProgress(0.45);

  const key = new THREE.SpotLight('#ffe6c8', 420, 0, 0.42, 0.95, 2);
  key.position.set(-4.5, 10, 5.5);
  key.target.position.set(0, 0.8, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
  key.shadow.radius = 9;
  key.shadow.blurSamples = 16;
  key.shadow.bias = -0.0004;
  key.shadow.camera.near = 4;
  key.shadow.camera.far = 22;
  const rim = new THREE.DirectionalLight('#ffd2a6', 1.6);
  rim.position.set(3, 4, -7);
  const fill = new THREE.HemisphereLight('#f5e6d6', '#1a1210', 0.12);
  scene.add(key, key.target, rim, fill);

  /* ── Set: stone counter + gel glow on the backdrop ── */
  const stone = stoneMaps(renderer, isMobile ? 512 : 1024);
  [stone.map, stone.roughnessMap, stone.bumpMap].forEach((t) => t.repeat.set(10, 10));
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 90),
    new THREE.MeshPhysicalMaterial({ ...stone, bumpScale: 0.4, roughness: 1, clearcoat: 0.15, clearcoatRoughness: 0.6 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const glowMat = new THREE.MeshBasicMaterial({
    map: tex(radial(256, [[0, 'rgba(255,255,255,0.55)'], [0.45, 'rgba(255,255,255,0.16)'], [1, 'rgba(255,255,255,0)']])),
    color: new THREE.Color(flavours[flavourIndex].accent),
    transparent: true,
    depthWrite: false,
    fog: false,
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(40, 24), glowMat);
  glow.position.set(0, 5, -18);
  scene.add(glow);

  // Contact shadow: the dark crease where glass meets stone.
  const aoTex = tex(radial(128, [[0, 'rgba(0,0,0,0.8)'], [0.45, 'rgba(0,0,0,0.5)'], [0.7, 'rgba(0,0,0,0.12)'], [1, 'rgba(0,0,0,0)']]));
  const makeAO = (s) => {
    const ao = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ map: aoTex, transparent: true, depthWrite: false }));
    ao.rotation.x = -Math.PI / 2;
    ao.position.y = 0.003;
    return ao;
  };

  /* ── Textures for every flavour (fonts must be ready first) ── */
  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);
  await Promise.all(['64px Gloock', '600 40px "Big Shoulders Text"', '500 40px "Hanken Grotesk"'].map((f) => document.fonts.load(f))).catch(() => {});
  const images = await loadLogoImages(logoSvg, markSvg);
  const lidTex = makeLidTextures(images, renderer, isMobile ? 512 : 1024);
  const looks = [];
  for (const f of flavours) {
    looks.push(makeLook(f, images, renderer, { labelWidth: isMobile ? 1536 : 2560, salsaSize: isMobile ? 256 : 512 }));
    onProgress(0.5 + (0.2 * looks.length) / flavours.length);
    await new Promise((r) => setTimeout(r)); // let the loader repaint
  }

  /* ── The hero jar ── */
  const jarSpin = new THREE.Group();
  const jar = buildJar({ segments: isMobile ? 64 : 112, look: looks[flavourIndex], lidTexture: lidTex.map, lidMetal: lidTex.metalnessMap, quality });
  jarSpin.add(jar.group);
  scene.add(jarSpin, makeAO(2.9));

  /* ── Ingredients ── */
  const COUNT = isMobile ? 12 : 22;
  const floatGroup = new THREE.Group();
  scene.add(floatGroup);
  const slots = Array.from({ length: COUNT }, (_, i) => {
    const a = i * 2.39996 + 0.4; // golden angle
    const ring = 0.55 + ((i * 37) % COUNT) / COUNT * 0.45;
    return {
      mesh: null,
      angle: a,
      ring,
      height: 0.5 + ((i * 53) % COUNT) / COUNT * 3.6,
      delay: (i / COUNT) * 0.7,
      axis: new THREE.Vector3(Math.sin(i * 1.3), Math.cos(i * 2.1), Math.sin(i * 0.7)).normalize(),
      spin: 0.25 + ((i * 17) % 7) / 10,
      bob: i * 1.7,
      size: 0.9 + ((i * 29) % 5) / 12,
      start: new THREE.Quaternion().setFromEuler(new THREE.Euler(i * 1.1, i * 2.3, i * 0.7)),
    };
  });
  const fillIngredients = (f) => {
    slots.forEach((s, i) => {
      if (s.mesh) floatGroup.remove(s.mesh);
      s.mesh = makeIngredient(f.ingredients3D[i % f.ingredients3D.length]);
      s.mesh.quaternion.copy(s.start);
      s.mesh.visible = false;
      floatGroup.add(s.mesh);
    });
  };
  fillIngredients(flavours[flavourIndex]);

  /* ── Framing ── */
  const layout = { W: 1, H: 1, hero: { x: 0, y: 0, d: 12 }, wide: { d: 20, r: 3 }, radius: 3 };
  let width = 0;
  let height = 0;
  const measure = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    if (w === width && Math.abs(h - height) < 120 && height) return; // ignore mobile toolbar jitter
    width = w;
    height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    layout.W = w;
    layout.H = h;
    const r = slot.getBoundingClientRect();
    const stageTop = stageEl.getBoundingClientRect().top;
    layout.hero.x = r.left + r.width / 2;
    layout.hero.y = r.top - stageTop + r.height / 2;
    const frac = clamp(r.height / h, 0.25, 0.64);
    const fitH = (JAR.height * 1.08) / frac / (2 * TAN);
    const fitW = 2.3 / (r.width / w) / (2 * TAN * camera.aspect);
    layout.hero.d = Math.max(fitH, fitW);
    // Wide shot must hold the floating ingredients on narrow screens too.
    layout.radius = 3.1 * clamp(camera.aspect * 1.25, 0.58, 1);
    const dV = 6 / (2 * TAN);
    const dH = (layout.radius * 2 * 1.05) / (2 * TAN * camera.aspect);
    layout.wide.d = Math.max(dV, dH);
  };
  new ResizeObserver(measure).observe(host);
  measure();

  /* ── Scroll ── */
  let targetT = 0;
  let t = 0;
  ScrollTrigger.create({
    trigger: stageEl,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => (targetT = self.progress),
    onRefresh: () => {
      width = 0;
      measure();
    },
  });
  const captions = [...captionsEl.children];
  const captionRanges = [[0.16, 0.36], [0.36, 0.56], [0.56, 0.76], [0.76, 1.01]];

  /* ── Drag to turn the jar ── */
  const spin = { angle: -0.25, velocity: 0, turn: 0, dragging: false, lastX: 0, lastT: 0 };
  const pointer = { x: 0, y: 0 };
  const canvas = renderer.domElement;
  canvas.addEventListener('pointerdown', (e) => {
    spin.dragging = true;
    spin.lastX = e.clientX;
    spin.lastT = performance.now();
    spin.velocity = 0;
    host.classList.add('is-dragging');
    canvas.setPointerCapture(e.pointerId);
    document.documentElement.classList.add('has-spun');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!spin.dragging) return;
    const now = performance.now();
    const dx = e.clientX - spin.lastX;
    spin.angle += dx * 0.009;
    spin.velocity = ((dx * 0.009) / Math.max(1, now - spin.lastT)) * 16;
    spin.lastX = e.clientX;
    spin.lastT = now;
  });
  const release = () => {
    spin.dragging = false;
    host.classList.remove('is-dragging');
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  /* ── Flavour change: turn the jar so its unlabelled back faces you, swap, turn on ── */
  let turnTl = null;
  const setFlavour = (index) => {
    const f = flavours[index];
    const apply = () => {
      jar.materials.labelMat.map = looks[index].label.map;
      jar.materials.labelMat.roughnessMap = looks[index].label.roughnessMap;
      jar.materials.labelMat.bumpMap = looks[index].label.bumpMap;
      jar.materials.salsaMat.map = looks[index].salsa.map;
      jar.materials.salsaMat.bumpMap = looks[index].salsa.bumpMap;
      fillIngredients(f);
    };
    const c = new THREE.Color(f.accent);
    gsap.to(glowMat.color, { r: c.r, g: c.g, b: c.b, duration: 1.2, ease: 'power2.inOut' });
    if (prefersReducedMotion()) return apply();
    turnTl?.kill();
    // Rotate to the next "back facing" angle, swap there, then come round to the front.
    const twoPi = Math.PI * 2;
    const current = spin.angle + spin.turn;
    const base = Math.ceil((current - Math.PI) / twoPi) * twoPi + Math.PI; // next angle where the back faces camera
    const extra = base - current;
    turnTl = gsap.timeline();
    turnTl
      .to(spin, { turn: spin.turn + extra, duration: 0.75, ease: 'power2.in' })
      .call(apply)
      .to(spin, { turn: spin.turn + extra + Math.PI, duration: 1.1, ease: 'power3.out' });
  };

  /* ── Product shots (cards, recipes, story) ── */
  const shots = renderShots();

  function renderShots() {
    const saved = { size: renderer.getSize(new THREE.Vector2()), dpr: renderer.getPixelRatio() };
    const shotCam = new THREE.PerspectiveCamera(24, 1, 0.1, 80);
    const jarsGroup = new THREE.Group();
    const extra = [];
    jarSpin.visible = false;
    const out = { jars: [], group: null };

    // Single jar shots (one per flavour), on the same counter and light.
    const single = buildJar({ segments: 96, look: looks[0], lidTexture: lidTex.map, lidMetal: lidTex.metalnessMap, quality });
    jarsGroup.add(single.group);
    scene.add(jarsGroup);
    const sw = isMobile ? 520 : 720;
    const sh = Math.round(sw * 1.2);
    renderer.setPixelRatio(1);
    renderer.setSize(sw, sh, false);
    shotCam.aspect = sw / sh;
    shotCam.updateProjectionMatrix();
    shotCam.position.set(0.6, 2.4, 8.6);
    shotCam.lookAt(0, 1.18, 0);
    single.group.rotation.y = -0.18;
    flavours.forEach((f, i) => {
      single.materials.labelMat.map = looks[i].label.map;
      single.materials.labelMat.roughnessMap = looks[i].label.roughnessMap;
      single.materials.labelMat.bumpMap = looks[i].label.bumpMap;
      single.materials.salsaMat.map = looks[i].salsa.map;
      single.materials.salsaMat.bumpMap = looks[i].salsa.bumpMap;
      glowMat.color.set(f.accent);
      renderer.render(scene, shotCam);
      out.jars.push(renderer.domElement.toDataURL('image/jpeg', 0.88));
    });

    // Group shot: all three jars with produce scattered on the stone.
    single.group.visible = false;
    flavours.forEach((f, i) => {
      const j = buildJar({ segments: 96, look: looks[i], lidTexture: lidTex.map, lidMetal: lidTex.metalnessMap, quality });
      j.group.position.set((i - 1) * 2.35, 0, i === 1 ? -0.5 : 0.25);
      j.group.rotation.y = (i - 1) * -0.28;
      jarsGroup.add(j.group);
      const ao = makeAO(2.9);
      ao.position.x = j.group.position.x;
      ao.position.z = j.group.position.z;
      jarsGroup.add(ao);
    });
    const props = [
      ['tomato', [-2.6, 0.32, 2.2], [0, 0.4, 0]],
      ['tomatoHalf', [-1.3, 0.3, 2.7], [Math.PI, 0.6, 0.15]],
      ['chiliGreen', [0.4, 0.15, 2.5], [0, 0.9, Math.PI / 2]],
      ['habanero', [1.7, 0.24, 2.3], [0, 0.6, 0]],
      ['lime', [3.0, 0.036, 1.6], [Math.PI / 2, 0, 0]],
      ['garlic', [-0.4, 0.11, 3.1], [0, 1.2, Math.PI / 2]],
      ['cilantro', [2.4, 0.06, 3.1], [-Math.PI / 2 + 0.1, 0, 0.6]],
    ];
    props.forEach(([type, p, r]) => {
      const m = makeIngredient(type);
      m.position.set(...p);
      m.rotation.set(...r);
      jarsGroup.add(m);
      extra.push(m);
    });
    const gw = isMobile ? 900 : 1400;
    const gh = Math.round(gw * 0.8);
    renderer.setSize(gw, gh, false);
    shotCam.aspect = gw / gh;
    shotCam.fov = 26;
    shotCam.updateProjectionMatrix();
    shotCam.position.set(0.8, 3.6, 12.5);
    shotCam.lookAt(0, 1.0, 0.9);
    glowMat.color.set('#c26a3a');
    renderer.render(scene, shotCam);
    out.group = renderer.domElement.toDataURL('image/jpeg', 0.88);

    // Clean up and restore the live view.
    scene.remove(jarsGroup);
    jarsGroup.traverse((o) => o.geometry?.dispose());
    jarSpin.visible = true;
    glowMat.color.set(flavours[flavourIndex].accent);
    renderer.setPixelRatio(saved.dpr);
    renderer.setSize(saved.size.x, saved.size.y, false);
    return out;
  }

  /* ── Render loop (only while on screen) ── */
  let running = false;
  let onScreen = true;
  let last = performance.now();
  let time = 0;
  const camPos = new THREE.Vector3();
  const target = new THREE.Vector3();
  const tmpQ = new THREE.Quaternion();
  const mouth = new THREE.Vector3(0, JAR.mouthY, 0);
  const ctrl = new THREE.Vector3();
  const dest = new THREE.Vector3();

  const frame = () => {
    if (!running) return;
    requestAnimationFrame(frame);
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    time += dt;
    const reduce = prefersReducedMotion();
    t += (targetT - t) * (1 - Math.exp(-dt * (reduce ? 18 : 5)));

    /* Camera: hero framing → wide levitation shot that slowly circles */
    const dolly = easeInOut(range(t, 0, 0.28));
    const orbit = reduce ? 0 : easeInOut(range(t, 0.28, 0.9)) * 0.9 - 0.15 * dolly;
    const dist = lerp(layout.hero.d, layout.wide.d, dolly);
    const elev = lerp(0.1, 0.2, dolly);
    target.set(0, lerp(JAR.centreY, 2.15, dolly), 0);
    const az = orbit + (reduce || isMobile ? 0 : pointer.x * 0.05);
    camPos.set(Math.sin(az) * dist * Math.cos(elev), target.y + Math.sin(elev) * dist + (reduce || isMobile ? 0 : -pointer.y * 0.15), Math.cos(az) * dist * Math.cos(elev));
    camera.position.copy(camPos);
    camera.lookAt(target);
    // Shift the frame so the jar sits in its hero slot, easing to centre.
    const offX = (layout.W / 2 - layout.hero.x) * (1 - dolly);
    const offY = (layout.H / 2 - layout.hero.y) * (1 - dolly);
    camera.setViewOffset(layout.W, layout.H, offX, offY, layout.W, layout.H);

    /* Jar turn: drag inertia, else a slow showroom turn */
    if (!spin.dragging) {
      spin.velocity *= Math.exp(-dt * 3);
      spin.angle += spin.velocity + (reduce ? 0 : dt * 0.16);
    }
    jarSpin.rotation.y = spin.angle + spin.turn;

    /* Lid: unscrew, lift, hover; then the reverse */
    const unscrew = reduce ? 0 : smooth(range(t, 0.16, 0.24)) * (1 - smooth(range(t, 0.93, 0.98)));
    const lift = reduce ? 0 : easeInOut(range(t, 0.22, 0.34)) * (1 - easeInOut(range(t, 0.86, 0.95)));
    jar.lidPivot.rotation.y = -unscrew * Math.PI * 1.2;
    jar.lidPivot.position.set(lift * 0.6, JAR.neckTop - 0.11 + unscrew * 0.12 + lift * 2.6, lift * -0.2);
    jar.lidPivot.rotation.x = lift * -0.35;
    jar.lidPivot.rotation.z = lift * 0.22 + Math.sin(time * 0.6) * 0.02 * lift;

    /* Ingredients: slow-motion rise, hang, sink */
    slots.forEach((s) => {
      const m = s.mesh;
      let out;
      if (reduce) out = smooth(range(t, 0.28, 0.4)) * (1 - smooth(range(t, 0.8, 0.9)));
      else {
        const rise = range(t, 0.24 + s.delay * 0.16, 0.24 + s.delay * 0.16 + 0.16);
        const sink = range(t, 0.74 + s.delay * 0.12, 0.74 + s.delay * 0.12 + 0.12);
        out = easeInOut(rise) * (1 - easeInOut(sink));
      }
      if (out <= 0.001) {
        m.visible = false;
        return;
      }
      m.visible = true;
      const R = layout.radius * s.ring;
      const drift = reduce ? 0 : time * 0.03;
      dest.set(Math.cos(s.angle + drift) * R, s.height + (reduce ? 0 : Math.sin(time * 0.7 + s.bob) * 0.06), Math.sin(s.angle + drift) * R * 0.85);
      if (reduce) m.position.copy(dest);
      else {
        ctrl.set(dest.x * 0.25, JAR.mouthY + 1.4 + s.height * 0.35, dest.z * 0.25);
        const u = out;
        const iu = 1 - u;
        m.position.set(
          iu * iu * mouth.x + 2 * iu * u * ctrl.x + u * u * dest.x,
          iu * iu * mouth.y + 2 * iu * u * ctrl.y + u * u * dest.y,
          iu * iu * mouth.z + 2 * iu * u * ctrl.z + u * u * dest.z
        );
        tmpQ.setFromAxisAngle(s.axis, dt * s.spin * 0.6);
        m.quaternion.premultiply(tmpQ);
      }
      m.scale.setScalar(s.size * (reduce ? out : 0.35 + 0.65 * out));
    });

    /* Captions + progress line */
    captions.forEach((el, i) => el.classList.toggle('is-active', t >= captionRanges[i][0] && t < captionRanges[i][1]));
    if (progressEl) progressEl.style.transform = `scaleX(${range(t, 0.16, 0.98)})`;

    renderer.render(scene, camera);
  };

  const updateRunning = () => {
    const should = onScreen && !document.hidden;
    if (should && !running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    } else if (!should) running = false;
  };
  watchVisibility(stageEl, (v) => {
    onScreen = v;
    updateRunning();
  }, '0px');
  document.addEventListener('visibilitychange', updateRunning);

  // Compile every shader before the loader fades out, so nothing hitches later.
  slots.forEach((s) => (s.mesh.visible = true));
  renderer.compile(scene, camera);
  slots.forEach((s) => (s.mesh.visible = false));
  updateRunning();

  return { setFlavour, shots, refresh: () => ScrollTrigger.refresh() };
}
