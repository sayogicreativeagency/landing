const DEFAULT_LANG = 'id';
let dict = {};

async function loadLang() {
  dict = await fetch('lang.json').then(r => r.json());
  let lang = DEFAULT_LANG;
  try { lang = localStorage.getItem('lang') || DEFAULT_LANG; } catch {}
  setLang(lang);
}

function setLang(lang) {
  if (!dict[lang]) lang = DEFAULT_LANG;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const t = dict[lang][el.dataset.i18n];
    if (t) el.textContent = t;
  });
  document.querySelectorAll('[data-lang]').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });
  try { localStorage.setItem('lang', lang); } catch {}
}

document.querySelectorAll('[data-lang]').forEach(b => {
  b.addEventListener('click', () => setLang(b.dataset.lang));
});

// mobile nav
const burger = document.querySelector('.burger');
const nav = document.querySelector('.nav-links');
burger.addEventListener('click', () => nav.classList.toggle('open'));
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

loadLang();
