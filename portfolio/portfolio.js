/* Runs after ../script.js, whose top-level `reduce` and `lenis` it shares. */

/* ---------------------------------------------------------------- ground
   The page takes on the colour of whichever product is in front of you. */

const grounds = document.querySelectorAll('[data-ground]');
const groundIO = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (e.isIntersecting) document.documentElement.style.setProperty('--ground', e.target.dataset.ground);
  }
}, { rootMargin: '-45% 0px -45% 0px' });
grounds.forEach(el => groundIO.observe(el));

/* ---------------------------------------------------------------- wires
   Each note gets a line to the pixel it talks about. They are measured rather
   than hard-coded, so they survive any label length in any of the five
   languages, and redrawn whenever the stage changes size. */

function wire(stage) {
  const svg = stage.querySelector('.wires');
  const box = stage.getBoundingClientRect();
  if (!box.width || getComputedStyle(svg).display === 'none') return;

  svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
  const plate = stage.querySelector('.plate').getBoundingClientRect();
  let out = '', leftLane = 0, rightLane = 0;

  stage.querySelectorAll('.note').forEach((note, i) => {
    const dot = stage.querySelector('#' + note.dataset.dot);
    if (!dot) return;
    const d = dot.getBoundingClientRect();
    const n = note.querySelector('h3').getBoundingClientRect();
    const toRight = n.left + n.width / 2 < plate.left + plate.width / 2;
    const noteBox = note.getBoundingClientRect();

    const x1 = (toRight ? noteBox.right + 8 : noteBox.left - 8) - box.left;
    const y1 = n.top + n.height / 2 - box.top;
    const x2 = d.left + d.width / 2 - box.left;
    const y2 = d.top + d.height / 2 - box.top;
    // drafted square: out to the gutter, along it, then across to the dot. Each
    // note gets its own lane so two runs on one side never share a vertical.
    const lane = 10 + (toRight ? leftLane++ : rightLane++) * 9;
    const elbow = (toRight ? plate.left - lane : plate.right + lane) - box.left;
    const path = `M${x1} ${y1}L${elbow} ${y1}L${elbow} ${y2}L${x2} ${y2}`;

    const delay = 120 + i * 240;
    note.style.setProperty('--d', delay + 500 + 'ms');
    dot.style.setProperty('--d', delay + 700 + 'ms');
    out += `<path class="case" pathLength="1" d="${path}" style="--d:${delay}ms"/>`
         + `<path class="line" pathLength="1" d="${path}" style="--d:${delay}ms"/>`;
  });
  svg.innerHTML = out;
}

document.querySelectorAll('.bp-stage').forEach(stage => {
  new ResizeObserver(() => wire(stage)).observe(stage);

  // pointing at a note dims the plate everywhere except the thing it describes
  stage.querySelectorAll('.note').forEach(note => {
    const dot = stage.querySelector('#' + note.dataset.dot);
    const spot = stage.querySelector('.spot');
    const on = () => {
      if (!dot || getComputedStyle(dot).display === 'none') return;
      const s = getComputedStyle(dot);
      spot.style.setProperty('--fx', s.left);
      spot.style.setProperty('--fy', s.top);
      stage.classList.add('focus');
      note.classList.add('on');
      dot.classList.add('on');
    };
    const off = () => {
      stage.classList.remove('focus');
      note.classList.remove('on');
      dot?.classList.remove('on');
    };
    note.addEventListener('pointerenter', on);
    note.addEventListener('pointerleave', off);
    note.addEventListener('focus', on);
    note.addEventListener('blur', off);
  });
});

if (document.fonts?.ready) document.fonts.ready.then(() => document.querySelectorAll('.bp-stage').forEach(wire));

const bpIO = new IntersectionObserver((entries, obs) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add('in');
    setTimeout(() => e.target.classList.add('settled'), 2600);
    obs.unobserve(e.target);
  }
}, { rootMargin: '0px 0px -28% 0px' });
document.querySelectorAll('.bp').forEach(el => bpIO.observe(el));

/* ---------------------------------------------------------------- parallax
   Layers drift at their own rate as they cross the viewport. Nothing holds the
   scroll: this only reads the position and writes transforms, and only for the
   layers currently on screen. */

if (!reduce) {
  const layers = [...document.querySelectorAll('[data-depth]')].map(el => ({
    el, depth: parseFloat(el.dataset.depth), on: false
  }));

  // Watch the parent, not the layer: a layer can drift itself off screen, and
  // then it would never be told to come back.
  const layerIO = new IntersectionObserver(entries => {
    for (const e of entries) {
      for (const l of layers) if (l.el.parentElement === e.target) l.on = e.isIntersecting;
    }
    paint();
  }, { rootMargin: '20% 0px' });
  layers.forEach(l => layerIO.observe(l.el.parentElement));

  const narrow = matchMedia('(max-width: 760px)');

  function paint() {
    const mid = innerHeight / 2;
    const scale = narrow.matches ? 0.45 : 1;
    for (const l of layers) {
      if (!l.on) continue;
      const parent = l.el.parentElement.getBoundingClientRect();
      const offset = parent.top + parent.height / 2 - mid;
      l.el.style.transform = `translate3d(0, ${(offset * l.depth * scale).toFixed(1)}px, 0)`;
    }
  }

  let ticking = false;
  const request = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; paint(); });
  };
  if (lenis) lenis.on('scroll', request);
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  paint();
}
