const DEFAULT_LANG = 'id';
const dict = LANG;

const langSwitch = document.querySelector('.lang-switch');
const langDetails = langSwitch.querySelector('details');
const langSummary = langSwitch.querySelector('summary');
const langMenu = langSwitch.querySelector('ul');

const flag = code => `<img src="https://flagcdn.com/${code}.svg" alt="" loading="lazy">`;

langMenu.innerHTML = Object.entries(LOCALES).map(([code, meta]) =>
  `<li><button data-lang="${code}">${flag(meta.flag)}<span>${meta.name}</span></button></li>`
).join('');

function setLang(lang) {
  if (!dict[lang]) lang = DEFAULT_LANG;
  document.documentElement.lang = lang;
  document.documentElement.dir = LOCALES[lang].rtl ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const t = dict[lang][el.dataset.i18n];
    if (t) el.textContent = t;
  });
  langSummary.innerHTML = flag(LOCALES[lang].flag) + `<span>${lang.toUpperCase()}</span>`;
  langMenu.querySelectorAll('[data-lang]').forEach(b => {
    b.setAttribute('aria-current', b.dataset.lang === lang);
  });
  try { localStorage.setItem('lang', lang); } catch {}
}

langMenu.querySelectorAll('[data-lang]').forEach(b => {
  b.addEventListener('click', () => {
    setLang(b.dataset.lang);
    langDetails.open = false;
  });
});

document.addEventListener('click', e => {
  if (!langSwitch.contains(e.target)) langDetails.open = false;
});

// mobile nav
const burger = document.querySelector('.burger');
const nav = document.querySelector('.nav-links');
burger.addEventListener('click', () => nav.classList.toggle('open'));
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

setLang((() => { try { return localStorage.getItem("lang") || DEFAULT_LANG; } catch { return DEFAULT_LANG; } })());

// hero particle field: drifting dots, linked to each other and to the cursor
(function () {
  const canvas = document.querySelector('.hero-particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LINK = 130, DOT = '229,231,235', ACCENT = '34,211,238';

  let w = 0, h = 0, parts = [], raf = 0, rt = 0;
  const mouse = { x: null, y: null, r: 170 };
  const rand = n => Math.random() * n;

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const rect = canvas.parentElement.getBoundingClientRect();
    w = rect.width; h = rect.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // ponytail: O(n^2) link pass, capped at 72 dots; spatial grid only if the cap ever rises
    const count = Math.max(20, Math.min(Math.floor(w * h / 16000), 72));
    parts = Array.from({ length: count }, () => ({
      x: rand(w), y: rand(h),
      vx: (rand(1) - 0.5) * 0.25, vy: (rand(1) - 0.5) * 0.25,
      r: rand(1.5) + 0.6
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const a of parts) {
      a.x += a.vx; a.y += a.vy;
      if (a.x < -20) a.x = w + 20; else if (a.x > w + 20) a.x = -20;
      if (a.y < -20) a.y = h + 20; else if (a.y > h + 20) a.y = -20;
      if (mouse.x != null) {
        const dx = mouse.x - a.x, dy = mouse.y - a.y, d = Math.hypot(dx, dy);
        if (d < mouse.r && d > 0) {
          const f = (mouse.r - d) / mouse.r * 0.04;
          a.x += dx * f; a.y += dy * f;
        }
      }
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${DOT},0.42)`;
      ctx.fill();
    }

    ctx.lineWidth = 1;
    for (let i = 0; i < parts.length; i++) {
      const a = parts[i];
      for (let j = i + 1; j < parts.length; j++) {
        const b = parts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          ctx.strokeStyle = `rgba(${DOT},${(1 - d / LINK) * 0.14})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      if (mouse.x != null) {
        const d = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (d < mouse.r) {
          ctx.strokeStyle = `rgba(${ACCENT},${(1 - d / mouse.r) * 0.5})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    }

    if (!reduce) raf = requestAnimationFrame(draw);
  }

  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resize(); }, 160); });
  addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const inside = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
    mouse.x = inside ? x : null;
    mouse.y = inside ? y : null;
  });

  resize();
  draw();
})();

// preloader: counts up, then slides away
(function () {
  const loader = document.querySelector('.loader');
  if (!loader) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { loader.remove(); return; }
  const count = loader.querySelector('.loader-count');
  const bar = loader.querySelector('.loader-bar');
  let n = 0;
  const tick = setInterval(() => {
    n = Math.min(n + Math.floor(Math.random() * 9) + 4, 100);
    count.textContent = n;
    bar.style.width = n + '%';
    if (n === 100) {
      clearInterval(tick);
      setTimeout(() => loader.classList.add('done'), 350);
    }
  }, 90);
})();
