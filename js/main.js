(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lenis = null;

  /* ---------- menu (logo click) ---------- */
  const menu = $('#menu');
  const opener = $('.top [data-open]');
  function openMenu() {
    menu.hidden = false;
    opener.setAttribute('aria-expanded', 'true');
    document.documentElement.style.overflow = 'hidden';
    if (lenis) lenis.stop();
    if (window.gsap && !reduce) {
      gsap.fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: .55, ease: 'power3.inOut' });
      gsap.fromTo($$('.menu-list a'), { yPercent: 100 }, { yPercent: 0, duration: .6, stagger: .04, delay: .2, ease: 'power3.out' });
    }
    const first = $('.menu-list a');
    first && first.focus({ preventScroll: true });
  }
  function closeMenu(target) {
    const done = () => {
      menu.hidden = true;
      opener.setAttribute('aria-expanded', 'false');
      document.documentElement.style.overflow = '';
      if (lenis) lenis.start();
      if (target) goTo(target);
      else opener.focus({ preventScroll: true });
    };
    if (window.gsap && !reduce) gsap.to(menu, { clipPath: 'inset(0 0 100% 0)', duration: .45, ease: 'power3.inOut', onComplete: done });
    else done();
  }
  opener.addEventListener('click', openMenu);
  menu.addEventListener('click', (ev) => {
    const a = ev.target.closest('[data-close]');
    if (!a) return;
    ev.preventDefault();
    const href = a.getAttribute('href');
    closeMenu(href && href.startsWith('#') ? href : null);
  });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !menu.hidden) closeMenu(); });

  function goTo(hash) {
    const el = document.querySelector(hash);
    if (!el) return;
    const off = -($('.top').offsetHeight || 0);
    if (lenis) lenis.scrollTo(el, { offset: off, duration: 1.2 });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + off, behavior: reduce ? 'auto' : 'smooth' });
  }
  $$('a[href^="#"]').forEach((a) => {
    if (a.closest('#menu')) return;
    a.addEventListener('click', (ev) => {
      const h = a.getAttribute('href');
      if (h.length < 2) return;
      ev.preventDefault();
      goTo(h);
    });
  });

  /* ---------- rating tabs ---------- */
  const panel = $('[data-tabpanel]'), empty = $('[data-tabempty]');
  $$('.ratings .chip').forEach((b) => b.addEventListener('click', () => {
    $$('.ratings .chip').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
    const t = b.dataset.tab, isEffie = t === 'Ефективність';
    panel.hidden = !isEffie; empty.hidden = isEffie;
    $('[data-tabname]').textContent = t;
    $('[data-tablabel]').textContent = isEffie ? 'Ефективність (Effie)' : t;
  }));

  /* ---------- who is who: filter + floating card ---------- */
  const rows = $$('.who-row');
  $$('.wf').forEach((b) => b.addEventListener('click', () => {
    $$('.wf').forEach((x) => x.classList.toggle('on', x === b));
    let shown = 0;
    rows.forEach((r) => { const ok = b.dataset.f === 'all' || r.dataset.cat === b.dataset.f; r.hidden = !ok; if (ok) shown++; });
    $('.who-empty').hidden = shown > 0;
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }));
  const fl = $('.who-float'), flName = $('[data-wname]');
  if (window.matchMedia('(hover:hover)').matches) {
    let x = 0, y = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => { cx += (x - cx) * .18; cy += (y - cy) * .18; fl.style.left = cx + 'px'; fl.style.top = cy + 'px'; raf = requestAnimationFrame(loop); };
    rows.forEach((r) => {
      r.addEventListener('mouseenter', (ev) => { flName.textContent = r.dataset.name; if (!raf) { cx = x = ev.clientX; cy = y = ev.clientY; loop(); } fl.classList.add('on'); });
      r.addEventListener('mouseleave', () => fl.classList.remove('on'));
      r.addEventListener('mousemove', (ev) => { x = ev.clientX + 140; y = ev.clientY; });
    });
    $('.who-list').addEventListener('mouseleave', () => { cancelAnimationFrame(raf); raf = 0; });
  }

  /* ---------- directions slider ---------- */
  const track = $('.dir-track'), cards = $$('.dir'), cur = $('[data-cur]');
  const step = () => (cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth);
  const upd = () => {
    const i = Math.round(track.scrollLeft / step());
    const max = Math.round((track.scrollWidth - track.clientWidth) / step());
    const idx = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4 ? cards.length - 1 : Math.min(i, max);
    cur.textContent = String(Math.min(idx, cards.length - 1) + 1).padStart(2, '0');
  };
  track.addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true });
  $('[data-next]').addEventListener('click', () => track.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }));
  $('[data-prev]').addEventListener('click', () => track.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }));
  track.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowRight') { ev.preventDefault(); track.scrollBy({ left: step(), behavior: 'smooth' }); }
    if (ev.key === 'ArrowLeft') { ev.preventDefault(); track.scrollBy({ left: -step(), behavior: 'smooth' }); }
  });
  // drag to scroll on desktop
  let down = false, sx = 0, sl = 0, moved = false;
  track.addEventListener('pointerdown', (ev) => { if (ev.pointerType !== 'mouse') return; down = true; moved = false; sx = ev.clientX; sl = track.scrollLeft; track.style.scrollSnapType = 'none'; });
  window.addEventListener('pointermove', (ev) => { if (!down) return; const d = ev.clientX - sx; if (Math.abs(d) > 4) moved = true; track.scrollLeft = sl - d; });
  window.addEventListener('pointerup', () => { if (!down) return; down = false; track.style.scrollSnapType = ''; });
  track.addEventListener('click', (ev) => { if (moved) { ev.preventDefault(); ev.stopPropagation(); } }, true);
  if (lenis === null) track.setAttribute('data-lenis-prevent', '');

  /* ---------- feed filter ---------- */
  const items = $$('.vid, .nw');
  $$('.feed .chip').forEach((b) => b.addEventListener('click', () => {
    $$('.feed .chip').forEach((x) => x.classList.toggle('on', x === b));
    const f = b.dataset.feed; let n = 0;
    items.forEach((it) => { const ok = f === 'all' || it.dataset.cat === f; it.hidden = !ok; if (ok) n++; });
    $('.vids').hidden = !$$('.vid').some((v) => !v.hidden);
    $('.news').hidden = !$$('.nw').some((v) => !v.hidden);
    $('.feed-empty').hidden = n > 0;
  }));

  /* ---------- newsletter (prototype) ---------- */
  const form = $('#nl-form'), msg = $('.nl-msg');
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const v = $('#nl-email').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { msg.textContent = 'Перевірте адресу: має бути щось на кшталт name@agency.ua.'; return; }
    msg.textContent = 'Це прототип сторінки: на живому сайті тут спрацює підписка на ' + v + '.';
  });

  /* ---------- partners ↔ faces ---------- */
  const SUB = { logos: 'Міжнародні мережі, дослідники, юристи й компанії, які підтримують ринок', faces: 'Наглядова рада і дирекція — люди, які ведуть ринок' };
  const CTA = { logos: ['Стати партнером ВРК', 'https://vrk.org.ua/contacts.html'], faces: ['Уся Наглядова рада і дирекція →', 'https://vrk.org.ua/coalition/'] };
  $$('.seg button').forEach((b) => b.addEventListener('click', () => {
    const m = b.dataset.pv;
    $$('.seg button').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
    $('.pv-logos').hidden = m !== 'logos'; $('.pv-faces').hidden = m !== 'faces';
    $('[data-pvsub]').textContent = SUB[m];
    const c = $('[data-pvcta]'); c.textContent = CTA[m][0]; c.href = CTA[m][1];
    if (window.gsap && !reduce) gsap.fromTo($$(m === 'logos' ? '.pv-logos .pl' : '.pv-faces .face'), { y: 24, scale: .96 }, { y: 0, scale: 1, duration: .6, stagger: .03, ease: 'power3.out' });
  }));

  /* ---------- motion (GSAP + Lenis), transform-only so content is readable at rest ---------- */
  if (reduce || !window.gsap) { $('.manifest').classList.add('seen'); return; }
  gsap.registerPlugin(ScrollTrigger);
  if (window.Lenis) {
    try {
      lenis = new Lenis({ lerp: .1, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      track.setAttribute('data-lenis-prevent-wheel', '');
    } catch (err) { lenis = null; }
  }

  // hero intro
  gsap.from('.hero-h', { y: 50, duration: 1, ease: 'power4.out' });
  gsap.from('.hero-p, .hero .btns', { y: 24, duration: .9, delay: .25, stagger: .08, ease: 'power3.out' });
  gsap.from('.mcol', { yPercent: 12, duration: 1.4, stagger: .08, ease: 'power3.out' });

  // section headings rise in
  $$('.h2, .who-h, .units-h').forEach((h) => gsap.from(h, { y: 48, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 90%', once: true } }));

  // numbers count up
  $$('.cnt').forEach((el) => {
    const to = parseFloat(el.dataset.to), pre = el.dataset.pre || '';
    const o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => {
      gsap.fromTo(o, { v: 0 }, { v: to, duration: 1.6, ease: 'power2.out', onUpdate: () => { el.textContent = pre + Math.round(o.v); } });
    } });
  });

  // manifesto: words ink in as you scroll (starts grey, ends black / teal)
  const words = $$('.mf-text .w');
  gsap.fromTo(words, { color: '#A0A0A6' }, { color: (i, w) => (w.classList.contains('acc') ? '#35BDB2' : '#121212'), stagger: .05, ease: 'none',
    scrollTrigger: { trigger: '.manifest', start: 'top 70%', end: 'center 45%', scrub: .6, onLeave: () => $('.manifest').classList.add('seen') } });
  ScrollTrigger.create({ trigger: '.manifest', start: 'center 55%', onEnter: () => $('.manifest').classList.add('seen') });
  gsap.to('.mf-a', { y: -90, ease: 'none', scrollTrigger: { trigger: '.manifest', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.to('.mf-b', { y: 70, ease: 'none', scrollTrigger: { trigger: '.manifest', start: 'top bottom', end: 'bottom top', scrub: true } });

  // cards lift in
  const lift = (sel, trig) => gsap.from(sel, { y: 60, duration: .9, stagger: .08, ease: 'power3.out', scrollTrigger: { trigger: trig || sel, start: 'top 88%', once: true } });
  lift('.throne > *', '.throne'); lift('.ins', '.ins-grid'); lift('.bf', '.bf-grid'); lift('.sf', '.sf-grid'); lift('.ben', '.bens'); lift('.unit', '.units');
  gsap.from('.who-row', { x: -40, duration: .8, stagger: .05, ease: 'power3.out', scrollTrigger: { trigger: '.who-list', start: 'top 85%', once: true } });
  gsap.from('.dir', { x: 120, duration: 1, stagger: .07, ease: 'power3.out', scrollTrigger: { trigger: '.dir-track', start: 'top 85%', once: true } });

  // ghost word drifts, ribbon turns with scroll
  gsap.to('.ghost', { xPercent: -18, ease: 'none', scrollTrigger: { trigger: '.dirs', start: 'top bottom', end: 'bottom top', scrub: true } });
  const ribbonMQ = window.matchMedia('(min-width: 981px)');
  if (ribbonMQ.matches) {
    gsap.fromTo('.ribbon', { rotate: -10, scale: .9, xPercent: -50, yPercent: -50 }, { rotate: 8, scale: 1.04, xPercent: -50, yPercent: -50, ease: 'none',
      scrollTrigger: { trigger: '.partners', start: 'top bottom', end: 'bottom top', scrub: true } });
  } else {
    gsap.fromTo('.ribbon', { rotate: -8 }, { rotate: 6, ease: 'none', scrollTrigger: { trigger: '.partners', start: 'top bottom', end: 'bottom top', scrub: true } });
  }
  gsap.to('.fests-art img', { y: -30, ease: 'none', scrollTrigger: { trigger: '.fests', start: 'top bottom', end: 'top top', scrub: true } });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();

