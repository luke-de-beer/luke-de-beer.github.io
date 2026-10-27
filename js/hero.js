import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { constellation } from './constellation.js?v=68';

const canvas = document.querySelector('canvas[data-stars]');
if (canvas) start(canvas);

function start(canvas) {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const mobile = innerWidth < 760;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch (e) {
    root.classList.add('no-gl');
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, 1, 1, 2400);
  const DEPTH = 1500;
  const SPREAD = 2400;

  const disc = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.3, 'rgba(255,255,255,0.75)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();

  const ICE = new THREE.Color('#8fcaff'), WARM = new THREE.Color('#ffd9b8'), WHITE = new THREE.Color('#ffffff');
  function field(count, size, opacity) {
    const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 1800;
      pos[i * 3 + 1] = (Math.random() - 0.5) * SPREAD;
      pos[i * 3 + 2] = -Math.random() * DEPTH;
      const r = Math.random();
      const c = r > 0.86 ? ICE : r > 0.8 ? WARM : WHITE;
      const dim = 0.55 + Math.random() * 0.45;
      col[i * 3] = c.r * dim; col[i * 3 + 1] = c.g * dim; col[i * 3 + 2] = c.b * dim;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size, map: disc, vertexColors: true, transparent: true, opacity,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);
    return points;
  }
  const faint = field(mobile ? 2200 : 4800, 2.4, 0.45);
  const bright = field(mobile ? 350 : 780, 6.5, 0.95);
  const layers = [faint, bright];
  let sizes = [2.4, 6.5];


  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.6, 0.65, 0.3);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const cst = constellation({ composer, disc, reduce, wake });

  const base = [0.45, 0.95];
  function applyTheme() {
    const light = root.getAttribute('data-theme') === 'light';
    const bg = getComputedStyle(root).getPropertyValue(light ? '--bg' : '--void').trim() || '#000000';
    renderer.setClearColor(new THREE.Color(bg), 1);
    renderer.toneMapping = light ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
    bloom.enabled = !light;
    layers.forEach((p, i) => {
      const m = p.material;
      m.vertexColors = !light;
      m.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
      m.color.set(light ? '#000000' : '#ffffff');
      base[i] = light ? 1 : (i === 0 ? 0.45 : 0.95);
      sizes = light ? [5, 11] : [2.4, 6.5];
      m.size = sizes[i];
      m.needsUpdate = true;
    });
    if (cst) cst.theme(light);
  }

  const head = document.querySelector('#projects .section-head');
  const DIM = 0.45;
  let w = 0, h = 0, fadeStart = 0, stopY = 1;
  function size() {
    w = document.documentElement.clientWidth; h = innerHeight;

    stopY = Math.max(1, head ? head.getBoundingClientRect().top + scrollY - 140 : h * 1.6);
    fadeStart = Math.min(h * 0.25, stopY * 0.5);
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.resolution.set(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let last = 0, prev = 0, running = false, raf = 0;
  function frame(t) {
    const dt = Math.min(48, t - last || 16); last = t;
    const flying = scrollY < stopY;
    const p = Math.min(scrollY, stopY) / Math.max(1, h);

    const dim = 1 - (1 - DIM) * smooth(fadeStart, stopY, scrollY);
    layers.forEach((l, i) => { l.material.opacity = base[i] * dim; });

    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;
    const z = -p * 900;
    const lift = -Math.max(0, scrollY - stopY) * 0.15;
    const cy = -p * 160 + lift;
    camera.position.set(pointer.x * 30, cy + pointer.y * 20, z);
    camera.lookAt(pointer.x * 10, -p * 260 + lift, z - 600);

    for (const l of layers) {
      const a = l.geometry.attributes.position; const arr = a.array;

      if (flying && !reduce) {
        const drift = dt * 0.012;
        for (let i = 2; i < arr.length; i += 3) { arr[i] += drift; if (arr[i] > z + 10) arr[i] -= DEPTH; }
      }

      for (let i = 1; i < arr.length; i += 3) {
        if (arr[i] > cy + SPREAD / 2) arr[i] -= SPREAD; else if (arr[i] < cy - SPREAD / 2) arr[i] += SPREAD;
      }
      a.needsUpdate = true;
    }
    if (flying && !reduce) bright.material.size = sizes[1] + Math.sin(t / 900) * 0.6;
    const forming = cst ? cst.update(Math.min(100, t - (prev || t - 16))) : false;
    prev = t;
    composer.render();

    const settled = Math.abs(pointer.tx - pointer.x) < 0.001 && Math.abs(pointer.ty - pointer.y) < 0.001;
    if (!reduce && (flying || forming || !settled)) raf = requestAnimationFrame(frame); else running = false;
  }
  function wake() {
    if (running || document.hidden) return;
    running = true; last = 0; prev = 0;
    raf = requestAnimationFrame(frame);
  }
  function smooth(a, b, x) { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  size(); applyTheme(); wake();
  addEventListener('resize', () => { size(); wake(); }, { passive: true });
  addEventListener('load', () => { size(); wake(); });
  addEventListener('scroll', wake, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); running = false; } else wake(); });
  const toggle = document.querySelector('[data-theme-toggle]');
  if (toggle) toggle.addEventListener('click', () => { requestAnimationFrame(() => { applyTheme(); wake(); }); });
  if (finePointer && !reduce) addEventListener('pointermove', e => {
    pointer.tx = (e.clientX / w - 0.5) * 2;
    pointer.ty = (e.clientY / h - 0.5) * -2;
    wake();
  }, { passive: true });
}
