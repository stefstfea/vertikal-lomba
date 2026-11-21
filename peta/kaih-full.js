/* ============================================================================
   KAIH PETA — kaih-full.js   (Mode Lengkap versi baru)
   Alur : Guide mendekati kamera -> terbang ke langit/awan -> bergeser ke kiri jadi pusat orbit
          -> 7 komponen (models.js) + 1 lingkaran panah mengitari Guide.
   Roulette : geser atas/bawah (drag, scroll, tombol panah) -> komponen di posisi fokus (kanan) = objek kajian,
              datanya tampil di sisi kanan. Tarik lingkaran panah ke kanan -> kesimpulan penuh.
   Pemakaian: KaihFull.open() -> Promise<boolean> (false = gagal dimuat, pakai tampilan lama)
   Bergantung pada global index.html: HABIT_DATA, KES, KAIH_N, kdist, QTEXT, fmt, renderFull, openData, LOCATIONS_DATA
   Memuat: ../src/guide/guide-model.js, ../src/landscape/modules/models.js + r3f-lite.js (Three.js r128).
   ========================================================================== */
(function () {
  'use strict';
  var doc = document, STEP = Math.PI / 4, TAU = Math.PI * 2;
  var THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  var SRC = { guide: '../src/guide/guide-model.js', models: '../src/landscape/modules/models.js', r3f: '../src/landscape/modules/r3f-lite.js' };
  var TYPE = { bangunPagi: 'clock', beribadah: 'angel', berolahraga: 'treadmill', makanSehat: 'food', gemarBelajar: 'book', bermasyarakat: 'people', tidurCepat: 'bed' };
  var SHORT = { bangunPagi: 'Bangun', beribadah: 'Ibadah', berolahraga: 'Olahraga', makanSehat: 'Makan', gemarBelajar: 'Belajar', bermasyarakat: 'Sosial', tidurCepat: 'Tidur' };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- util ---------- */
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var eOut = function (t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); };
  var eIO = function (t) { t = clamp(t, 0, 1); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var eBack = function (t) { t = clamp(t, 0, 1); var c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  var seg = function (t, a, b) { return clamp((t - a) / (b - a), 0, 1); };
  var wrap4 = function (d) { d = ((d % 8) + 8) % 8; return d > 4 ? d - 8 : d; };
  function loadScript(src) { return new Promise(function (res, rej) { var s = doc.createElement('script'); s.src = src; s.onload = res; s.onerror = function () { rej(new Error('gagal memuat ' + src)); }; doc.head.appendChild(s); }); }

  /* ---------- data ---------- */
  function keys() { return Object.keys(HABIT_DATA); }
  function shortTitle(k) { return HABIT_DATA[k].title.replace(/^(Pulau|Kuil|Arena|Lembah|Menara|Desa|Awan) /, ''); }
  function meanNs(ns) { var t = 0, m = 0; ns.forEach(function (n, i) { t += n; m += n * (i + 1); }); return t ? m / t : 0; }
  function meanH(f, k) { return meanNs(kdist(f, HABIT_DATA[k].q).ns); }
  function meanQ(f, q) { return meanNs(KAIH_N[f][q]); }
  function locOf(k) { return LOCATIONS_DATA.filter(function (l) { return l.habit === k; })[0]; }

  /* ---------- grafik SVG (gaya navy + emas) ---------- */
  function bar(vals, labs, max, f) {
    var w = 300, h = 150, pl = 10, pr = 10, pt = 20, pb = 22, n = vals.length, gw = (w - pl - pr) / n, bw = Math.min(30, gw * .58), s = '';
    s += '<line x1="' + pl + '" x2="' + (w - pr) + '" y1="' + (h - pb) + '" y2="' + (h - pb) + '" stroke="#8a93b8"/>';
    vals.forEach(function (v, i) {
      var bh = Math.max(2, v / max * (h - pb - pt)), x = pl + gw * i + (gw - bw) / 2, y = h - pb - bh;
      s += '<rect class="kf-bar" style="--d:' + (i * 55) + 'ms" x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="2.5" fill="url(#' + (i % 2 ? 'kfGold' : 'kfNavy') + ')"/>' +
        '<text class="kf-v" style="--d:' + (i * 55 + 300) + 'ms" x="' + (x + bw / 2) + '" y="' + (y - 4) + '">' + f(v) + '</text>' +
        '<text class="kf-x" x="' + (x + bw / 2) + '" y="' + (h - 7) + '">' + labs[i] + '</text>';
    });
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid meet">' + s + '</svg>';
  }
  function smoothPath(p) {
    var d = 'M' + p[0][0] + ',' + p[0][1];
    for (var i = 0; i < p.length - 1; i++) {
      var a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
      d += ' C' + (b[0] + (c[0] - a[0]) / 6) + ',' + (b[1] + (c[1] - a[1]) / 6) + ' ' + (c[0] - (e[0] - b[0]) / 6) + ',' + (c[1] - (e[1] - b[1]) / 6) + ' ' + c[0] + ',' + c[1];
    }
    return d;
  }
  function line(series, labs, min, max) {
    var w = 300, h = 150, pl = 26, pr = 10, pt = 12, pb = 22, n = labs.length, s = '';
    var X = function (i) { return pl + (w - pl - pr) * i / (n - 1); }, Y = function (v) { return pt + (h - pt - pb) * (1 - (v - min) / (max - min)); };
    for (var g = 0; g <= 3; g++) { var v = min + (max - min) * g / 3, y = Y(v); s += '<line class="kf-g" x1="' + pl + '" x2="' + (w - pr) + '" y1="' + y + '" y2="' + y + '"/><text class="kf-x" text-anchor="end" x="' + (pl - 4) + '" y="' + (y + 3) + '">' + v.toFixed(1) + '</text>'; }
    series.forEach(function (se, k) {
      var pts = se.v.map(function (v, i) { return [X(i), Y(v)]; }), d = smoothPath(pts);
      s += '<path class="kf-area" d="' + d + ' L' + X(n - 1) + ',' + (h - pb) + ' L' + X(0) + ',' + (h - pb) + 'Z" fill="url(#kfArea' + k + ')"/>' +
        '<path class="kf-line" pathLength="1" d="' + d + '" fill="none" stroke="' + se.c + '" stroke-width="2.4" style="--d:' + (k * 150) + 'ms"/>';
      pts.forEach(function (p) { s += '<circle class="kf-dot" cx="' + p[0] + '" cy="' + p[1] + '" r="3.2" fill="' + se.c + '"/>'; });
    });
    labs.forEach(function (l, i) { s += '<text class="kf-x" text-anchor="middle" x="' + X(i) + '" y="' + (h - 7) + '">' + l + '</text>'; });
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid meet">' + s + '</svg>';
  }
  var cap = function (t) { return '<p class="kf-cap">' + t + '</p>'; };
  var NAVY = '#1e2d6b', GOLD = '#c9993a';

  /* isi panel kanan untuk satu komponen (0-6 = kebiasaan, 7 = kesimpulan) */
  function panelData(i) {
    var K = keys();
    if (i === 7) {
      var f4 = K.map(function (k) { return KES[k].f4; });
      return {
        title: 'Kesimpulan Penuh',
        p1: 'Tarik lingkaran panah ke kanan untuk membuka kesimpulan lengkap dari ketujuh kebiasaan.',
        p2: 'Grafik di bawah membandingkan semua kebiasaan pada Frekuensi 4 dan perubahannya sejak Frekuensi 1.',
        c: [cap('Rata-rata skor Frekuensi 4 (skala 1–7)') + bar(f4, K.map(function (k) { return SHORT[k]; }), 7, function (v) { return fmt(v); }),
          '<h5>Ringkasan</h5><p>Penerapan 7 KAIH sudah terlihat, tetapi belum merata. Kekuatan paling menonjol ada pada <b>Bermasyarakat</b> dan <b>Beribadah</b>; <b>Tidur Cepat</b> dan <b>Berolahraga</b> paling membutuhkan penguatan.</p>',
          cap('Proporsi jawaban skala 6–7 (%)') + bar(K.map(function (k) { return KES[k].hi; }), K.map(function (k) { return SHORT[k]; }), 100, function (v) { return fmt(v, 0); }),
          cap('Rata-rata skor: Frekuensi 1 (emas) dan Frekuensi 4 (navy)') + line([{ v: K.map(function (k) { return KES[k].f1; }), c: GOLD }, { v: K.map(function (k) { return KES[k].f4; }), c: NAVY }], K.map(function (k) { return SHORT[k].slice(0, 3); }), 3, 7)]
      };
    }
    var k = K[i], h = HABIT_DATA[k], e = KES[k], q = h.q, d4 = kdist('F4', q), FK4 = ['F1', 'F2', 'F3', 'F4'];
    return {
      title: h.title, p1: h.subtitle,
      p2: 'Rata-rata skor Frekuensi 4 adalah ' + fmt(e.f4) + ' dari 7 (' + (e.d >= 0 ? 'naik ' : 'turun ') + fmt(Math.abs(e.d)) + ' dari Frekuensi 1). ' + e.pos + '.',
      c: [cap('Sebaran jawaban Frekuensi 4 (%) pada skala 1–7') + bar(d4.pc, ['1', '2', '3', '4', '5', '6', '7'], Math.max.apply(null, d4.pc) * 1.05, function (v) { return fmt(v, 1); }),
        '<h5>' + e.pos + '</h5><p>' + e.text + '</p><small>' + e.prog + ' · target ≥' + e.tgt + '%</small>',
        cap('Rata-rata skor tiap frekuensi (skala 1–7)') + bar(FK4.map(function (f) { return meanH(f, k); }), FK4, 7, function (v) { return fmt(v); }),
        cap('<i style="background:' + NAVY + '"></i>' + q[0] + ' ' + QTEXT[q[0]] + ' <i style="background:' + GOLD + '"></i>' + q[1] + ' ' + QTEXT[q[1]]) +
        line([{ v: FK4.map(function (f) { return meanQ(f, q[0]); }), c: NAVY }, { v: FK4.map(function (f) { return meanQ(f, q[1]); }), c: GOLD }], FK4, 1, 7)]
    };
  }

  /* ---------- pemuatan mesin 3D ---------- */
  var loading = null;
  function engine() {
    if (loading) return loading;
    loading = (async function () {
      try {
        if (!window.THREE) { try { await loadScript(THREE_URL); } catch (e) {} }
        if (!window.THREE) { try { if (parent !== window && parent.THREE) window.THREE = parent.THREE; } catch (e) {} }
        if (!window.KaihGuideModel) await loadScript(SRC.guide);
        if (!window.KAIH_createModels) await loadScript(SRC.models);
        if (!(window.KAIH && KAIH.r3f)) await loadScript(SRC.r3f);
        return !!(window.THREE && window.KaihGuideModel && window.KAIH && KAIH.r3f && KAIH.models);
      } catch (e) { console.warn('[Mode Lengkap] 3D tidak tersedia, memakai tampilan lama', e); return false; }
    })().then(function (ok) { if (!ok) loading = null; return ok; });
    return loading;
  }

  /* ---------- keadaan ---------- */
  var S = null, el, T = 0, last = 0, raf = 0, isOpen = false;
  var W = 0, H = 0, portrait = false, G = 100, cx = 0, cy = 0, R = 0, IR = 40;
  var rot = 0, tgt = 0, rv = 0, drag = null, wheelAcc = 0, wheelT = 0, shownFocus = -1, swapTok = 0;
  var sp = 0, sTgt = 0, arrow = { x: 0, y: 0, down: false };
  var gx = 0, gy = 0, pgx = 0, pgy = 0, vel = { x: 0, y: 0 }, legPh = 0, hatS = { a: 0, v: 0 }, tailS = { a: 0, v: 0 }, blinkT = 3, blink = 0, lookX = 0, gestT = 0;
  var hold = null, hpShow = 0, dom = { on: false, t: 9, r: 0 }, dstars = [], dctx = null, items = [], clouds = [], gm = null, rr = null, scene = null, cam = null, T3 = null;

  function build() {
    el = doc.createElement('div'); el.id = 'kf'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<svg width="0" height="0" style="position:absolute"><defs>' +
      '<linearGradient id="kfNavy" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4d94"/><stop offset="1" stop-color="#1b2762"/></linearGradient>' +
      '<linearGradient id="kfGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9cf84"/><stop offset="1" stop-color="#b98b2e"/></linearGradient>' +
      '<linearGradient id="kfArea0" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + GOLD + '" stop-opacity=".5"/><stop offset="1" stop-color="' + GOLD + '" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="kfArea1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + NAVY + '" stop-opacity=".38"/><stop offset="1" stop-color="' + NAVY + '" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="kfHalo"><stop offset="0" stop-color="#fff7d6" stop-opacity=".95"/><stop offset="1" stop-color="#fff7d6" stop-opacity="0"/></radialGradient>' +
      '<mask id="kfMask"><rect width="200" height="200" fill="#fff"/><circle cx="118" cy="92" r="68" fill="#000"/></mask></defs></svg>' +
      '<div class="kf-bg"></div><div class="kf-clouds"></div>' +
      '<canvas class="kf-dom"></canvas><div class="kf-shock"></div><div class="kf-shock s2"></div>' +
      '<svg class="kf-ring"><circle class="kf-r1" fill="none"/><circle class="kf-r2" fill="none"/></svg>' +
      '<canvas class="kf-cv"></canvas><div class="kf-bubs"></div>' +
      '<aside class="kf-panel"><div class="kf-pin"><h2 class="kf-title"></h2><p class="kf-p1"></p><p class="kf-p2"></p>' +
      '<div class="kf-grid"><div class="kf-card"></div><div class="kf-card kf-txt"></div><div class="kf-card"></div><div class="kf-card"></div></div></div></aside>' +
      '<div class="kf-acts"><button class="kf-btn" data-a="back" type="button">Kembali</button><button class="kf-btn" data-a="map" type="button">Peta</button></div>' +
      '<div class="kf-scrim"></div><div class="kf-sheet" role="dialog" aria-label="Kesimpulan penuh"><div class="kf-sheet-in"><div id="kf-sheet-body"></div><div class="dm-actions"><button class="kf-btn" data-a="sheet" type="button">Kembali ke Orbit</button></div></div></div>' +
      '<div class="kf-hint">Geser atas / bawah untuk berganti kajian</div><div class="kf-charge"></div><div class="kf-flash"></div>';
    doc.body.appendChild(el);
    var bubs = el.querySelector('.kf-bubs'), K = keys();
    for (var i = 0; i < 8; i++) {
      var b = doc.createElement('button'); b.type = 'button'; b.className = 'kf-bub' + (i === 7 ? ' kf-arrow' : ''); b.dataset.i = i;
      b.setAttribute('aria-label', i === 7 ? 'Kesimpulan penuh' : shortTitle(K[i]));
      b.innerHTML = (i === 7 ? '<svg viewBox="0 0 64 64" class="kf-arr"><path d="M32 11a21 21 0 1 0 19 12" fill="none" stroke="#c9993a" stroke-width="5" stroke-linecap="round"/><path d="M45 8l8 17-18-3z" fill="#c9993a"/></svg>' : '') +
        '<span class="kf-lbl">' + (i === 7 ? 'Kesimpulan' : shortTitle(K[i])) + '</span>';
      bubs.appendChild(b);
    }
    for (var c = 0; c < 11; c++) {                       // awan: 0-6 melintas saat terbang, 7-10 menetap sebagai bingkai
      var im = doc.createElement('img'); im.src = 'assets/cloud-' + 'abc'[c % 3] + '.png'; im.alt = ''; im.draggable = false;
      el.querySelector('.kf-clouds').appendChild(im);
      clouds.push({ el: im, x: Math.random(), w: .22 + Math.random() * .22, sp: .75 + Math.random() * .5, off: -Math.random() * .45, fr: c >= 7, fx: [.02, .22, .72, .95][c - 7] || 0, fy: [.95, 1.0, .98, .86][c - 7] || 0 });
    }
    wire();
  }

  function init3D() {
    var THREE = window.THREE, cv = el.querySelector('.kf-cv');
    rr = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true });
    rr.setClearColor(0x000000, 0); rr.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); rr.outputEncoding = THREE.sRGBEncoding;
    scene = new THREE.Scene(); cam = new THREE.OrthographicCamera(0, 1, 1, 0, -2000, 2000);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c2ff, .95));
    var dl = new THREE.DirectionalLight(0xffffff, .85); dl.position.set(-.4, .8, 1); scene.add(dl);
    gm = window.KaihGuideModel.build(THREE); scene.add(gm.root); scene.add(gm.cape.mesh);
    var K = keys(), box = new THREE.Box3(), v = new THREE.Vector3();
    for (var i = 0; i < 7; i++) {
      var holder = new THREE.Group(), m = KAIH.r3f.mount(KAIH.models.xj[TYPE[K[i]]]);
      m.updateMatrixWorld(true); box.setFromObject(m); var ctr = box.getCenter(new THREE.Vector3()), size = box.getSize(v);
      m.position.sub(ctr); holder.add(m); holder.userData.dim = Math.max(size.x, size.y, size.z) || 2; scene.add(holder); items.push(holder);
    }
  }

  /* ---------- tata letak ---------- */
  function layout() {
    W = innerWidth; H = innerHeight; portrait = W < H * .95;
    if (portrait) { G = Math.min(W * .15, H * .085); cx = W * .2; cy = H * .27; R = Math.min(H * .2, W * .34); }
    else { G = Math.min(H * .15, W * .085); cx = W * .2; cy = H * .52; R = Math.min(H * .37, W * .2); }
    IR = R * .2;
    var dc = el.querySelector('.kf-dom'); dc.width = W; dc.height = H; dctx = dc.getContext('2d'); dstars = [];
    for (var q = 0; q < 900; q++) { var rr0 = Math.pow(Math.random(), .7) * Math.hypot(W, H), arm = (q % 2) * Math.PI; dstars.push({ r: rr0, a: arm + rr0 * .006 + (Math.random() - .5) * .9, s: Math.random() * 1.7 + .4, ph: Math.random() * TAU, sp: .8 + Math.random() * 2.2 }); }
    if (rr) { rr.setSize(W, H, false); cam.right = W; cam.top = H; cam.updateProjectionMatrix(); }
    var rg = el.querySelector('.kf-ring'); rg.setAttribute('width', W); rg.setAttribute('height', H);
    ['kf-r1', 'kf-r2'].forEach(function (c, i) { var n = rg.querySelector('.' + c); n.setAttribute('cx', cx); n.setAttribute('cy', cy); n.setAttribute('r', R * (i ? 1.18 : 1)); n.style.strokeDasharray = TAU * R * (i ? 1.18 : 1); });
    el.style.setProperty('--ix', Math.round(cx + R + IR * 1.25 + (portrait ? 70 : 150)) + 'px');
  }

  /* ---------- panel kanan ---------- */
  function paint(i) {
    var d = panelData(i), p = el.querySelector('.kf-panel');
    p.querySelector('.kf-title').textContent = d.title; p.querySelector('.kf-p1').textContent = d.p1; p.querySelector('.kf-p2').textContent = d.p2;
    p.querySelectorAll('.kf-card').forEach(function (c, n) { c.innerHTML = d.c[n]; });
  }
  function setFocus(i, dir) {
    if (i === shownFocus) return; var first = shownFocus < 0; shownFocus = i; var tok = ++swapTok, pin = el.querySelector('.kf-pin');
    el.querySelectorAll('.kf-bub').forEach(function (b) { b.classList.toggle('focus', +b.dataset.i === i); });
    if (first || reduce) { paint(i); return; }
    pin.style.transition = 'opacity .16s ease, transform .16s ease'; pin.style.opacity = 0; pin.style.transform = 'translateY(' + (-22 * dir) + 'px)';
    setTimeout(function () {
      if (tok !== swapTok) return; paint(i);
      pin.style.transition = 'none'; pin.style.transform = 'translateY(' + (26 * dir) + 'px)'; void pin.offsetWidth;
      pin.style.transition = 'opacity .42s ease, transform .55s cubic-bezier(.22,1,.36,1)'; pin.style.opacity = 1; pin.style.transform = 'none';
    }, 170);
  }

  /* ---------- input ---------- */
  function step(n) { tgt = Math.round(tgt) + n; }
  function wire() {
    el.addEventListener('pointerdown', function (e) {
      if (!isOpen || e.target.closest('.kf-panel,.kf-acts,.kf-sheet')) return;
      if (T < 4.7) { T = 4.7; return; }                                  // ketuk saat intro = lewati
      if (T > 5.4 && !sTgt && !e.target.closest('.kf-bub') && Math.hypot(e.clientX - gx, e.clientY - gy) < G * 1.3) { hold = { x: e.clientX, y: e.clientY, t0: T }; try { el.setPointerCapture(e.pointerId); } catch (x) {} return; }
      var b = e.target.closest('.kf-bub'), i = b ? +b.dataset.i : -1;
      drag = { x0: e.clientX, y0: e.clientY, rot0: rot, i: i, mode: i === 7 ? 'pending' : 'wheel', t: performance.now(), y: e.clientY, ly: e.clientY, lt: performance.now() };
      rv = 0; try { el.setPointerCapture(e.pointerId); } catch (x) {}
    });
    el.addEventListener('pointermove', function (e) {
      if (hold && Math.hypot(e.clientX - hold.x, e.clientY - hold.y) > 18) hold = null;
      if (!drag) return; var dx = e.clientX - drag.x0, dy = e.clientY - drag.y0, now = performance.now();
      if (drag.mode === 'pending' && Math.hypot(dx, dy) > 9) { drag.mode = Math.abs(dx) > Math.abs(dy) ? 'arrow' : 'wheel'; if (drag.mode === 'arrow') arrow.down = true; }
      if (drag.mode === 'wheel') {
        var nr = drag.rot0 - dy / (R * STEP); rv = (nr - rot) / Math.max(.008, (now - drag.lt) / 1000); drag.lt = now; rot = tgt = nr;
      } else if (drag.mode === 'arrow') {
        arrow.x = clamp(dx, -30, W); arrow.y = clamp(dy, -H * .2, H * .2); sTgt = sp = clamp(dx / (W * (portrait ? .5 : .3)), 0, 1);
      }
    });
    function up() {
      hold = null; if (!drag) return; var d = drag; drag = null;
      if (d.mode === 'wheel') {
        if (Math.abs(rot - d.rot0) < .04 && d.i >= 0) tgt = Math.round(rot) + wrap4(d.i - Math.round(rot));       // ketuk komponen = jadikan fokus
        else tgt = Math.round(rot + clamp(rv, -6, 6) * .16);
      } else if (d.mode === 'arrow') { arrow.down = false; sTgt = sp > .4 ? 1 : 0; if (sTgt) openSheetContent(); }
      else if (d.mode === 'pending') { tgt = Math.round(rot); }
    }
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', function (e) {
      if (!isOpen || e.target.closest('.kf-sheet') || (portrait && e.target.closest('.kf-panel'))) return;
      e.preventDefault(); wheelAcc += e.deltaY; var now = performance.now();
      if (Math.abs(wheelAcc) > 36 && now - wheelT > 240) { step(wheelAcc > 0 ? 1 : -1); wheelAcc = 0; wheelT = now; }
    }, { passive: false });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (b) { var a = b.dataset.a;
        if (a === 'back') api.close(true); else if (a === 'map') { var l = shownFocus >= 0 && shownFocus < 7 ? locOf(keys()[shownFocus]) : null; api.close(true); if (l) setTimeout(function () { openData(l.id); }, 420); }
        else if (a === 'sheet') sTgt = 0; }
      if (e.target.classList.contains('kf-scrim')) sTgt = 0;
    });
    doc.addEventListener('keydown', function (e) {
      if (!isOpen || sTgt) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') step(-1);
    });
    addEventListener('resize', function () { if (S) layout(); });
  }
  function openSheetContent() { renderFull(); el.querySelector('#kf-sheet-body').innerHTML = doc.getElementById('full-body').innerHTML; el.querySelector('.kf-sheet-in').scrollTop = 0; }

  /* ---------- Guide ---------- */
  function poseGuide(dt, t, ph, spin, alpha, scl) {
    var P = gm.parts, r = gm.root, THREE = window.THREE, K = clamp;
    vel.x += ((gx - pgx) / dt - vel.x) * Math.min(1, dt * 12); vel.y += ((gy - pgy) / dt - vel.y) * Math.min(1, dt * 12); pgx = gx; pgy = gy;
    var hov = reduce ? 0 : Math.sin(t * 2.1) * G * .075;
    r.scale.set(G * scl, G * scl, G * scl); r.position.set(gx + (hpShow > .05 ? (Math.random() - .5) * G * .09 * hpShow : 0), H - gy + hov, 0);
    lookX += ((ph >= 3 ? .75 : 0) - lookX) * Math.min(1, dt * 4);
    r.rotation.set(Math.sin(t * 1.3) * .035, lookX * .22 + Math.sin(t * .8) * .15 + spin, K(-vel.x * .0007, -.4, .4) + Math.sin(t * 1.1) * .035);
    var wave = ph === 0 || (ph === 3 && gestT > 0), cheer = ph === 1;
    if (ph === 3) gestT = Math.max(0, gestT - dt);
    P.arms.forEach(function (a, i) {
      var sg = i ? 1 : -1, tz = sg * .96 + Math.sin(t * 1.9 + i * 1.7) * .07, tx = 0;
      if (wave && i === 1) { tz = 2.55 + Math.sin(t * 9.5) * .4; tx = .1; }
      if (cheer) { tz = sg * (2.65 + Math.sin(t * 10.5 + i * 1.3) * .24); tx = .05; }
      if (ph === 2) { tz = sg * 1.45; tx = .1; }
      var k = Math.min(1, dt * 11); a.rotation.z += (tz - a.rotation.z) * k; a.rotation.x += (tx - a.rotation.x) * k;
    });
    var run = K(Math.hypot(vel.x, vel.y) / 380, 0, 1); legPh += dt * (2.2 + run * 9);
    P.legs.forEach(function (l, i) { l.rotation.x = Math.sin(legPh + i * Math.PI) * (.09 + .75 * run) + (cheer ? Math.sin(t * 11 + i * Math.PI) * .4 : 0); l.rotation.z = (i ? .07 : -.07) + K(-vel.x * .0011, -.5, .5); });
    hatS.v += (-hatS.a * 90 - hatS.v * 7 - vel.y * .004) * dt; hatS.a += hatS.v * dt;
    P.hat.rotation.x = K(hatS.a, -.7, .7) * .42; P.hat.rotation.z = P.hat.userData.baseZ + hatS.a * .08; P.hat.position.y = .92 + Math.max(0, hatS.a) * .035;
    tailS.v += (-tailS.a * 70 - tailS.v * 6 + vel.y * .0035 - Math.abs(vel.x) * .0006) * dt; tailS.a += tailS.v * dt;
    P.tail.rotation.x = .03 + K(tailS.a, -.5, .5) + Math.sin(t * 3.1) * .05;
    blinkT -= dt; if (blinkT < 0) { blinkT = 2.4 + Math.random() * 2.6; blink = .13; } if (blink > 0) blink -= dt;
    P.eyes.forEach(function (e) { e.scale.y = blink > 0 ? .012 : .07; });
    P.face.rotation.y = lookX * .42; P.mouthOpen.visible = false; P.mouth.visible = true;
    gm.setAlpha(alpha); r.updateMatrixWorld(true);
    if (!poseGuide.init) { gm.cape.snap(r.matrixWorld, t); poseGuide.init = true; }
    gm.cape.update(dt, t, r.matrixWorld, vel.x, -vel.y, cheer ? .3 : 0);
  }

  /* ---------- Perluasan Domain (Guide ditahan 10 detik) ---------- */
  function toggleDomain() {
    dom.on = !dom.on; dom.t = 0; el.classList.toggle('kf-dom-on', dom.on);
    var fl = el.querySelector('.kf-flash'); fl.style.transition = 'none'; fl.style.opacity = .9; void fl.offsetWidth; fl.style.transition = 'opacity .9s ease'; fl.style.opacity = 0;
  }
  function updateDomain(dt, t) {
    var cv = el.querySelector('.kf-dom'), s1 = el.querySelector('.kf-shock'), s2 = el.querySelector('.kf-shock.s2'), maxR = Math.hypot(W, H) * 1.05;
    if (dom.t < 2) dom.t += dt; var u = seg(dom.t, 0, 1.6), v = seg(dom.t, 0, 1.0);
    dom.r = dom.on ? maxR * eOut(u) : maxR * (1 - eIO(u));
    if (dom.t >= 2 && !dom.on) dom.r = 0;
    if (dom.r < 1) { cv.style.visibility = 'hidden'; s1.style.opacity = s2.style.opacity = 0; el.style.transform = ''; return; }
    cv.style.visibility = 'visible'; cv.style.clipPath = 'circle(' + dom.r + 'px at ' + gx + 'px ' + gy + 'px)';
    var x = dctx; x.fillStyle = '#02010a'; x.fillRect(0, 0, W, H);
    var g = x.createRadialGradient(gx, gy, 0, gx, gy, Math.hypot(W, H) * .7); g.addColorStop(0, 'rgba(80,50,170,.55)'); g.addColorStop(.35, 'rgba(30,15,80,.4)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    var rot0 = t * .035; x.fillStyle = '#fff';
    for (var i = 0; i < dstars.length; i++) { var d = dstars[i], a = d.a + rot0 * (1.4 - d.r / maxR), sx = gx + Math.cos(a) * d.r, sy = gy + Math.sin(a) * d.r * .8; if (sx < -4 || sx > W + 4 || sy < -4 || sy > H + 4) continue; x.globalAlpha = .25 + .75 * Math.abs(Math.sin(t * d.sp + d.ph)); x.fillRect(sx, sy, d.s, d.s); }
    x.globalAlpha = 1;
    [[s1, dom.r, 1 - u * .6, 1], [s2, maxR * eOut(v) * (dom.on ? 1 : .8), (1 - v) * .8, 0]].forEach(function (p) { var e = p[0], rad = p[1]; e.style.cssText = 'left:' + (gx - rad) + 'px;top:' + (gy - rad) + 'px;width:' + rad * 2 + 'px;height:' + rad * 2 + 'px;opacity:' + (dom.t < 1.7 ? p[2] : 0); });
    var sh = (1 - seg(dom.t, 0, .6)) * 9; el.style.transform = sh > .2 ? 'translate(' + ((Math.random() - .5) * sh) + 'px,' + ((Math.random() - .5) * sh) + 'px)' : '';
  }

  /* ---------- loop utama ---------- */
  function frame(now) {
    raf = requestAnimationFrame(frame); if (!isOpen && T > 0 && el.style.opacity === '0') return;
    var dt = Math.min(.05, Math.max(.001, (now - last) / 1000)); last = now; T += dt;
    var t = T, A = eOut(seg(t, 0, 1.5)), Bp = eIO(seg(t, 1.5, 3.3)), C = eIO(seg(t, 3.3, 4.9)), asc = eIO(seg(t, 1.5, 4.3));
    var sx = W * .5, sy = portrait ? H * .3 : H * .56, ph = t < 1.5 ? 0 : t < 3.3 ? 1 : t < 4.9 ? 2 : 3, spin = 0, scl = lerp(.55, 1.7, A) * (portrait ? .75 : 1);
    if (t < 1.5) { gx = sx; gy = sy + (1 - A) * 20; }
    else if (t < 3.3) { gx = sx; gy = lerp(sy, -H * .3, Bp); scl = lerp(1.7, 1.1, Bp) * (portrait ? .75 : 1); spin = Bp * TAU; }
    else { gx = lerp(sx, cx, C); gy = lerp(-H * .3, cy, eOut(seg(t, 3.3, 4.9))); scl = lerp(1.1, 1, C); }
    if (ph === 3 && gestT <= 0 && !reduce && Math.sin(t * .9) > .985) gestT = 1.4;
    var gal = eOut(seg(t, 0, .5));

    /* roulette */
    if (!drag || drag.mode !== 'wheel') rot += (tgt - rot) * (1 - Math.exp(-dt * 8.5));
    var f = ((Math.round(rot) % 8) + 8) % 8, itemsP = seg(t, 4.6, 5.8);
    if (itemsP > 0) setFocus(f, tgt >= rot ? 1 : -1);
    var s = sp; if (!arrow.down) { sp += (sTgt - sp) * (1 - Math.exp(-dt * 9)); s = sp; arrow.x *= Math.exp(-dt * 9); arrow.y *= Math.exp(-dt * 9); }
    var sheet = el.querySelector('.kf-sheet'), scrim = el.querySelector('.kf-scrim');
    sheet.style.transform = 'translateX(' + ((1 - s) * 104) + '%)'; sheet.style.visibility = s < .002 ? 'hidden' : 'visible'; scrim.style.opacity = s * .55; scrim.style.pointerEvents = s > .5 ? 'auto' : 'none';

    var bubs = el.querySelectorAll('.kf-bub');
    for (var i = 0; i < 8; i++) {
      var th = (i - rot) * STEP, c = Math.cos(th), sn = Math.sin(th), near = (c + 1) / 2, pop = eBack(seg(t, 4.6 + i * .09, 5.3 + i * .09));
      var sc = (.45 + .8 * near * near) * pop, x = cx + R * c, y = cy + R * sn, al = (.3 + .7 * near) * Math.min(1, pop * 1.4);
      if (i === 7) { x += arrow.x; y += arrow.y; }
      var b = bubs[i], r = IR * sc;
      b.style.cssText = 'width:' + r * 2 + 'px;height:' + r * 2 + 'px;transform:translate3d(' + (x - r) + 'px,' + (y - r) + 'px,0);opacity:' + al + ';z-index:' + Math.round(near * 10) + ';pointer-events:' + (pop > .8 && c > -.2 ? 'auto' : 'none');
      b.style.setProperty('--lo', (near > .55 ? 1 : 0)); b.querySelector('.kf-lbl').style.fontSize = Math.round(13 + near * 8) + 'px';
      if (i < 7 && items[i]) { var h = items[i]; h.visible = pop > .01; h.position.set(x, H - y, c * 120 + 60); var k = (r * 1.32) / h.userData.dim; h.scale.set(k, k, k); h.rotation.y = Math.sin(t * .7 + i) * .5; }
    }
    var rg = el.querySelector('.kf-ring'), rp = eOut(seg(t, 4.3, 5.6));
    rg.style.opacity = rp; rg.querySelector('.kf-r1').style.strokeDashoffset = (1 - rp) * TAU * R; rg.querySelector('.kf-r2').style.transform = 'rotate(' + (rot * 45) + 'deg)'; rg.querySelector('.kf-r2').style.transformOrigin = cx + 'px ' + cy + 'px';
    el.classList.toggle('kf-ready', t > 5.4); el.classList.toggle('kf-sheet-on', s > .05);

    /* latar & awan */
    el.querySelector('.kf-bg').style.transform = 'translateY(' + (-41 * (1 - asc)) + '%)';
    clouds.forEach(function (c) {
      var o;
      if (!c.fr) { var u = clamp(asc * c.sp * 1.25 + c.off, 0, 1); o = Math.sin(Math.PI * Math.min(1, u * 1.02)); c.el.style.cssText = 'width:' + (c.w * W * 1.5) + 'px;left:' + (c.x * W - c.w * W * .75) + 'px;top:' + lerp(-.45 * H, 1.2 * H, u) + 'px;opacity:' + (u <= 0 || u >= 1 ? 0 : Math.min(1, o * 2.4)); }
      else { var fa = eOut(seg(t, 3.8, 5.2)), w = (c.fx > .5 ? .4 : .34) * W; c.el.style.cssText = 'width:' + w + 'px;left:' + (c.fx * W - w / 2 + Math.sin(t * .3 + c.fx * 9) * 8) + 'px;top:' + (c.fy * H - w * .34) + 'px;opacity:' + .9 * fa; }
    });

    /* tahan Guide -> domain */
    var want = hold ? clamp((T - hold.t0) / 10, 0, 1) : 0;
    if (hold && want >= 1) { hold = null; want = 0; hpShow = 0; toggleDomain(); }
    hpShow += (want - hpShow) * Math.min(1, dt * (want > hpShow ? 6 : 14));
    var chg = el.querySelector('.kf-charge'), cs = G * (2.5 + hpShow * 1.1);
    chg.style.cssText = 'opacity:' + (hpShow > .02 ? Math.min(1, hpShow * 4) : 0) + ';width:' + cs + 'px;height:' + cs + 'px;left:' + (gx - cs / 2) + 'px;top:' + (gy - cs / 2) + 'px;--p:' + (hpShow * 360) + 'deg;--k:' + hpShow;
    updateDomain(dt, t);

    /* 3D */
    if (gm) {
      poseGuide(dt, t, ph, spin, gal, scl);
      KAIH.r3f.tick(t, dt); rr.render(scene, cam);
    }
    el.querySelector('.kf-hint').style.opacity = t > 6 && t < 11 && !drag ? 1 : 0;
  }

  /* ---------- API ---------- */
  var api = {
    open: async function () {
      if (isOpen) return true;
      if (!(await engine())) return false;
      try {
        if (!S) { build(); S = true; init3D(); }
        layout();
      } catch (e) { console.warn('[Mode Lengkap] gagal menyiapkan scene', e); if (el) el.remove(); S = null; items = []; clouds = []; loading = null; return false; }
      isOpen = true; dom = { on: false, t: 9, r: 0 }; hold = null; hpShow = 0; el.classList.remove('kf-dom-on'); T = reduce ? 6 : 0; rot = tgt = 0; rv = 0; sp = sTgt = 0; shownFocus = -1; poseGuide.init = false; pgx = gx = W * .5; pgy = gy = H * .56; hatS = { a: 0, v: 0 }; tailS = { a: 0, v: 0 };
      el.style.display = 'block'; void el.offsetWidth; el.style.opacity = 1; el.classList.add('on'); el.setAttribute('aria-hidden', 'false');
      last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
      return true;
    },
    close: function (viaButton) {
      if (!isOpen) return; isOpen = false; sTgt = 0; el.classList.remove('on'); el.style.opacity = 0; el.setAttribute('aria-hidden', 'true');
      if (viaButton && typeof closeFull === 'function') try { closeFull(); } catch (e) {}
      setTimeout(function () { if (!isOpen) { cancelAnimationFrame(raf); el.style.display = 'none'; } }, 650);
    },
    isOpen: function () { return isOpen; }
  };
  window.KaihFull = api;
})();
