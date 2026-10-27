const cloud = document.querySelector('[data-cloud]');
if (cloud) build(cloud);

function build(cloud) {
  const rows = cloud.querySelector('.cloud-stage');
  const bar = cloud.querySelector('.cloud-bar');
  const spin = cloud.querySelector('[data-spin]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const src = [...rows.querySelectorAll('.cloud-tag')];

  const stage = document.createElement('div');
  stage.className = 'cloud-orbit';
  stage.setAttribute('aria-hidden', 'true');
  for (const t of src) { const c = t.cloneNode(true); c.dataset.cat = t.closest('.cloud-group').dataset.cat; stage.appendChild(c); }
  rows.appendChild(stage);
  const tags = [...stage.children];
  const n = tags.length;

  const pts = tags.map((el, i) => {
    const phi = Math.acos(-1 + (2 * i + 1) / n);
    const theta = Math.sqrt(n * Math.PI) * phi;
    return { el, src: src[i], i, x: Math.cos(theta) * Math.sin(phi), y: Math.sin(theta) * Math.sin(phi), z: Math.cos(phi), lx: 0, ly: 0, e: 0, e0: 0, h: 0 };
  });
  const BASE = { vx: 0.0009, vy: 0.0022 };
  const GROW = 1.35;
  const FLY = 900, STAGGER = 14;
  const s = { ax: -0.3, ay: 0, vx: 0, vy: 0, drag: false, lx: 0, ly: 0, r: 200, ry: 200, on: false, raf: 0 };
  let sphere = false, fly = null, hovered = null;
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  let natural = 0, tall = 0;
  function size() {

    const groups = rows.querySelectorAll('.cloud-group');
    natural = groups[groups.length - 1].getBoundingClientRect().bottom - rows.getBoundingClientRect().top;
    tall = Math.max(natural, Math.min(innerHeight * 0.8, 780));
    rows.style.minHeight = (sphere || fly ? tall : natural) + 'px';

    stage.style.right = -(rows.closest('.wrap').getBoundingClientRect().right - rows.getBoundingClientRect().right) + 'px';
    const box = stage.getBoundingClientRect(), w = box.width, h = tall;
    for (const p of pts) { const r = p.src.getBoundingClientRect(); p.lx = r.left + r.width / 2 - box.left; p.ly = r.top + r.height / 2 - box.top; }

    const widths = src.map(t => t.offsetWidth * GROW).sort((a, b) => a - b);
    const maxHalf = widths[Math.floor(n * 0.8)] / 2;

    const roomY = (h / 2 - 14) / 1.2;
    s.r = Math.max(110, Math.min(w * 0.34, (w / 2 - maxHalf - 8) / 1.2, roomY));
    s.ry = Math.max(s.r, Math.min(roomY, s.r * 1.45));
  }

  function render() {
    const w = stage.clientWidth, cx = w / 2, cy = tall / 2;
    const f = s.r * 1.9;
    const kmax = f / (f - s.r * 1.15), kmin = f / (f + s.r * 1.15);
    const cy_ = Math.cos(s.ay), sy = Math.sin(s.ay), cx_ = Math.cos(s.ax), sx = Math.sin(s.ax);
    for (const p of pts) {
      const x1 = p.x * cy_ - p.z * sy, z1 = p.x * sy + p.z * cy_;
      const y2 = p.y * cx_ - z1 * sx, z2 = p.y * sx + z1 * cx_;
      const k = f / (f + z2 * s.r);
      const depth = Math.min(1, Math.max(0, (k - 0.5) / 0.85));
      p.h += ((p.el === hovered ? 1 : 0) - p.h) * 0.18;
      const e = p.e, on = (0.6 + 0.4 * (k - kmin) / (kmax - kmin)) * GROW * (1 + 0.14 * p.h);
      const X = p.lx + (cx + x1 * s.r * 1.15 * k - p.lx) * e, Y = p.ly + (cy + y2 * s.ry * k - p.ly) * e;
      const st = p.el.style;
      st.transform = `translate(${X.toFixed(1)}px, ${Y.toFixed(1)}px) translate(-50%, -50%) scale(${(1 + (on - 1) * e).toFixed(3)})`;
      st.zIndex = Math.round(k * 200 + p.h * 300);
      const op = p.el.classList.contains('kin') ? Math.max(0.85, 0.3 + 0.7 * depth * depth) : 0.3 + 0.7 * depth * depth;
      st.opacity = (1 + (op - 1) * e).toFixed(3);
    }
  }

  function tick(now) {
    s.raf = 0;
    if (fly) {
      let done = true;
      for (const p of pts) {
        const t = Math.min(1, Math.max(0, (now - fly.start - p.i * STAGGER) / FLY));
        p.e = p.e0 + (fly.to - p.e0) * ease(t);
        if (t < 1) done = false;
      }
      if (done) { fly = null; if (!sphere) { cloud.classList.remove('sphere'); rows.style.minHeight = ''; } }
    }
    if (!s.drag) {
      const slow = hovered ? 0.25 : 1;
      s.ay += s.vy * slow; s.ax += s.vx * slow;
      s.vy += (BASE.vy - s.vy) * 0.012;
      s.vx += (BASE.vx - s.vx) * 0.012;
    }
    render();
    if (fly || (sphere && s.on)) s.raf = requestAnimationFrame(tick);
  }
  function wake() { if (!s.raf) s.raf = requestAnimationFrame(tick); }

  function toggle() {
    sphere = !sphere;
    spin.setAttribute('aria-pressed', String(sphere));
    spin.textContent = sphere ? 'Back to the list' : 'Spin into a sphere';
    cloud.classList.add('sphere');
    size();
    rows.style.minHeight = (sphere ? tall : natural) + 'px';
    if (sphere && !fly) { s.vx = s.vy = 0; render(); }
    for (const p of pts) p.e0 = p.e;
    fly = { to: sphere ? 1 : 0, start: performance.now() };
    wake();
  }
  spin.addEventListener('click', toggle);

  stage.addEventListener('pointerdown', e => {
    if (!sphere) return;
    s.drag = true; s.lx = e.clientX; s.ly = e.clientY;
    stage.setPointerCapture(e.pointerId);
    stage.classList.add('dragging');
  });
  stage.addEventListener('pointermove', e => {
    if (!s.drag) return;
    const dx = e.clientX - s.lx, dy = e.clientY - s.ly;
    s.lx = e.clientX; s.ly = e.clientY;
    s.ay += dx * 0.005; s.ax -= dy * 0.005;
    s.vy = dx * 0.0015; s.vx = -dy * 0.0015;
  });
  const stop = () => { s.drag = false; stage.classList.remove('dragging'); };

  function hover(el) {
    hovered = el;
    for (const t of tags) t.classList.toggle('kin', !!el && t !== el && t.dataset.cat === el.dataset.cat);
    wake();
  }
  stage.addEventListener('pointerover', e => hover(e.target.closest('.cloud-tag')));
  stage.addEventListener('pointerleave', () => hover(null));
  stage.addEventListener('pointerup', stop);
  stage.addEventListener('pointercancel', stop);
  stage.addEventListener('lostpointercapture', stop);

  function fit() {
    bar.hidden = reduce || innerWidth < 560;
    if (bar.hidden && sphere) { toggle(); fly.start = -1e9; }
    if (sphere) { size(); render(); }
  }
  new IntersectionObserver(([e]) => { s.on = e.isIntersecting; if (s.on && sphere) wake(); }, { rootMargin: '15% 0px' }).observe(cloud);
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(fit, 120); }, { passive: true });
  fit();
}
