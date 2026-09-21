const DEFAULT_LANG = 'id';
const dict = LANG;

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduce) root.classList.add('motion');

/* ---------------------------------------------------------------- language */

const langSwitch = document.querySelector('.lang-switch');
const langDetails = langSwitch.querySelector('details');
const langSummary = langSwitch.querySelector('summary');
const langMenu = langSwitch.querySelector('ul');

const flag = code => `<img src="https://flagcdn.com/${code}.svg" alt="" loading="lazy">`;

langMenu.innerHTML = Object.entries(LOCALES).map(([code, meta]) =>
  `<li><button data-lang="${code}">${flag(meta.flag)}<span>${meta.name}</span></button></li>`
).join('');

function applyLang(lang) {
  root.lang = lang;
  root.dir = LOCALES[lang].rtl ? 'rtl' : 'ltr';
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

// swapping every string at once reads as a flicker; a short dim makes it a state change
function setLang(lang) {
  if (!dict[lang]) lang = DEFAULT_LANG;
  if (reduce || lang === root.lang) return applyLang(lang);
  document.body.classList.add('swapping');
  setTimeout(() => {
    applyLang(lang);
    document.body.classList.remove('swapping');
  }, 160);
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

/* ---------------------------------------------------------------- mobile nav */

const burger = document.querySelector('.burger');
const nav = document.querySelector('.nav-links');
burger.addEventListener('click', () => nav.classList.toggle('open'));
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

applyLang((() => { try { return localStorage.getItem('lang') || DEFAULT_LANG; } catch { return DEFAULT_LANG; } })());

/* ---------------------------------------------------------------- hero field
   Drifting dots linked to each other and to the cursor. `intro` ramps the whole
   field up once the loader clears, so the hero assembles itself rather than
   being there all along. */

const heroField = (() => {
  const canvas = document.querySelector('.hero-particles');
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  const LINK = 130, DOT = '229,235,238', ACCENT = '34,211,238';

  let w = 0, h = 0, parts = [], rt = 0, intro = reduce ? 1 : 0, introFrom = 0;
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

  function draw(now) {
    if (introFrom) intro = Math.min((now - introFrom) / 1100, 1);
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
      ctx.fillStyle = `rgba(${DOT},${0.42 * intro})`;
      ctx.fill();
    }

    ctx.lineWidth = 1;
    for (let i = 0; i < parts.length; i++) {
      const a = parts[i];
      for (let j = i + 1; j < parts.length; j++) {
        const b = parts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          ctx.strokeStyle = `rgba(${DOT},${(1 - d / LINK) * 0.14 * intro})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      if (mouse.x != null) {
        const d = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (d < mouse.r) {
          ctx.strokeStyle = `rgba(${ACCENT},${(1 - d / mouse.r) * 0.5 * intro})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    }
  }

  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 160); });
  addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const inside = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
    mouse.x = inside ? x : null;
    mouse.y = inside ? y : null;
  });

  resize();
  return {
    draw,
    ignite() { if (!reduce && !introFrom) introFrom = performance.now(); }
  };
})();

/* ---------------------------------------------------------------- hero depth
   One rAF drives the field, the scroll parallax and the pointer drift, and it
   only runs while the hero is on screen and the tab is visible. */

const hero = document.querySelector('.hero');
const heroInner = document.querySelector('.hero-inner');
const heroCanvas = document.querySelector('.hero-particles');

let raf = 0, heroVisible = true;
const pointer = { tx: 0, ty: 0, x: 0, y: 0 };

if (!reduce && hero) {
  addEventListener('mousemove', e => {
    const rect = hero.getBoundingClientRect();
    pointer.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
    pointer.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
  });
}

function tick(now) {
  raf = requestAnimationFrame(tick);
  if (heroField) heroField.draw(now);
  if (reduce || !hero) return;

  const y = Math.max(0, scrollY);
  const depth = Math.min(y / hero.offsetHeight, 1);
  pointer.x += (pointer.tx - pointer.x) * 0.06;
  pointer.y += (pointer.ty - pointer.y) * 0.06;

  heroCanvas.style.transform = `translate3d(0, ${y * 0.3}px, 0)`;
  heroInner.style.transform =
    `translate3d(${pointer.x}px, ${pointer.y + y * -0.08}px, 0)`;
  heroInner.style.opacity = String(1 - depth * 0.9);
}

function runLoop(on) {
  if (on && !raf && !document.hidden) raf = requestAnimationFrame(tick);
  else if (!on && raf) { cancelAnimationFrame(raf); raf = 0; }
}

if (hero) {
  new IntersectionObserver(([e]) => {
    heroVisible = e.isIntersecting;
    runLoop(heroVisible);
  }).observe(hero);
}
document.addEventListener('visibilitychange', () => runLoop(!document.hidden && heroVisible));
runLoop(true);

/* ---------------------------------------------------------------- reveals */

if (!reduce) {
  document.querySelectorAll('[data-head]').forEach(el => el.classList.add('reveal-head'));
  document.querySelectorAll('[data-stagger] span').forEach(el => el.classList.add('reveal-item'));

  const io = new IntersectionObserver((entries, obs) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      obs.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -12% 0px' });

  document.querySelectorAll('.reveal-head').forEach(el => io.observe(el));

  // stagger is scoped per group and capped, so a long list never trails off
  document.querySelectorAll('.grid, [data-stagger]').forEach(group => {
    const items = [...group.querySelectorAll('.reveal-item')];
    items.forEach((el, i) => el.style.setProperty('--d', Math.min(i, 7) * 55 + 'ms'));
    items.forEach(el => io.observe(el));
  });
}

/* ---------------------------------------------------------------- pointer light */

if (!reduce && matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  // the two hero buttons lean toward the cursor, then settle back
  document.querySelectorAll('.hero-cta .btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) * 0.28;
      const dy = (e.clientY - r.top - r.height / 2) * 0.35;
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)';
      btn.style.transform = '';
      setTimeout(() => { btn.style.transition = ''; }, 500);
    });
  });
}

/* ---------------------------------------------------------------- header */

let headerRaf = 0;
addEventListener('scroll', () => {
  if (headerRaf) return;
  headerRaf = requestAnimationFrame(() => {
    document.querySelector('header').classList.toggle('scrolled', scrollY > 20);
    headerRaf = 0;
  });
}, { passive: true });

/* ---------------------------------------------------------------- preloader
   The count-up hands off to the hero: as the loader clears, the field ignites
   and the headline unveils. That handoff is the one authored moment here. */

(function () {
  const loader = document.querySelector('.loader');
  const start = () => {
    document.body.classList.add('hero-in');
    if (heroField) heroField.ignite();
  };

  if (!loader) return start();
  if (reduce) { loader.remove(); return start(); }

  const count = loader.querySelector('.loader-count');
  const bar = loader.querySelector('.loader-bar');
  let n = 0;
  const t = setInterval(() => {
    n = Math.min(n + Math.floor(Math.random() * 9) + 4, 100);
    count.textContent = n;
    bar.style.width = n + '%';
    if (n < 100) return;
    clearInterval(t);
    setTimeout(() => {
      loader.classList.add('done');
      start();
      setTimeout(() => loader.remove(), 1100);
    }, 320);
  }, 90);
})();
