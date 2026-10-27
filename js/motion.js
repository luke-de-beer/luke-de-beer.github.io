import Lenis from 'lenis';
import { animate, inView, stagger } from 'motion';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const lenis = new Lenis({ autoRaf: true, anchors: { offset: (document.querySelector('.case-nav') ? -60 : -96) * parseFloat(getComputedStyle(document.documentElement).fontSize) / 16 }, lerp: 0.085 });
window.lenis = lenis;

const SPRING = { type: 'spring', stiffness: 170, damping: 24, mass: 1 };
const SOFT = { type: 'spring', stiffness: 90, damping: 20, mass: 1 };

const counterEm = document.querySelector('[data-counter] em');
let shown = 0;
window.hudCount = function (n) {
  if (!counterEm) return;
  const pad = v => (v < 10 ? '0' : '') + v;
  if (reduce || n === shown) { counterEm.textContent = pad(n); shown = n; return; }
  const from = shown; shown = n;
  animate(from, n, { type: 'spring', stiffness: 220, damping: 30, onUpdate: v => { counterEm.textContent = pad(Math.round(v)); } });
  animate(counterEm, { scale: [1, 1.35, 1], y: [0, -2, 0] }, { type: 'spring', stiffness: 400, damping: 18 });
};

if (!reduce) {

  for (const list of document.querySelectorAll('.work, .edu')) {
    const rows = [...list.querySelectorAll('.row')];
    rows.forEach(r => { r.style.opacity = '0'; });
    inView(list, () => {
      animate(rows, { opacity: [0, 1], y: [22, 0] }, { ...SPRING, delay: stagger(0.08) });
    }, { margin: '0px 0px -12% 0px' });

    rows.forEach(r => {
      const title = r.querySelector('.title');
      if (!title) return;
      r.addEventListener('pointerenter', () => animate(title, { x: 8 }, { type: 'spring', stiffness: 320, damping: 22 }));
      r.addEventListener('pointerleave', () => animate(title, { x: 0 }, { type: 'spring', stiffness: 220, damping: 20 }));
    });
  }

  const shots = [...document.querySelectorAll('.shot')];
  shots.forEach(s => { s.style.opacity = '0'; });
  shots.forEach(s => inView(s, () => { animate(s, { opacity: [0, 1], y: [36, 0] }, SOFT); }, { margin: '0px 0px -8% 0px' }));
}
