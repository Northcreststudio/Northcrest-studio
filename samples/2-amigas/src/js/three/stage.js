/**
 * The 3D stage: hero jar + "exploding ingredients" on scroll.
 *
 * Loaded lazily (dynamic import from main.js) so the rest of the
 * page paints first. One WebGL canvas lives in a sticky layer
 * behind the hero and the explode section; scroll progress
 * through that wrapper drives everything (GSAP ScrollTrigger).
 *
 * Scroll timeline (t = 0 → 1 across the whole stage):
 *   0.00–0.30  jar glides from its hero spot to centre stage
 *   0.20–0.32  lid pops off
 *   0.26–0.52  ingredients burst out (staggered)
 *   0.26–0.90  ingredients orbit the jar
 *   0.72–0.92  ingredients dive back into the jar
 *   0.88–0.97  lid goes back on
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { flavours } from '../../config/flavours.js';
import { buildJar, loadLogoImages, makeLabelTexture, makeSalsaTexture, makeLidTexture, makeShadowTexture, JAR } from './jar.js';
import { makeIngredient } from './ingredients.js';
import { isMobile, isLowPower, cappedDPR, prefersReducedMotion, clamp, lerp, range, smooth, watchVisibility } from '../env.js';
import logoUrl from '../../assets/logo.svg?url';
import markUrl from '../../assets/logo-mark.svg?url';

gsap.registerPlugin(ScrollTrigger);

const FOV = 30;
const CAM_Z = 10;
const easeOutBack = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

export async function createStage({ host, slot, stageEl, captionsEl, flavourIndex }) {
  /* ── Renderer ── */
  const renderer = new THREE.WebGLRenderer({ antialias: !isLowPower, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(cappedDPR());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.className = 'stage__gl';
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
  camera.position.set(0, 0, CAM_Z);

  // Soft studio reflections for the glass + a warm key and a pink rim light.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.75;
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xfff3e0, 0x3a2166, 0.9));
  const key = new THREE.DirectionalLight(0xffe2b0, 2.2);
  key.position.set(4, 6, 6);
  const rim = new THREE.DirectionalLight(0xe5197a, 2.4);
  rim.position.set(-6, 2, -4);
  const fill = new THREE.DirectionalLight(0x00a5a0, 0.8);
  fill.position.set(5, -3, -2);
  scene.add(key, rim, fill);

  /* ── Textures (fonts must be ready before painting labels) ── */
  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);
  await Promise.all([document.fonts.load('80px "Bagel Fat One"'), document.fonts.load('700 40px "DM Sans"')]).catch(() => {});
  const images = await loadLogoImages(logoUrl, markUrl);
  const labelW = isMobile ? 1536 : 2048;
  const looks = flavours.map((f) => ({
    label: makeLabelTexture(f, images, renderer, { width: labelW }),
    salsa: makeSalsaTexture(f, renderer, isMobile ? 256 : 512),
  }));

  /* ── Jar ── */
  const jarRoot = new THREE.Group(); // position + scale (scroll)
  const jarSpin = new THREE.Group(); // rotation (drag / auto-spin)
  const { group: jarMesh, lidPivot, materials } = buildJar({
    segments: isMobile ? 48 : 72,
    labelTexture: looks[flavourIndex].label,
    salsaTexture: looks[flavourIndex].salsa,
    lidTexture: makeLidTexture(images, renderer, isMobile ? 256 : 512),
  });
  jarSpin.add(jarMesh);
  jarRoot.add(jarSpin);
  scene.add(jarRoot);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: makeShadowTexture(renderer), transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = JAR.bottom - 0.02;
  shadow.scale.set(3, 3, 1);
  jarRoot.add(shadow);

  /* ── Ingredients ── */
  const COUNT = isMobile ? 14 : 26;
  const orbitGroup = new THREE.Group();
  jarRoot.add(orbitGroup);
  const slots = Array.from({ length: COUNT }, (_, i) => {
    const golden = i * 2.39996; // golden angle spreads them evenly
    return {
      mesh: null,
      angle: golden,
      radius: 1.9 + (i % 3) * 0.32,
      height: -1.3 + ((i * 7) % COUNT) / COUNT * 2.7,
      delay: (i / COUNT) * 0.55,
      spin: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
      spinSpeed: 0.6 + Math.random() * 1.2,
      size: 0.85 + Math.random() * 0.35,
      bob: Math.random() * Math.PI * 2,
    };
  });
  const fillIngredients = (f) => {
    slots.forEach((s, i) => {
      if (s.mesh) orbitGroup.remove(s.mesh);
      s.mesh = makeIngredient(f.ingredients3D[i % f.ingredients3D.length]);
      s.mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      s.mesh.visible = false;
      orbitGroup.add(s.mesh);
    });
  };
  fillIngredients(flavours[flavourIndex]);

  /* ── Layout: hero slot → centre stage ── */
  const layout = { heroX: 0, heroY: 0, heroScale: 1, centreScale: 1, halfH: 1, halfW: 1 };
  let width = 0;
  let height = 0;
  const measure = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    // Ignore tiny height changes from mobile browser toolbars sliding in/out.
    if (w === width && Math.abs(h - height) < 120 && height) return;
    width = w;
    height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    layout.halfH = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * CAM_Z;
    layout.halfW = layout.halfH * camera.aspect;

    // The hero slot's position at scroll 0, relative to the sticky viewport.
    const r = slot.getBoundingClientRect();
    const stageTop = stageEl.getBoundingClientRect().top;
    const cx = r.left + r.width / 2;
    const cy = r.top - stageTop + r.height / 2;
    layout.heroX = (cx / w) * 2 * layout.halfW - layout.halfW;
    layout.heroY = -((cy / h) * 2 * layout.halfH - layout.halfH);
    const fitH = (r.height / h) * 2 * layout.halfH;
    const fitW = (r.width / w) * 2 * layout.halfW;
    // Never taller than ~68% of the screen, whatever the slot size.
    layout.heroScale = Math.max(0.2, Math.min(Math.min(fitH, 2 * layout.halfH * 0.68) / JAR.height, fitW / 2.1));
    // In the explode phase the jar and its orbit should fit the screen.
    layout.centreScale = Math.min((2 * layout.halfH * 0.36) / JAR.height, layout.halfW / 2.6);
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
      width = 0; // force a re-measure
      measure();
    },
  });
  const captions = [...captionsEl.children];
  const captionRanges = [[0.17, 0.36], [0.36, 0.56], [0.56, 0.76], [0.76, 1.01]];

  /* ── Drag to spin ── */
  const spin = { angle: -0.35, velocity: 0, boost: 0, tiltX: 0, dragging: false, lastX: 0, lastY: 0, lastT: 0 };
  const canvas = renderer.domElement;
  canvas.addEventListener('pointerdown', (e) => {
    spin.dragging = true;
    spin.lastX = e.clientX;
    spin.lastY = e.clientY;
    spin.lastT = performance.now();
    spin.velocity = 0;
    host.classList.add('is-dragging');
    canvas.setPointerCapture(e.pointerId);
    document.documentElement.classList.add('has-spun');
  });
  canvas.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    if (!spin.dragging) return;
    const now = performance.now();
    const dx = e.clientX - spin.lastX;
    const dy = e.clientY - spin.lastY;
    const dt = Math.max(1, now - spin.lastT);
    spin.angle += dx * 0.012;
    spin.velocity = ((dx * 0.012) / dt) * 16;
    if (e.pointerType === 'mouse') spin.tiltX = clamp(spin.tiltX + dy * 0.004, -0.35, 0.35);
    spin.lastX = e.clientX;
    spin.lastY = e.clientY;
    spin.lastT = now;
  });
  const release = () => {
    spin.dragging = false;
    host.classList.remove('is-dragging');
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  const pointer = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  /* ── Flavour change: spin, swap at the blur point, squash ── */
  const pop = { v: 0 };
  let swapTl = null;
  const setFlavour = (index) => {
    const f = flavours[index];
    const apply = () => {
      materials.labelMat.map = looks[index].label;
      materials.salsaMat.map = looks[index].salsa;
      fillIngredients(f);
    };
    if (prefersReducedMotion()) {
      apply();
      return;
    }
    swapTl?.kill();
    swapTl = gsap.timeline();
    swapTl
      .to(spin, { boost: spin.boost + Math.PI * 2, duration: 1.1, ease: 'power3.inOut' }, 0)
      .to(jarSpin.scale, { x: 1.06, y: 0.9, z: 1.06, duration: 0.25, ease: 'power2.out' }, 0)
      .call(apply, null, 0.5)
      .to(jarSpin.scale, { x: 1, y: 1, z: 1, duration: 0.9, ease: 'elastic.out(1.1, 0.4)' }, 0.5)
      // A little fountain of the new flavour's ingredients (only noticeable near the hero).
      .fromTo(pop, { v: 0 }, { v: 0.36, duration: 0.5, ease: 'power2.out' }, 0.5)
      .to(pop, { v: 0, duration: 0.8, ease: 'power2.in' }, 1.05);
  };

  /* ── Render loop (only while on screen) ── */
  let lastFrame = performance.now();
  let time = 0;
  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  const tmpC = new THREE.Vector3();
  const tmpQ = new THREE.Quaternion();
  let running = false;
  let onScreen = true;

  const frame = () => {
    if (!running) return;
    requestAnimationFrame(frame);
    const now = performance.now();
    const dt = Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;
    time += dt;
    const reduce = prefersReducedMotion();

    // Smooth the scroll value so the scene glides, even on chunky wheels.
    // (Time-based, so 30fps phones and 120fps monitors feel the same.)
    t += (targetT - t) * (1 - Math.exp(-dt * (reduce ? 18 : 6)));

    /* Jar placement */
    const move = smooth(range(t, 0, 0.3));
    jarRoot.position.set(lerp(layout.heroX, 0, move), lerp(layout.heroY, -0.45, move), 0);
    jarRoot.scale.setScalar(lerp(layout.heroScale, layout.centreScale, move));

    /* Spin: drag inertia, else gentle auto-spin */
    if (!spin.dragging) {
      spin.velocity *= 0.95;
      spin.angle += spin.velocity + (reduce ? 0 : dt * 0.35);
      spin.tiltX *= 0.96;
    }
    jarSpin.rotation.y = spin.angle + spin.boost + t * Math.PI * 1.2;
    jarSpin.rotation.x = spin.tiltX + (reduce ? 0 : Math.sin(time * 0.8) * 0.03);
    jarSpin.position.y = reduce ? 0 : Math.sin(time * 1.3) * 0.04;

    /* Lid */
    const lift = reduce ? 0 : easeOutBack(range(t, 0.2, 0.32)) * (1 - smooth(range(t, 0.88, 0.97)));
    lidPivot.position.set(lift * 0.9, JAR.neckTop + lift * 1.0, lift * 0.4);
    lidPivot.rotation.set(-lift * 0.9, 0, lift * 0.5);

    /* Ingredients */
    const orbitSpin = range(t, 0.26, 0.92) * Math.PI * 1.4 + time * (reduce ? 0 : 0.08);
    slots.forEach((s, i) => {
      const m = s.mesh;
      let out; // 0 = in the jar, 1 = in orbit
      if (reduce) {
        // Calm version: they simply fade in around the jar, then away.
        out = smooth(range(t, 0.25, 0.4)) * (1 - smooth(range(t, 0.8, 0.92)));
      } else {
        const burst = range(t, 0.26 + s.delay * 0.2, 0.26 + s.delay * 0.2 + 0.14);
        const back = range(t, 0.72 + s.delay * 0.15, 0.72 + s.delay * 0.15 + 0.12);
        out = Math.max(smooth(burst) * (1 - smooth(back)), pop.v);
      }
      if (out <= 0.001) {
        m.visible = false;
        return;
      }
      m.visible = true;
      const a = s.angle + (reduce ? 0 : orbitSpin);
      // Orbit target (an ellipse: wider than it is deep reads better on screen)
      tmpB.set(Math.cos(a) * s.radius, s.height + Math.sin(time * 1.2 + s.bob) * 0.08, Math.sin(a) * s.radius * 0.8);
      if (reduce) {
        m.position.copy(tmpB);
      } else {
        // Quadratic arc out of the jar mouth: up first, then out to the orbit.
        tmpA.set(0, JAR.mouthY, 0);
        tmpC.set(Math.cos(a) * 0.9, JAR.mouthY + 2.2, Math.sin(a) * 0.9);
        const u = out;
        const iu = 1 - u;
        m.position.set(
          iu * iu * tmpA.x + 2 * iu * u * tmpC.x + u * u * tmpB.x,
          iu * iu * tmpA.y + 2 * iu * u * tmpC.y + u * u * tmpB.y,
          iu * iu * tmpA.z + 2 * iu * u * tmpC.z + u * u * tmpB.z
        );
        tmpQ.setFromAxisAngle(s.spin, dt * s.spinSpeed * (0.3 + out));
        m.quaternion.premultiply(tmpQ);
      }
      m.scale.setScalar(s.size * (reduce ? out : 0.25 + 0.75 * out));
    });

    /* Captions */
    captions.forEach((el, i) => {
      const [a, b] = captionRanges[i];
      el.classList.toggle('is-active', t >= a && t < b);
    });

    /* Subtle camera parallax with the mouse */
    if (!reduce && !isMobile) {
      camera.position.x += (pointer.x * 0.35 - camera.position.x) * 0.04;
      camera.position.y += (-pointer.y * 0.2 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
    }

    renderer.render(scene, camera);
  };

  const updateRunning = () => {
    const should = onScreen && !document.hidden;
    if (should && !running) {
      running = true;
      lastFrame = performance.now();
      requestAnimationFrame(frame);
    } else if (!should) running = false;
  };
  watchVisibility(stageEl, (v) => {
    onScreen = v;
    updateRunning();
  }, '0px');
  document.addEventListener('visibilitychange', updateRunning);
  updateRunning();

  // Compile every shader (ingredients included) before the loader fades out,
  // so the first burst does not hitch.
  slots.forEach((s) => (s.mesh.visible = true));
  renderer.compile(scene, camera);
  slots.forEach((s) => (s.mesh.visible = false));
  renderer.render(scene, camera);

  return { setFlavour, refresh: () => ScrollTrigger.refresh() };
}
