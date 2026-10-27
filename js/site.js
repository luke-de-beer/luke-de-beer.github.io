(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  try {
    var saved = localStorage.getItem('theme');
    if (saved === 'light') root.setAttribute('data-theme', 'light');
  } catch (e) {}
  var toggle = document.querySelector('[data-theme-toggle]');
  if (toggle) toggle.addEventListener('click', function () {
    var light = root.getAttribute('data-theme') === 'light';
    if (light) root.removeAttribute('data-theme'); else root.setAttribute('data-theme', 'light');
    toggle.setAttribute('aria-pressed', String(!light));
    try { localStorage.setItem('theme', light ? 'dark' : 'light'); } catch (e) {}
  });

  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-check]'));
  var counter = document.querySelector('[data-counter]');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-nav] a[href^="#"]'));
  var seen = {};
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  var seenEl = counter && counter.querySelector('em');
  var totalEl = counter && counter.querySelector('span');
  if (totalEl) totalEl.textContent = '/' + pad(sections.length);
  if (seenEl) seenEl.textContent = pad(0);
  if ('IntersectionObserver' in window && sections.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var id = en.target.id;
        if (en.isIntersecting) {
          seen[id] = true;
          navLinks.forEach(function (a) { a.setAttribute('aria-current', a.getAttribute('href') === '#' + id ? 'true' : 'false'); });
        }
      });
      var count = Object.keys(seen).length;
      if (window.hudCount) window.hudCount(count); else if (seenEl) seenEl.textContent = pad(count);
    }, { rootMargin: '-35% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (s) { io.observe(s); });
  }

  if (!reduce && 'IntersectionObserver' in window) {
    var targets = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    targets.forEach(function (t) { t.classList.add('will-reveal'); });
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); ro.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    targets.forEach(function (t) { ro.observe(t); });
  }

  var clock = document.querySelector('[data-clock]');
  if (clock) {
    function tick() {
      try {
        clock.textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Johannesburg' }).format(new Date());
      } catch (e) { clock.textContent = ''; }
    }
    tick(); setInterval(tick, 30000);
  }

  var caseNav = document.querySelector('.case-nav');
  if (caseNav) {
    var stick = function () { caseNav.classList.toggle('stuck', caseNav.getBoundingClientRect().top <= 0); };
    window.addEventListener('scroll', stick, { passive: true });
    stick();
  }
})();
