import * as THREE from 'three';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

const FIGURES = {
  responsagility: {
    title: 'Responsagility',
    nodes: [
      ['web', 0.5, 0.36, 'Web platform'], ['pg', 0.18, 0.1, 'PostgreSQL · RLS'], ['score', 0.82, 0.1, 'Deterministic scoring'],
      ['ai', 0.18, 0.6, 'AI content pipeline'], ['reports', 0.82, 0.6, 'PDF & Excel reports'],
      ['mobile', 0.18, 0.9, 'Mobile app'], ['api', 0.5, 0.9, 'Backend · JWT'], ['reflect', 0.82, 0.9, 'AI reflections']
    ],
    edges: [['web', 'pg'], ['web', 'score'], ['web', 'ai'], ['web', 'reports'], ['mobile', 'api'], ['api', 'reflect']],
    note: 'Two products: the web platform and the mobile app'
  },
  'auth-playground': {
    title: 'Auth Playground',
    nodes: [
      ['front', 0.18, 0.1, 'Notes frontend'], ['notes', 0.18, 0.5, 'Notes API'], ['auth', 0.55, 0.5, 'Auth server'],
      ['admin', 0.82, 0.1, 'Admin console'], ['demo', 0.82, 0.9, 'Demo client'], ['mon', 0.45, 0.9, 'Prometheus · Grafana']
    ],
    edges: [['front', 'notes'], ['notes', 'auth'], ['admin', 'auth'], ['demo', 'auth'], ['auth', 'mon']],
    note: 'Sign-in with PKCE, single-use codes, rotating refresh tokens'
  },
  networks: {
    title: 'Computer Networks',

    nodes: [['server', 0.5, 0.6, 'Server', 0.7], ['a', 0.5, 0.08, 'Peer'], ['b', 0.15, 0.9, 'Peer'], ['c', 0.85, 0.9, 'Peer']],
    edges: [['a', 'b'], ['b', 'c'], ['c', 'a'], ['server', 'a', 0.3], ['server', 'b', 0.3], ['server', 'c', 0.3]],
    note: 'Setup through the server over TCP · calls and files go direct between peers'
  },
  othello: {
    title: 'Othello AI',
    nodes: [['master', 0.5, 0.14, 'Master'], ['w1', 0.15, 0.82, 'Worker'], ['w2', 0.38, 0.82, 'Worker'], ['w3', 0.62, 0.82, 'Worker'], ['w4', 0.85, 0.82, 'Worker']],
    edges: [['master', 'w1'], ['master', 'w2'], ['master', 'w3'], ['master', 'w4']],
    note: 'The master hands candidate moves to workers over MPI'
  }
};
const MAX_NODES = 10, DUST = 600, DUST_GAP = 8;
const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;

