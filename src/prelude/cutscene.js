/* =====================================================================
   7 KAIH — Cutscene pembuka
   1. Layar putih "Ketuk di mana saja untuk lanjut"
   2. Ketukan -> retakan dimensi menjalar -> pecah -> masuk dunia awan malam
      (musik menu diputar di trigger ini, SFX dari js/cutscene-sfx.js)
   3. "Team WFH (Wajib Fast Hand) Productions" -> "Welcome To Our World" -> logo 7KAIH
   4. Main menu muncul (logo, subjudul, tombol play)
   ===================================================================== */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const body = document.body;
  const splash = $('kaih-splash');
  const cv = $('kaih-rift');
  if (!splash || !cv) { body.classList.remove('kaih-prelude'); return; }
  // Sudah pernah diputar di sesi ini (mis. kembali dari Ladang Langit): lewati seluruh cutscene pembuka
  if (window.KaihSeen && window.KaihSeen.has('prelude')) {
    window.__kaihPreludeSkipped = true;
    window.__kaihSkipPrelude = function () {};
    splash.classList.add('go', 'live', 'done');
    const pre0 = $('kaih-prelude'); if (pre0) pre0.style.display = 'none';
    // menu tetap tersembunyi sampai PLAY otomatis ditekan (hindari kilatan menu); cadangan 8 dtk
    const showMenu = () => body.classList.remove('kaih-prelude');
    if (window.KaihSeen.returning) { addEventListener('kaih-play-start', showMenu, { once: true }); setTimeout(showMenu, 8000); }
    else showMenu();
    window.dispatchEvent(new Event('kaih-prelude-done'));
    return;
  }
  const g = cv.getContext('2d');
  const sfx = window.KaihCutsceneSfx || { play() {}, unlock() {} };
  const reduce = false; // Paksa animasi retakan dimensi tetap tampil pada laptop/desktop.

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeIn = (t) => t * t * t;

  // Waktu (detik) sejak ketukan
  const T_SHATTER = 1.6;     // retakan penuh -> dimensi pecah
  const T_TEXT = 3.0;        // teks pertama mulai muncul

  let W = 0, H = 0, DPR = 1, started = false, finished = false;
  let ox = 0, oy = 0, cells = [], cracks = [], chords = [];

  /* ---------------------------------------------------------------- */
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (!started) paintWhite();
  }
  function paintWhite() {
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
  }
  window.addEventListener('resize', resize);
  resize();

  /* ---------------------------------------------------------------- *
   *  Geometri retakan: grid polar bergerigi di sekitar titik ketukan  *
   * ---------------------------------------------------------------- */
  function build() {
    const Rmax = Math.hypot(Math.max(ox, W - ox), Math.max(oy, H - oy)) * 1.18 + 40;
    const NR = 7, NA = 22;
    const V = [], M = [];
    for (let k = 0; k <= NR; k++) {
      V[k] = [];
      for (let j = 0; j < NA; j++) {
        if (k === 0) { V[k][j] = { x: ox, y: oy }; continue; }
        const ang = ((j + (k === NR ? 0 : rnd(-0.3, 0.3))) / NA) * Math.PI * 2 + (k % 2 ? 0.07 : 0);
        const r = Rmax * Math.pow(k / NR, 1.65) * (k === NR ? 1 : rnd(0.9, 1.1));
        V[k][j] = { x: ox + Math.cos(ang) * r, y: oy + Math.sin(ang) * r };
      }
    }
    for (let k = 0; k < NR; k++) {
      M[k] = [];
      for (let j = 0; j < NA; j++) {
        const a = V[k][j], b = V[k + 1][j];
        const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, off = rnd(-0.16, 0.16) * len;
        M[k][j] = { x: (a.x + b.x) / 2 - (dy / len) * off, y: (a.y + b.y) / 2 + (dx / len) * off };
      }
    }
    cells = [];
    for (let k = 0; k < NR; k++) {
      for (let j = 0; j < NA; j++) {
        const j2 = (j + 1) % NA;
        const pts = k === 0
          ? [V[0][0], M[0][j2], V[1][j2], V[1][j], M[0][j]]
          : [V[k][j], V[k][j2], M[k][j2], V[k + 1][j2], V[k + 1][j], M[k][j]];
        let cx = 0, cy = 0; pts.forEach((p) => { cx += p.x; cy += p.y; }); cx /= pts.length; cy /= pts.length;
        cells.push({
          pts, cx, cy, ring: k,
          delay: k * 0.075 + rnd(0, 0.09), dur: rnd(0.95, 1.3),
          push: rnd(1.25, 2.7), grow: rnd(0.9, 2.6), rot: rnd(-1, 1) * 1.1, fall: rnd(0, 1),
          tint: ['#ffffff', '#fffaf0', '#fff4d6', '#eef6ff', '#fff8e4'][(Math.random() * 5) | 0]
        });
      }
    }
    // retakan radial (jalur bergerigi dari titik pusat)
    cracks = [];
    for (let j = 0; j < NA; j++) {
      const reach = 4 + ((Math.random() * 4) | 0); // sampai ring 4..7
      const pts = [V[0][j]];
      for (let k = 0; k < reach && k < NR; k++) { pts.push(M[k][j]); pts.push(V[k + 1][j]); }
      const cum = [0];
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
      cracks.push({ pts, cum, len: cum[cum.length - 1], start: rnd(0, 0.35), dur: rnd(0.95, 1.25) });
    }
    // retakan melingkar (jaring laba-laba)
    chords = [];
    for (let k = 1; k <= 4; k++) {
      for (let j = 0; j < NA; j++) {
        if (Math.random() > 0.82) continue;
        const a = V[k][j], b = V[k][(j + 1) % NA];
        const mx = (a.x + b.x) / 2 + rnd(-1, 1) * 0.08 * Math.hypot(b.x - a.x, b.y - a.y);
        const my = (a.y + b.y) / 2 + rnd(-1, 1) * 0.08 * Math.hypot(b.x - a.x, b.y - a.y);
        chords.push({ pts: [a, { x: mx, y: my }, b], start: 0.5 + k * 0.15 + rnd(0, 0.12), dur: 0.4 });
      }
    }
  }

  function addPartial(path, pts, cum, len, p) {
    const dist = len * p;
    path.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      if (cum[i] <= dist) { path.lineTo(pts[i].x, pts[i].y); continue; }
      const f = (dist - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
      path.lineTo(pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f, pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f);
      break;
    }
  }
  function crackPath(t) {
    const P = new Path2D();
    for (const c of cracks) {
      const pr = clamp((t - c.start) / c.dur, 0, 1);
      if (pr > 0) addPartial(P, c.pts, c.cum, c.len, 1 - Math.pow(1 - pr, 2));
    }
    for (const c of chords) {
      const pr = clamp((t - c.start) / c.dur, 0, 1);
      if (pr <= 0) continue;
      const cum = [0, Math.hypot(c.pts[1].x - c.pts[0].x, c.pts[1].y - c.pts[0].y)];
      cum.push(cum[1] + Math.hypot(c.pts[2].x - c.pts[1].x, c.pts[2].y - c.pts[1].y));
      addPartial(P, c.pts, cum, cum[2], easeOut(pr));
    }
    return P;
  }
  function strokeCracks(P, w, hr) {
    g.save();
    g.lineJoin = 'round'; g.lineCap = 'round';
    // tepi kuning-emas berpendar di atas putih
    g.strokeStyle = 'rgba(222, 165, 28, .95)'; g.lineWidth = w + 4;
    g.shadowColor = 'rgba(255, 214, 80, .95)'; g.shadowBlur = 14;
    g.stroke(P);
    if (hr > 0) { g.beginPath(); g.arc(ox, oy, hr + 2, 0, 6.2832); g.fillStyle = 'rgba(222,165,28,.95)'; g.fill(); }
    g.restore();
    // potong putih -> dunia awan malam terlihat dari celah
    g.save();
    g.globalCompositeOperation = 'destination-out';
    g.lineJoin = 'round'; g.lineCap = 'round'; g.lineWidth = w; g.strokeStyle = '#000'; g.stroke(P);
    if (hr > 0) { g.beginPath(); g.arc(ox, oy, hr, 0, 6.2832); g.fillStyle = '#000'; g.fill(); }
    g.restore();
    // inti cahaya neon di dalam celah
    g.save();
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.strokeStyle = 'rgba(255, 246, 205, .95)'; g.lineWidth = Math.max(0.8, w * 0.3);
    g.shadowColor = '#ffe27a'; g.shadowBlur = 10;
    g.stroke(P);
    g.restore();
  }
  function polyPath(path, pts) {
    path.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) path.lineTo(pts[i].x, pts[i].y);
    path.closePath();
  }

  /* ---------------------------------------------------------------- */
  function render(t) {
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, W, H);

    if (t < T_SHATTER) {
      const k = clamp(t / T_SHATTER, 0, 1);
      const amp = t < 0.15 ? 0 : 0.6 + 4.2 * k * k;
      g.save();
      g.translate((Math.random() - 0.5) * amp, (Math.random() - 0.5) * amp);
      g.fillStyle = '#fff'; g.fillRect(-30, -30, W + 60, H + 60);
      strokeCracks(crackPath(t), 1.4 + 9 * easeIn(k), 6 + 52 * easeOut(clamp(t / 0.9, 0, 1)));
      g.restore();
      return true;
    }

    const ts = t - T_SHATTER;
    const staticPath = new Path2D();
    const moving = [];
    let anyStatic = false;
    for (const c of cells) {
      const u = (ts - c.delay) / c.dur;
      if (u <= 0) { polyPath(staticPath, c.pts); anyStatic = true; }
      else if (u < 1) moving.push([c, u]);
    }
    if (anyStatic) {
      g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineWidth = 1.2;
      g.fill(staticPath); g.stroke(staticPath);
      g.save(); g.clip(staticPath);
      strokeCracks(crackPath(99), 10.4, 58 + 160 * easeOut(clamp(ts / 0.6, 0, 1)));
      g.restore();
    }
    for (const [c, u] of moving) {
      const e = Math.pow(u, 1.7);
      const push = 1 + e * c.push, s = 1 + e * c.grow;
      const nx = ox + (c.cx - ox) * push, ny = oy + (c.cy - oy) * push + e * e * c.fall * H * 0.12;
      g.save();
      g.globalAlpha = 1 - smooth(0.5, 1, u);
      g.translate(nx, ny); g.rotate(c.rot * e); g.scale(s, s); g.translate(-c.cx, -c.cy);
      const p = new Path2D(); polyPath(p, c.pts);
      g.fillStyle = c.tint; g.fill(p);
      g.lineJoin = 'round'; g.strokeStyle = 'rgba(232, 184, 70, .65)'; g.lineWidth = 1.6 / s; g.stroke(p);
      g.restore();
    }
    return anyStatic || moving.length > 0;
  }

  /* ---------------------------------------------------------------- *
   *  Teks, logo, percikan                                             *
   * ---------------------------------------------------------------- */
  function splitChars(el) {
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    el.textContent = '';
    const chars = [];
    text.split(' ').forEach((word, wi, arr) => {
      const w = document.createElement('span'); w.className = 'pl-w';
      [...word].forEach((ch) => {
        const s = document.createElement('span'); s.className = 'pl-c'; s.textContent = ch;
        w.appendChild(s); chars.push(s);
      });
      el.appendChild(w);
      if (wi < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
    el.setAttribute('aria-label', text);
    return chars;
  }

  async function textIn(el, stagger) {
    const chars = splitChars(el);
    el.style.visibility = 'visible';
    sfx.play('textIn');
    let last;
    chars.forEach((s, i) => {
      last = s.animate(
        [{ opacity: 0, transform: 'translateY(16px) scale(.78)', filter: 'blur(9px)' },
         { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0px)' }],
        { duration: 950, delay: i * stagger, easing: 'cubic-bezier(.2,.75,.25,1)', fill: 'forwards' });
    });
    if (last) await last.finished.catch(() => {});
  }
  async function textOut(el, o) {
    sfx.play('textOut');
    const a = el.animate(
      [{ opacity: 1, transform: 'scale(1) translateY(0)', filter: 'blur(0px)' },
       { opacity: 0, transform: `scale(${o.scale}) translateY(${o.lift}px)`, filter: `blur(${o.blur}px)` }],
      { duration: o.dur, easing: 'cubic-bezier(.5,.05,.85,.45)', fill: 'forwards' });
    await a.finished.catch(() => {});
    el.style.visibility = 'hidden';
  }

  function sparks() {
    const box = $('pl-sparks'); if (!box) return;
    const cols = ['#ffb7d1', '#a9d4ff', '#d0b0ff', '#ffe3a0', '#9ff0d8', '#ffffff'];
    const reach = Math.min(window.innerWidth * 0.48, 340);
    for (let i = 0; i < 26; i++) {
      const s = document.createElement('i'); s.className = 'pl-spark';
      s.style.setProperty('--s', rnd(9, 22).toFixed(1) + 'px'); s.style.background = cols[i % cols.length];
      box.appendChild(s);
      const ang = rnd(0, Math.PI * 2), d = rnd(reach * 0.35, reach);
      const x = Math.cos(ang) * d, y = Math.sin(ang) * d * 0.62;
      const an = s.animate(
        [{ opacity: 0, transform: 'translate(0,0) scale(.2) rotate(0deg)' },
         { opacity: 1, transform: `translate(${x * 0.65}px,${y * 0.65}px) scale(1) rotate(100deg)`, offset: 0.35 },
         { opacity: 0, transform: `translate(${x}px,${y + 34}px) scale(.25) rotate(240deg)` }],
        { duration: rnd(1200, 2000), delay: rnd(0, 280), easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
      an.onfinish = () => s.remove();
    }
  }

  async function logoIn() {
    const logo = $('pl-logo');
    logo.style.visibility = 'visible';
    sfx.play('logo');
    setTimeout(sparks, 330);
    const a = logo.animate(
      [{ opacity: 0, transform: 'scale(.5) translateY(40px) rotate(-3deg)' },
       { opacity: 1, transform: 'scale(1.09) translateY(-8px) rotate(.8deg)', offset: 0.55 },
       { opacity: 1, transform: 'scale(1) translateY(0) rotate(0deg)' }],
      { duration: 1300, easing: 'cubic-bezier(.22,.8,.3,1)', fill: 'forwards' });
    await a.finished.catch(() => {});
  }
  function logoOut() {
    const logo = $('pl-logo');
    return logo.animate(
      [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.14)' }],
      { duration: 1100, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' }).finished.catch(() => {});
  }

  /* ---------------------------------------------------------------- */
  async function playPrelude() {
    // v4: tiap langkah memeriksa S() -> bila tombol Skip ditekan, urutan berhenti
    const S = () => window.__kaihPreludeSkipped;
    if (S()) return;
    try {
      const credit = $('pl-credit'), welcome = $('pl-welcome');
      await textIn(credit, 38); if (S()) return;
      await sleep(1500); if (S()) return;
      await textOut(credit, { scale: 1.55, lift: -6, blur: 12, dur: 1700 }); if (S()) return;
      await sleep(250); if (S()) return;
      await textIn(welcome, 62); if (S()) return;
      await sleep(1500); if (S()) return;
      await textOut(welcome, { scale: 1.14, lift: -26, blur: 10, dur: 1500 }); if (S()) return;
      await sleep(200); if (S()) return;
      await logoIn(); if (S()) return;
      await sleep(2300); if (S()) return;
      // main menu muncul sambil logo prolog memudar
      body.classList.remove('kaih-prelude');
      await logoOut(); if (S()) return;
      const pre = $('kaih-prelude'); if (pre) pre.style.display = 'none';
      window.dispatchEvent(new Event('kaih-prelude-done'));
    } catch (e) { if (!S()) console.warn('[7 KAIH] prelude', e); }
  }
  // v4: dipanggil tombol Skip -> langsung akhiri cutscene pembuka (menu siap)
  window.__kaihSkipPrelude = function () {
    if (window.__kaihPreludeSkipped || !started) return;
    window.__kaihPreludeSkipped = true;
    const cancelAll = (e) => { if (e && e.getAnimations) e.getAnimations().forEach((a) => { try { a.cancel(); } catch (_) {} }); };
    ['bg', 'fx', 'pl-flash', 'pl-ring'].forEach((id) => cancelAll($(id)));
    const pre = $('kaih-prelude'); if (pre) { pre.querySelectorAll('*').forEach(cancelAll); pre.style.display = 'none'; }
    splash.classList.add('go', 'live', 'done'); finished = true;
    body.classList.remove('kaih-prelude');
    window.dispatchEvent(new Event('kaih-prelude-done'));
  };


  /* ---------------------------------------------------------------- *
   *  Pemicu: ketukan di mana saja                                     *
   * ---------------------------------------------------------------- */
  function worldAnim(pre, ms) {
    const bg = $('bg'), fx = $('fx');
    const o = ox + 'px ' + oy + 'px';
    if (bg) bg.style.transformOrigin = o;
    if (fx) fx.style.transformOrigin = o;
    return { bg, fx };
  }

  function start(ev) {
    if (started) return;
    started = true;
    if (window.KaihSeen) window.KaihSeen.mark('prelude');
    if (ev && ev.preventDefault && ev.type !== 'click') ev.preventDefault();

    const px = ev && typeof ev.clientX === 'number' && ev.clientX > 0 ? ev.clientX : W / 2;
    const py = ev && typeof ev.clientY === 'number' && ev.clientY > 0 ? ev.clientY : H / 2;
    ox = clamp(px, 0, W); oy = clamp(py, 0, H);   // tepat di titik klik/ketuk
    document.documentElement.style.setProperty('--ox', ox + 'px');
    document.documentElement.style.setProperty('--oy', oy + 'px');

    // Musik main menu + SFX: trigger tunggal di ketukan ini
    sfx.unlock(); window.dispatchEvent(new Event('kaih-prelude-start'));
    if (typeof window.kaihStartMenuMusic === 'function') window.kaihStartMenuMusic();

    if (reduce) {            // aksesibilitas: tanpa efek pecah, cukup memudar
      splash.classList.add('go', 'live');
      splash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, fill: 'forwards' }).finished
        .then(() => { splash.classList.add('done'); playPrelude(); });
      return;
    }

    build();
    render(0);                       // kanvas putih identik dengan latar CSS -> aman
    splash.classList.add('go', 'live');
    sfx.play('tap'); sfx.play('crack');
    // riak benturan kecil tepat di titik ketukan
    const ring0 = $('pl-ring');
    if (ring0) ring0.animate(
      [{ opacity: .9, transform: 'scale(.2)' }, { opacity: 0, transform: 'scale(5)' }],
      { duration: 650, easing: 'cubic-bezier(.1,.7,.3,1)' });

    const { bg, fx } = worldAnim();
    const pre = [];
    if (bg) pre.push(bg.animate(
      [{ transform: 'scale(1.32)', filter: 'blur(5px) brightness(1.15)' }, { transform: 'scale(1.22)', filter: 'blur(4px) brightness(1.2)' }],
      { duration: T_SHATTER * 1000, easing: 'linear', fill: 'forwards' }));
    if (fx) pre.push(fx.animate([{ transform: 'scale(1.32)' }, { transform: 'scale(1.22)' }],
      { duration: T_SHATTER * 1000, easing: 'linear', fill: 'forwards' }));

    const t0 = performance.now();
    let shattered = false;
    (function frame(now) {
      const t = (now - t0) / 1000;
      if (!shattered && t >= T_SHATTER) { shattered = true; onShatter(bg, fx, pre); }
      const alive = render(t);
      if (alive || t < T_SHATTER) requestAnimationFrame(frame);
      else {
        splash.classList.add('done');
        g.clearRect(0, 0, W, H);
        finished = true;
        window.removeEventListener('resize', resize);
        window.removeEventListener('keydown', onGlobalKeyDown);
      }
    })(t0);

    setTimeout(playPrelude, T_TEXT * 1000 + 0);
    // jaring pengaman bila tab di latar belakang menahan rAF
    setTimeout(() => { splash.classList.add('done'); }, (T_SHATTER + 4.5) * 1000);
  }

  function onShatter(bg, fx, pre) {
    if (window.__kaihPreludeSkipped) return;
    sfx.play('shatter');
    setTimeout(() => sfx.play('enter'), 450);
    const flash = $('pl-flash'), ring = $('pl-ring');
    if (flash) flash.animate(
      [{ opacity: 0, transform: 'scale(.25)' }, { opacity: 1, transform: 'scale(1)', offset: 0.18 }, { opacity: 0, transform: 'scale(2.6)' }],
      { duration: 1100, easing: 'cubic-bezier(.2,.7,.3,1)' });
    if (ring) ring.animate(
      [{ opacity: 1, transform: 'scale(.3)' }, { opacity: 0, transform: 'scale(46)' }],
      { duration: 1500, easing: 'cubic-bezier(.12,.7,.3,1)' });
    const done = [];
    if (bg) done.push(bg.animate(
      [{ transform: 'scale(1.22)', filter: 'blur(4px) brightness(1.2)' }, { transform: 'scale(1)', filter: 'blur(0px) brightness(1)' }],
      { duration: 2800, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' }));
    if (fx) done.push(fx.animate([{ transform: 'scale(1.22)' }, { transform: 'scale(1)' }],
      { duration: 2800, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' }));
    // bersihkan animasi penahan setelah selesai (nilai akhir = tampilan normal)
    setTimeout(() => { pre.concat(done).forEach((a) => { try { a.cancel(); } catch (e) {} }); }, 3000);
  }

  splash.addEventListener('click', start);
  splash.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(null); } });
  function onGlobalKeyDown(e) {
    if (started || e.metaKey || e.ctrlKey || e.altKey || e.key === 'Tab' || e.key === 'Shift') return;
    start(null);
  }
  window.addEventListener('keydown', onGlobalKeyDown);
  try { splash.focus({ preventScroll: true }); } catch (e) {}
})();
