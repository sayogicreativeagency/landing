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