export function constellation({ composer, disc, reduce, wake }) {
  const wide = matchMedia('(min-width: 1200px)');
  const work = document.querySelector('#projects');
  if (!work) return null;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 1, 0, 1, -10, 10);
  const pass = new RenderPass(scene, camera);
  pass.clear = false;
  pass.clearDepth = true;
  composer.insertPass(pass, 1);

  function layer(count, size) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 4), 4));
    const mat = new THREE.PointsMaterial({ size, map: disc, vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: false, blending: THREE.AdditiveBlending });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    scene.add(pts);

    const p = Array.from({ length: count }, () => ({ x: 0, y: 0, tx: 0, ty: 0, a: 0, ta: 0, tau: 0.14 + Math.random() * 0.22 }));
    return { geo, mat, p };
  }
  const nodes = layer(MAX_NODES, 9), dust = layer(DUST, 3.2);
  let rgb = [new THREE.Color('#ffffff'), new THREE.Color('#8fcaff')];
  let boost = 1;

  const ink = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.6, 'rgba(255,255,255,1)'); grd.addColorStop(0.8, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();

  const labels = document.createElement('div');
  labels.className = 'cst';
  labels.setAttribute('aria-hidden', 'true');
  document.body.appendChild(labels);

  let w = 0, h = 0, u = 1, box = null, current = null, light = false;
  let anchor = scrollY;

  function measure() {
    w = document.documentElement.clientWidth; h = innerHeight; u = rem();
    camera.right = w; camera.bottom = h; camera.updateProjectionMatrix();
    const wrap = work.querySelector('.wrap'), r = wrap.getBoundingClientRect();
    const gap = parseFloat(getComputedStyle(wrap).columnGap) || 48;
    const x0 = r.left + (r.width - gap) * 0.58 + gap, x1 = r.right;
    const bw = x1 - x0, bh = Math.min(bw * 0.95, h - 288 * u);
    box = { x: x0, y: 88 * u + (h - 88 * u - bh) / 2 + 12 * u, w: bw, h: bh };
    sizes();
  }

  function scatter(q) {
    q.tx = box.x + (Math.random() * 1.6 - 0.3) * box.w;
    q.ty = box.y + (Math.random() * 1.6 - 0.3) * box.h;
    q.ta = 0;
  }

  function show(key, fresh) {
    const fig = wide.matches && key ? FIGURES[key] : null;
    if (fig === current) return;
    current = fig;
    if (fig && fresh) {
      for (const q of [...nodes.p, ...dust.p]) q.y += anchor - scrollY;
      anchor = scrollY;
    }
    labels.replaceChildren();
    if (!fig) {
      nodes.p.forEach(scatter); dust.p.forEach(scatter);
    } else {

      const N = [], D = [];
      const at = {};
      for (const [id, x, y, text, a = 1] of fig.nodes) { at[id] = [box.x + x * box.w, box.y + y * box.h]; N.push([...at[id], a, text]); }
      const span = ([a, b]) => Math.hypot(at[b][0] - at[a][0], at[b][1] - at[a][1]);
      const gap = Math.max(DUST_GAP * u, fig.edges.reduce((s, e) => s + span(e), 0) / (DUST - fig.edges.length));
      for (const [a, b, bright = 1] of fig.edges) {
        const [ax, ay] = at[a], [bx, by] = at[b], len = Math.hypot(bx - ax, by - ay);
        const k = Math.max(2, Math.floor(len / gap)), nx = -(by - ay) / len, ny = (bx - ax) / len;
        for (let j = 1; j < k; j++) {
          const t = j / k, jitter = (Math.random() - 0.5) * 2.4;
          D.push([ax + (bx - ax) * t + nx * jitter, ay + (by - ay) * t + ny * jitter, (0.6 + Math.random() * 0.4) * bright]);
        }
      }
      nodes.p.forEach((q, i) => N[i] ? Object.assign(q, { tx: N[i][0], ty: N[i][1], ta: N[i][2] }) : scatter(q));
      dust.p.forEach((q, i) => D[i] ? Object.assign(q, { tx: D[i][0], ty: D[i][1], ta: D[i][2] }) : scatter(q));

      const xs = [...N, ...D].map(t => t[0]), ys = [...N, ...D].map(t => t[1]);
      const top = Math.min(...ys), bottom = Math.max(...ys), mid = (Math.min(...xs) + Math.max(...xs)) / 2;
      const add = (cls, x, y, ...parts) => { const s = document.createElement('span'); s.className = cls; s.style.left = x + 'px'; s.style.top = y + 'px'; s.append(...parts); labels.appendChild(s); return s; };
      const title = document.createElement('b'); title.textContent = fig.title;
      const made = [add('label cap', mid, top - 72 * u, 'SYSTEM::', title)];
      for (const [x, y, , text] of N) if (text) made.push(add('node', x, y + (y - top < 30 * u ? -30 * u : 16 * u), text));
      const note = add('note', mid, bottom + 60 * u, fig.note);
      note.style.maxWidth = box.w + 'px';
      made.push(note);
      setTimeout(() => made.forEach(s => s.classList.add('on')), reduce ? 0 : 450);
    }
    wake();
  }

  const rows = [...work.querySelectorAll('.work .row')].map(row => [row, (row.getAttribute('href') || '').replace(/^projects\/|\.html$/g, '')]).filter(([, k]) => FIGURES[k]);
  if (!rows.length) return null;
  let picked = null, inView = false, fresh = false;
  const refresh = () => { show(inView ? picked : null, fresh); if (inView && picked) fresh = false; };
  for (const [row, key] of rows) {
    const pick = () => { if (key !== picked) fresh = true; picked = key; refresh(); };
    row.addEventListener('pointerenter', pick);
    row.addEventListener('focus', pick);
  }
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; refresh(); }, { rootMargin: '-50% 0px -50% 0px' })
    .observe(work.querySelector('.wrap'));

  function relayout() { measure(); const was = current; current = null; if (was) show(Object.keys(FIGURES).find(k => FIGURES[k] === was), true); else show(null); }
  addEventListener('resize', relayout, { passive: true });
  wide.addEventListener('change', relayout);
  measure();
  [...nodes.p, ...dust.p].forEach(q => { scatter(q); q.x = q.tx; q.y = q.ty; });

  function update(dt) {
    let moving = false;
    const off = scrollY - anchor;
    camera.top = off; camera.bottom = off + h; camera.updateProjectionMatrix();
    labels.style.transform = `translateY(${-off}px)`;
    for (const [L, col] of [[nodes, rgb[0]], [dust, rgb[1]]]) {
      const pos = L.geo.attributes.position.array, c = L.geo.attributes.color.array;
      L.p.forEach((q, i) => {
        const k = reduce ? 1 : 1 - Math.exp(-dt / 1000 / q.tau);
        q.x += (q.tx - q.x) * k; q.y += (q.ty - q.y) * k; q.a += (q.ta - q.a) * k;
        if (Math.abs(q.tx - q.x) > 0.3 || Math.abs(q.ty - q.y) > 0.3 || Math.abs(q.ta - q.a) > 0.005) moving = true;
        pos[i * 3] = q.x; pos[i * 3 + 1] = q.y;
        c[i * 4] = col.r; c[i * 4 + 1] = col.g; c[i * 4 + 2] = col.b; c[i * 4 + 3] = Math.min(1, q.a * boost);
      });
      L.geo.attributes.position.needsUpdate = true; L.geo.attributes.color.needsUpdate = true;
    }
    return moving;
  }

  function sizes() { nodes.mat.size = (light ? 14 : 9) * u; dust.mat.size = (light ? 6 : 3.2) * u; }

  function theme(on) {
    light = on;
    rgb = light ? [new THREE.Color('#111111'), new THREE.Color('#1a4fb8')] : [new THREE.Color('#ffffff'), new THREE.Color('#8fcaff')];
    boost = light ? 1.3 : 1;

    [nodes, dust].forEach(L => { L.mat.map = light ? ink : disc; L.mat.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending; L.mat.needsUpdate = true; });
    sizes();
    wake();
  }

  return { update, theme };
}
