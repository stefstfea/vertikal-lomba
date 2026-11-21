/* ============================================================================
   KAIH PETA — kaih-guide.js   (Guide untuk dashboard peta)
   Maskot yang sama dengan file utama (bola putih, fedora, jas + dasi kupu-kupu): MODEL 3D dari src/guide/guide-model.js,
   digambar dengan Three.js (r128) lewat renderer offscreen. Jika Three.js/model/WebGL tak tersedia, otomatis memakai gambar SVG 2D. Gaya bubble/FAB/menu disamakan dengan Guide di file utama.

   Isi:
   1) Sapaan awal  : Guide terbang masuk saat peta dibuka ("Halo! ini adalah peta dunia! ...")
   2) Tombol Guide : bulat di bawah tombol ⚙ (kiri atas) -> menu: Cara memakai peta, Ulangi sapaan,
                     Tentang Mode Lengkap, (mode embed) Kembali ke Pulau Awan
   3) Selamat 7/7  : Guide bersorak, menjelaskan Mode Lengkap yang baru terbuka, menyorot tombolnya
   Semua teks ada di objek CFG (bagian atas) — ubah di sana untuk file ketiga.
   URL: ?guide=0 mematikan Guide · ?guide=1 memaksa sapaan awal tampil lagi.
   ========================================================================== */
(function () {
  'use strict';
  var html = document.documentElement, doc = document;
  var qs = new URLSearchParams(location.search);
  if (qs.get('guide') === '0') return;
  var $ = function (id) { return doc.getElementById(id); };
  var embed = html.classList.contains('embed');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------ TEKS (ubah di sini) ----------------------- */
  var CFG = {
    name: 'GUIDE',
    seenKey: 'kaih-peta-guide-seen',          // sessionStorage: sapaan awal tampil sekali per sesi
    typeMs: 26,                               // kecepatan ketik (ms/huruf)
    intro: [
      { t: 'Halo!', g: 'wave' },
      { t: 'Ini adalah peta dunia! Atau.. kamu bisa bilang dashboard!', g: 'cheer' },
      { t: 'Kamu bisa interaksi dengan setiap komponen di sini!', g: 'point', hint: '.map-marker, header .sq-btn, .progress, .zoom-box, #btn-full' }
    ],
    tour: function () {
      var n = visited.size, open = n === TOTAL;
      return [
        { t: 'Tombol kompas ini membuka daftar 7 lokasi. Pilih salah satu untuk terbang langsung ke sana, atau mulai ulang peta dari situ.', g: 'point', spot: '#btn-quick-list' },
        { t: 'Ini kemajuanmu. Satu berlian menyala setiap kali satu KAIH selesai kamu kunjungi.', g: 'point', spot: '.progress' },
        { t: 'Perbesar atau perkecil peta dengan tombol ini atau scroll mouse. Di HP, cubit dengan dua jari. Ketuk dua kali untuk kembali ke peta utuh.', g: 'point', spot: '.zoom-box' },
        { t: 'Ketuk bola indikator untuk membuka kartu info, lalu pilih “Lihat Data” untuk melihat grafik dan kesimpulannya.', g: 'point', spot: '.map-marker' },
        { t: open ? 'Dan ini Mode Lengkap — gemboknya sudah terbuka. Ketuk kapan saja untuk ringkasan menyeluruh.'
                  : 'Dan ini Mode Lengkap. Gemboknya terbuka setelah ke-7 KAIH kamu kunjungi (sekarang ' + n + '/' + TOTAL + ').', g: 'point', spot: '#btn-full' }
      ];
    },
    about: function () {
      var n = visited.size;
      if (n < TOTAL) return [{ t: 'Mode Lengkap masih terkunci. Kunjungi ke-7 lokasi dulu — sekarang baru ' + n + '/' + TOTAL + '. Gemboknya akan terbuka sendiri, dan aku akan menjelaskannya padamu.', g: 'idle', spot: '#btn-full' }];
      return [
        { t: 'Mode Lengkap menyajikan ringkasan menyeluruh dari seluruh survei, berisi:', g: 'point', spot: '#btn-full', chips: sectionTitles() },
        { t: 'Mau membukanya sekarang?', g: 'wave', acts: [{ label: 'Buka Mode Lengkap', val: 'open', primary: true }, { label: 'Nanti saja', val: 'later' }] }
      ];
    },
    celebrate: function (info, hooks) {
      return [
        { t: 'Selamat! 🎉 Kamu sudah mengunjungi ke-7 lokasi, dan seluruh pulau kini berwarna penuh!', g: 'cheer', on: hooks.confetti },
        { t: 'Skor rata-rata tertinggi ada di ' + info.top.n + ' (' + info.top.v + '), sedangkan yang paling perlu perhatian adalah ' + info.low.n + ' (' + info.low.v + ').', g: 'point' },
        { t: 'Lihat tombol di pojok kanan bawah… gemboknya terbuka! Itulah Mode Lengkap.', g: 'cheer', spot: '#btn-full', on: hooks.unlock },
        { t: 'Mode Lengkap menyajikan ringkasan menyeluruh dari seluruh survei, berisi:', g: 'point', spot: '#btn-full', chips: sectionTitles() },
        { t: 'Kamu bisa membukanya kapan saja, dan aku selalu ada di bawah tombol ⚙ kalau butuh bantuan. Mau melihatnya sekarang?', g: 'wave',
          acts: [{ label: 'Buka Mode Lengkap', val: 'open', primary: true }, { label: 'Nanti saja', val: 'later' }] }
      ];
    },
    home: [{ t: 'Kembali ke Pulau Awan? Progres kunjunganmu tetap tersimpan.', g: 'idle', acts: [{ label: 'Ya, kembali', val: 'go', primary: true }, { label: 'Tetap di sini', val: 'stay' }] }]
  };

  function sectionTitles() {                  // otomatis mengikuti isi Mode Lengkap (aman dipakai untuk template)
    try { renderFull(); } catch (e) {}
    var out = [].map.call(doc.querySelectorAll('#full-body .fl-sec > h4'), function (h) { return h.textContent.trim(); });
    return out.length ? out : ['Ringkasan Eksekutif', 'Temuan Kunci', 'Rekomendasi & Target', 'Kesimpulan Analitis'];
  }

  /* ------------------------------------------------------------------ MESIN 3D (guide-model.js) ---------------- */
  /* Model yang dipakai SAMA dengan Guide di Pulau Awan: ../src/guide/guide-model.js (KaihGuideModel.build).
     Satu renderer WebGL offscreen menggambar model ke canvas 2D (bubble dialog & tombol FAB).
     Bila Three.js / model / WebGL tidak bisa dimuat, Guide otomatis memakai gambar SVG lama (tidak error). */
  var THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', MODEL_URL = '../src/guide/guide-model.js';
  var R3 = 50;                                    // 1 unit model = 50 "px dunia" (sama dengan skala di Guide utama)
  var M3 = null, rdy = null, k3Raf = 0, k3Last = 0, k3LastR = 0, clock = 0, lastTgt = null, lastC = null, ctr = { x: 0, y: 0 };
  var gest = { n: 'idle', until: 0, o: {} }, arm = [{ z: -0.96, x: 0, vz: 0, vx: 0 }, { z: 0.96, x: 0, vz: 0, vx: 0 }], leg = [{ x: 0, z: 0, vx: 0, vz: 0 }, { x: 0, z: 0, vx: 0, vz: 0 }];
  var hatS = { a: 0, v: 0 }, tailS = { a: 0, v: 0 }, vel = { x: 0, y: 0 }, look = { x: 0, y: 0 }, ptr = { x: -1, y: -1, t: -99 };
  var blinkT = 3, blink = 0, legPh = 0, idleT = 4, lastSec = -1, talk = 0, talkT = 0, jumpY = 0, spinA = { mode: '', t0: 0, dur: 0 }, ptCache = { t: -9, el: null };

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function loadScript(src) { return new Promise(function (res, rej) { var s = doc.createElement('script'); s.src = src; s.onload = function () { res(); }; s.onerror = function () { rej(new Error('gagal memuat ' + src)); }; doc.head.appendChild(s); }); }
  function loadEngine() {
    return (async function () {
      try {
        if (!window.THREE) { try { await loadScript(THREE_URL); } catch (e) {} }
        if (!window.THREE) { try { if (parent !== window && parent.THREE) window.THREE = parent.THREE; } catch (e) {} }
        if (!window.KaihGuideModel) { try { await loadScript(MODEL_URL); } catch (e) {} }
        if (!window.KaihGuideModel) { try { if (parent !== window && parent.KaihGuideModel) window.KaihGuideModel = parent.KaihGuideModel; } catch (e) {} }
        if (!window.THREE || !window.KaihGuideModel) { console.warn('[Guide peta] THREE/guide-model.js tidak tersedia, memakai gambar 2D cadangan'); return false; }
        return init3D();
      } catch (e) { console.warn('[Guide peta] 3D gagal disiapkan, memakai gambar 2D cadangan', e); return false; }
    })();
  }
  function init3D() {
    var T = window.THREE, rc = doc.createElement('canvas');
    var rr = new T.WebGLRenderer({ canvas: rc, alpha: true, antialias: true, powerPreference: 'low-power' });
    rr.setClearColor(0x000000, 0); rr.setPixelRatio(1);
    var scene = new T.Scene(), model = window.KaihGuideModel.build(T);
    model.root.scale.set(R3, R3, R3); scene.add(model.root); scene.add(model.cape.mesh);
    M3 = { T: T, rr: rr, rc: rc, scene: scene, model: model, parts: model.parts, cape: model.cape, w: 0, h: 0, cvC: null, cvF: null, xC: null, xF: null,
      camC: new T.OrthographicCamera(-1.6 * R3, 1.6 * R3, 2.0 * R3, -1.5 * R3, -1000, 1000),      // dialog: ruang di atas untuk lompat/topi
      camF: new T.OrthographicCamera(-1.4 * R3, 1.4 * R3, 1.55 * R3, -1.25 * R3, -1000, 1000) };  // FAB: lebih rapat
    return true;
  }
  function upgradeDOM() {                          // ganti gambar SVG dengan canvas 3D
    if (!M3 || !built || M3.cvC) return;
    charEl.innerHTML = '<div class="kg-3"><canvas class="kg-svg kg-cv"></canvas></div>';
    fab.innerHTML = '<canvas class="kg-svg kg-cv"></canvas>';
    M3.cvC = charEl.querySelector('canvas'); M3.cvF = fab.querySelector('canvas');
    M3.xC = M3.cvC.getContext('2d'); M3.xF = M3.cvF.getContext('2d');
    html.classList.add('kg-3d'); kick();
  }
  function disable3D(err) {                        // kegagalan saat render -> kembali ke SVG
    console.warn('[Guide peta] render 3D gagal, kembali ke 2D', err);
    M3 = null; cancelAnimationFrame(k3Raf); k3Raf = 0; html.classList.remove('kg-3d');
    if (charEl) charEl.innerHTML = '<div class="kg-f">' + guideSVG() + '</div>';
    if (fab) fab.innerHTML = guideSVG('14 -2 92 112');
  }

  function charVis() { return !!wrap && wrap.classList.contains('on'); }
  function fabVis() { return !!fab && fab.classList.contains('on') && !fab.classList.contains('away'); }
  function kick() { if (!k3Raf && M3 && M3.cvC && !doc.hidden && (charVis() || fabVis())) { k3Last = performance.now(); lastC = null; k3Raf = requestAnimationFrame(tick3); } }
  doc.addEventListener('visibilitychange', kick);

  function setGesture(n, ms) { gest = { n: n || 'idle', until: ms ? clock + ms / 1000 : 1e9, o: {} }; }
  function spin(mode, ms) { spinA = { mode: mode, t0: clock, dur: ms / 1000 }; }          // putaran 3D saat masuk / keluar
  function spinExtra() {
    if (!spinA.dur || reduce) return 0;
    var u = (clock - spinA.t0) / spinA.dur;
    if (u >= 1) { spinA.dur = 0; return 0; }
    return spinA.mode === 'in' ? Math.pow(1 - u, 3) * Math.PI * 2 : -Math.pow(u, 3) * Math.PI * 2;
  }
  function pointTarget() {                          // elemen yang sedang disorot / diberi petunjuk -> sudut lengan
    var now = performance.now();
    if (now - ptCache.t > 250) {
      ptCache.t = now; ptCache.el = null;
      var list = S.spotSel ? doc.querySelectorAll(S.spotSel) : doc.querySelectorAll('.kg-hint');
      for (var i = 0; i < list.length; i++) if (visible(list[i])) { ptCache.el = list[i]; break; }
    }
    if (!ptCache.el) return null;
    var r = ptCache.el.getBoundingClientRect(), tx = r.left + r.width / 2, ty = r.top + r.height / 2, dx = tx - ctr.x, dy = ty - ctr.y;
    return { x: tx, y: ty, ang: Math.atan2(dx, dy), arm: dx >= 0 ? 1 : 0 };
  }
  function armTarget(i) {                           // i: 0 = kiri layar (-X), 1 = kanan layar (+X)   [preset sama dengan Guide utama]
    var sg = i ? 1 : -1, tz = sg * 0.96, tx = 0, n = gest.n;
    if (clock > gest.until) { gest = { n: 'idle', until: 0, o: {} }; n = 'idle'; }
    switch (n) {
      case 'wave':   if (i === 1) { tz = 2.55 + Math.sin(clock * 9.5) * 0.4; tx = 0.1; } else { tz = sg * 0.7; tx = -0.1; } break;
      case 'spread': tz = sg * (1.5 + Math.sin(clock * 3.2) * 0.1); tx = 0.12; break;
      case 'cheer':  tz = sg * (2.65 + Math.sin(clock * 10.5 + i * 1.3) * 0.24); tx = 0.05; break;
      case 'heart':  tz = sg * 0.5; tx = 1.1 + Math.sin(clock * 4.2) * 0.07; break;
      case 'point':  var pt = pointTarget();
                     if (pt) { if (pt.arm === i) { tz = pt.ang; tx = 0.12; } else { tz = sg * 0.55; tx = 0.2; } }
                     else if (i === 1) { tz = 1.15; tx = 0.12; } else { tz = sg * 0.55; tx = 0.2; } break;
      case 'ask':    if (i === 1) { tz = 0.75; tx = 1.25; } else { tz = sg * 0.7; tx = 0.1; } break;
      default:       tz = sg * 0.96 + Math.sin(clock * 1.9 + i * 1.7) * 0.07;
    }
    if (talk > 0.01 && (n === 'idle' || n === 'ask')) { tz += sg * Math.sin(clock * 2.7 + i * 2.1) * 0.17 * talk; tx += Math.sin(clock * 3.3 + i) * 0.3 * talk; }
    if (n === 'idle') tz += sg * clamp(-vel.y * 0.0009, -0.35, 0.35);      // lengan tertinggal saat Guide naik/turun
    return { z: tz, x: tx };
  }
  function spring(o, k, tgt, dt, kk, c) { var v = 'v' + k; o[v] += (tgt - o[k]) * kk * dt; o[v] *= Math.exp(-c * dt); o[k] += o[v] * dt; }

  function poseRoot(dt) {
    var hov = reduce ? 0 : Math.sin(clock * 2.1) * R3 * 0.075, hx = reduce ? 0 : Math.sin(clock * 1.05) * R3 * 0.03;       // melayang (hover)
    jumpY += ((gest.n === 'cheer' && !reduce ? Math.abs(Math.sin(clock * 5)) * R3 * 0.3 : 0) - jumpY) * Math.min(1, dt * 14);
    var r = M3.model.root, bank = clamp(-vel.x * 0.0007, -0.42, 0.42);
    r.position.set(hx, hov + jumpY, 0);
    r.rotation.set(Math.sin(clock * 1.3) * 0.035, look.x * 0.22 + Math.sin(clock * 0.8) * 0.15 + spinExtra(), bank + Math.sin(clock * 1.1) * 0.035);
  }
  function animateBones(dt) {
    var P = M3.parts, sec = Math.floor(clock);
    if (sec !== lastSec) { lastSec = sec; hatS.v += 3.2; }                      // topi memantul ringan tiap detik
    hatS.v += (-hatS.a * 90 - hatS.v * 7 - vel.y * 0.004) * dt; hatS.a += hatS.v * dt;
    P.hat.rotation.x = clamp(hatS.a, -0.7, 0.7) * 0.42; P.hat.rotation.z = P.hat.userData.baseZ + hatS.a * 0.08; P.hat.position.y = 0.92 + Math.max(0, hatS.a) * 0.035;
    tailS.v += (-tailS.a * 70 - tailS.v * 6 + vel.y * 0.0035 - Math.abs(vel.x) * 0.0006) * dt; tailS.a += tailS.v * dt;
    P.tail.rotation.x = 0.03 + clamp(tailS.a, -0.5, 0.5) + Math.sin(clock * 3.1) * 0.05;
    var speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y), run = clamp(speed / 380, 0, 1), kk = 170, cc = 13;
    if (dt > 0.05) { kk = 80; cc = 9; }
    P.arms.forEach(function (a, i) {
      var t = armTarget(i); spring(arm[i], 'z', t.z, dt, kk, cc); spring(arm[i], 'x', t.x, dt, kk, cc);
      a.rotation.z = arm[i].z; a.rotation.x = arm[i].x;
    });
    legPh += dt * (2.2 + run * 9);
    P.legs.forEach(function (l, i) {
      var ph = legPh + i * Math.PI, tx = Math.sin(ph) * (0.09 + 0.75 * run), tz = clamp(-vel.x * 0.0011, -0.6, 0.6) + (i ? 0.07 : -0.07);
      if (gest.n === 'cheer') tx += Math.sin(clock * 11 + i * Math.PI) * 0.5;
      if (gest.n === 'wave' && i === 0) tx += Math.sin(clock * 4) * 0.12;
      spring(leg[i], 'x', tx, dt, kk * 0.8, cc); spring(leg[i], 'z', tz, dt, kk * 0.6, cc);
      l.rotation.x = leg[i].x; l.rotation.z = leg[i].z;
    });
    // mata/wajah mengikuti pointer (atau elemen yang sedang ditunjuk)
    var lt = null, tx2 = 0, ty2 = 0;
    if (gest.n === 'point') lt = pointTarget(); else if (clock - ptr.t < 6 && ptr.x >= 0) lt = ptr;
    if (lt) { tx2 = clamp((lt.x - ctr.x) / (innerWidth * 0.45), -1, 1); ty2 = clamp((lt.y - ctr.y) / (innerHeight * 0.45), -1, 1); }
    else { tx2 = Math.sin(clock * 0.45) * 0.3; ty2 = Math.sin(clock * 0.31) * 0.1; }
    look.x += (tx2 - look.x) * Math.min(1, dt * 6); look.y += (ty2 - look.y) * Math.min(1, dt * 6);
    P.face.rotation.y = look.x * 0.42; P.face.rotation.x = look.y * 0.28;
    // kedip & mulut (terbuka saat Guide "berbicara" / teks sedang diketik)
    blinkT -= dt; if (blinkT < 0) { blinkT = rnd(2.4, 5); blink = 0.13; }
    if (blink > 0) blink -= dt;
    P.eyes.forEach(function (e) { e.scale.y = blink > 0 ? 0.012 : 0.07; });
    talk += (talkT - talk) * Math.min(1, dt * 10);
    var open = talk > 0.01; P.mouth.visible = !open; P.mouthOpen.visible = open;
    if (open) P.mouthOpen.scale.y = 0.012 + (0.5 + 0.5 * Math.sin(clock * 17)) * 0.062 * talk;
    // gestur acak saat diam, supaya terasa hidup (layar sentuh tidak punya hover)
    if (!reduce && gest.n === 'idle' && talk < 0.01) {
      idleT -= dt;
      if (idleT < 0) { idleT = rnd(5, 9); var pk = Math.random(); if (pk < 0.45) setGesture('wave', 1500); else if (pk < 0.75) setGesture('spread', 1400); else setGesture('heart', 1300); }
    }
  }
  function drawTo(cam, cv, cx, pxW, pxH) {
    var m = M3;
    if (m.w !== pxW || m.h !== pxH) { m.rr.setSize(pxW, pxH, false); m.w = pxW; m.h = pxH; }
    if (cv.width !== pxW || cv.height !== pxH) { cv.width = pxW; cv.height = pxH; }
    m.rr.render(m.scene, cam);
    cx.clearRect(0, 0, pxW, pxH); cx.drawImage(m.rc, 0, 0, pxW, pxH);
  }
  function tick3(now) {
    k3Raf = 0;
    if (!M3 || !M3.cvC || doc.hidden) return;
    var cV = charVis(), fV = fabVis();
    if (!cV && !fV) return;
    if (!cV && now - k3LastR < 30) { k3Raf = requestAnimationFrame(tick3); return; }       // FAB cukup ~30 fps
    var dt = Math.min(0.05, Math.max(0.001, (now - k3Last) / 1000)); k3Last = now; k3LastR = now; clock += dt;
    try {
      var tg = cV ? charEl : fab, r = tg.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * (cV ? 0.571 : 0.554);
      if (lastC && lastTgt === tg) {                // kecepatan layar -> cape berkibar, badan miring, lengan tertinggal
        vel.x += clamp((cx - lastC.x) / dt, -900, 900) * Math.min(1, dt * 12) - vel.x * Math.min(1, dt * 12);
        vel.y += clamp((cy - lastC.y) / dt, -900, 900) * Math.min(1, dt * 12) - vel.y * Math.min(1, dt * 12);
      } else { vel.x = vel.y = 0; }
      lastC = { x: cx, y: cy }; lastTgt = tg; ctr.x = cx; ctr.y = cy;
      poseRoot(dt); animateBones(dt);
      M3.model.root.updateMatrixWorld(true);
      M3.cape.update(dt, clock, M3.model.root.matrixWorld, vel.x, -vel.y, (gest.n === 'cheer' ? 0.3 : 0) + talk * 0.1);
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (cV) { var w1 = Math.max(48, Math.round(charEl.offsetWidth * dpr)); drawTo(M3.camC, M3.cvC, M3.xC, w1, Math.round(w1 * 3.5 / 3.2)); }
      if (fV) { var w2 = Math.max(32, Math.round((M3.cvF.offsetWidth || 46) * dpr)); drawTo(M3.camF, M3.cvF, M3.xF, w2, w2); }
    } catch (e) { disable3D(e); return; }
    if (charVis() || fabVis()) k3Raf = requestAnimationFrame(tick3);
  }

  /* ------------------------------------------------------------------ SVG maskot (cadangan 2D) ------------ -------------------------------- */
  var DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
    '<radialGradient id="kgBall" cx="36%" cy="28%" r="78%"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#fbfbfd"/><stop offset="1" stop-color="#b9d3ee"/></radialGradient>' +
    '<linearGradient id="kgJk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34343e"/><stop offset="1" stop-color="#15151b"/></linearGradient>' +
    '<linearGradient id="kgHat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2a33"/><stop offset="1" stop-color="#0d0d12"/></linearGradient></defs></svg>';
  function guideSVG(vb) {
    return '<svg class="kg-svg" viewBox="' + (vb || '0 0 120 150') + '" aria-hidden="true">' +
      '<ellipse class="kg-sh" cx="60" cy="145" rx="26" ry="4.5" fill="rgba(0,0,0,.3)"/>' +
      '<g class="kg-cape"><path d="M38 100 Q60 92 82 100 L96 140 Q60 128 24 140 Z" fill="#15151b"/></g>' +
      '<g class="kg-body"><ellipse cx="49" cy="137" rx="10" ry="5.5" fill="#0f0f14"/><ellipse cx="71" cy="137" rx="10" ry="5.5" fill="#0f0f14"/>' +
      '<path d="M41 98 Q60 92 79 98 L84 132 Q60 140 36 132 Z" fill="url(#kgJk)"/><path d="M52 97 L60 119 L68 97 Z" fill="#fff"/>' +
      '<path d="M52 97 L58 113 L44 101 Z M68 97 L62 113 L76 101 Z" fill="#3a3a45"/>' +
      '<g class="kg-bow"><path d="M60 101 L47 94 L47 108 Z M60 101 L73 94 L73 108 Z" fill="#1b1b22"/><circle cx="60" cy="101" r="3.4" fill="#2d2d38"/></g>' +
      '<g class="kg-arm-l"><path d="M43 104 L30 114" stroke="#26262e" stroke-width="8.5" stroke-linecap="round"/><circle cx="28" cy="116" r="6.8" fill="#fff" stroke="#cde0f4" stroke-width="1"/></g>' +
      '<g class="kg-arm-r"><path d="M77 104 L90 114" stroke="#26262e" stroke-width="8.5" stroke-linecap="round"/><circle cx="92" cy="116" r="6.8" fill="#fff" stroke="#cde0f4" stroke-width="1"/></g></g>' +
      '<g class="kg-head"><circle cx="60" cy="60" r="40" fill="url(#kgBall)"/>' +
      '<circle cx="39" cy="73" r="5.5" fill="rgba(255,150,150,.3)"/><circle cx="81" cy="73" r="5.5" fill="rgba(255,150,150,.3)"/>' +
      '<g class="kg-eyes"><ellipse class="kg-eye" cx="47" cy="63" rx="4.3" ry="6.2" fill="#1b1f2e"/><ellipse class="kg-eye" cx="73" cy="63" rx="4.3" ry="6.2" fill="#1b1f2e"/>' +
      '<circle cx="48.6" cy="60.6" r="1.5" fill="#fff"/><circle cx="74.6" cy="60.6" r="1.5" fill="#fff"/></g>' +
      '<path class="kg-mouth" d="M51 76 Q60 85 69 76" fill="none" stroke="#1b1f2e" stroke-width="3" stroke-linecap="round"/>' +
      '<g class="kg-hat"><ellipse cx="60" cy="26" rx="39" ry="8.5" fill="#0d0d12"/><path d="M40 25 C39 8 48 3 60 3 C72 3 81 8 80 25 Z" fill="url(#kgHat)"/>' +
      '<path d="M40 25 L80 25 L80 19 L40 19 Z" fill="#41414c"/><path d="M52 4 Q60 9 68 4" fill="none" stroke="#08080b" stroke-width="2" stroke-linecap="round"/></g></g></svg>';
  }

  /* ------------------------------------------------------------------ CSS --------------------------------------- */
  var CSS = [
    '#kg-shield{position:fixed;inset:0;z-index:140;display:none;background:rgba(14,18,32,0);transition:background .55s ease;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}',
    '#kg-shield.on{display:block}#kg-shield.dim{background:rgba(14,18,32,.4)}',
    '#kg-spot{position:fixed;z-index:141;pointer-events:none;border:2px solid #f6e6b4;border-radius:10px;opacity:0;box-shadow:0 0 0 100vmax rgba(14,18,32,.62),0 0 24px rgba(246,230,180,.85),inset 0 0 14px rgba(246,230,180,.4);transition:left .7s var(--e-out),top .7s var(--e-out),width .7s var(--e-out),height .7s var(--e-out),opacity .45s ease}',
    '#kg-spot.on{opacity:1}',
    '#kg{position:fixed;left:50%;bottom:max(14px,calc(env(safe-area-inset-bottom) + 8px));z-index:150;width:min(660px,calc(100vw - 20px));transform:translateX(-50%);display:none;align-items:flex-end;gap:2px;pointer-events:none}',
    '#kg.on{display:flex}',
    '#kg-char{flex:none;width:var(--kg-s,128px);pointer-events:none;will-change:transform,opacity;position:relative;z-index:2}',
    '.kg-3{position:relative}.kg-cv{pointer-events:none}',
    '.kg-f{animation:kgFloat 3.2s ease-in-out infinite}.kg-svg{display:block;width:100%;height:auto;overflow:visible;filter:drop-shadow(0 8px 10px rgba(0,0,0,.35))}',
    '@keyframes kgFloat{50%{transform:translateY(-8px)}}',
    '.kg-hat{transform-box:view-box;transform-origin:60px 26px;animation:kgHat 1.15s ease-in-out infinite}@keyframes kgHat{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(-7deg) translateY(-2.5px)}}',
    '.kg-cape{transform-box:view-box;transform-origin:60px 98px;animation:kgCape 2.6s ease-in-out infinite}@keyframes kgCape{0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(3deg) scaleY(1.03)}}',
    '.kg-eye{transform-box:fill-box;transform-origin:center;animation:kgBlink 4.6s infinite}@keyframes kgBlink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}',
    '.kg-eyes{transition:transform .18s ease-out}',
    '.kg-arm-l,.kg-arm-r{transform-box:view-box;transition:transform .55s var(--e-spring)}.kg-arm-l{transform-origin:43px 104px}.kg-arm-r{transform-origin:77px 104px}',
    '.kg-wave .kg-arm-r{animation:kgWave .62s ease-in-out infinite}@keyframes kgWave{0%,100%{transform:rotate(-112deg)}50%{transform:rotate(-152deg)}}',
    '.kg-cheer .kg-arm-r{transform:rotate(-140deg);animation:kgCheerR .5s ease-in-out infinite}.kg-cheer .kg-arm-l{transform:rotate(140deg);animation:kgCheerL .5s ease-in-out infinite}',
    '@keyframes kgCheerR{50%{transform:rotate(-122deg)}}@keyframes kgCheerL{50%{transform:rotate(122deg)}}',
    '.kg-cheer .kg-f{animation:kgJump .62s cubic-bezier(.3,.7,.4,1) infinite}@keyframes kgJump{50%{transform:translateY(-18px) rotate(2deg)}}',
    '.kg-point .kg-arm-r{transform:rotate(-58deg)}.kg-point .kg-mouth{d:path("M51 75 Q60 87 69 75")}',
    '#kg-say{position:relative;pointer-events:auto;flex:1;min-width:0;margin-bottom:18px;padding:12px 16px 10px;color:#ece5d8;cursor:pointer;opacity:0;transform:translateY(12px) scale(.96);transform-origin:0 100%;',
    'transition:opacity .35s ease,transform .55s var(--e-spring);background:linear-gradient(180deg,#4a5368,#3b4255);border:1px solid rgba(236,229,216,.2);border-radius:8px;',
    'box-shadow:inset 0 0 0 2px #3b4255,inset 0 0 0 3px rgba(211,188,142,.55),0 12px 30px rgba(0,0,0,.45)}',
    '#kg-say.show{opacity:1;transform:none}#kg-say::before{content:"";position:absolute;left:-7px;bottom:26px;width:13px;height:13px;background:#434b60;border-left:1px solid rgba(211,188,142,.55);border-bottom:1px solid rgba(211,188,142,.55);transform:rotate(45deg)}',
    '#kg-say .gs-name{font-size:12px;letter-spacing:.24em;color:#d3bc8e;margin-bottom:5px}#kg-say .gs-name::before{content:"";display:inline-block;width:7px;height:7px;background:#d3bc8e;transform:rotate(45deg);margin-right:9px;vertical-align:1px}',
    '#kg-say .gs-text{font-size:15.5px;line-height:1.55;letter-spacing:.015em;min-height:1.55em}#kg-say .gs-ghost{opacity:0}',
    '#kg-say .gs-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}#kg-say .gs-chips span{font-size:12px;padding:4px 10px;border-radius:5px;border:1px solid rgba(211,188,142,.5);background:rgba(236,229,216,.1);color:#f6e6b4;animation:kgChip .55s var(--e-spring) backwards}',
    '@keyframes kgChip{from{opacity:0;transform:translateY(8px) scale(.8)}}',
    '#kg-say .gs-foot{display:flex;align-items:center;justify-content:space-between;margin-top:8px;gap:12px}',
    '#kg-say .gs-next{font-size:11.5px;color:#d3bc8e;letter-spacing:.08em;opacity:0;transition:opacity .2s}#kg-say.done .gs-next{opacity:.9;animation:kgBob 1.1s ease-in-out infinite}@keyframes kgBob{50%{transform:translateY(2px);opacity:.4}}',
    '#kg-say .gs-skip{background:rgba(236,229,216,.1);border:1px solid rgba(211,188,142,.4);color:#ece5d8;border-radius:5px;padding:4px 11px;font:inherit;font-size:12px;cursor:pointer;transition:background .2s}#kg-say .gs-skip:hover{background:rgba(236,229,216,.2)}',
    '#kg-say .gs-acts{display:none;gap:10px;margin-top:12px;flex-wrap:wrap}#kg-say.acts .gs-acts{display:flex}#kg-say.acts .gs-foot{display:none}',
    '#kg-say .gs-acts button{flex:1;min-width:120px;padding:9px 12px;border-radius:5px;border:1px solid rgba(211,188,142,.5);background:rgba(236,229,216,.1);color:#ece5d8;font:inherit;font-size:14px;cursor:pointer;transition:transform .18s var(--e-out),background .2s;animation:kgChip .5s var(--e-spring) backwards}',
    '#kg-say .gs-acts button:nth-child(2){animation-delay:.08s}#kg-say .gs-acts .pri{background:linear-gradient(180deg,#f6f0e4,#e2d8c2);color:#3b4255;border-color:#d3bc8e}#kg-say .gs-acts button:active{transform:scale(.96)}',
    '#kg-say.swap .gs-text{animation:kgSwap .4s ease}@keyframes kgSwap{from{opacity:.2;transform:translateY(5px)}}',
    'html.kg-busy #kg-fab:not(.away){opacity:0;pointer-events:none}#kg-fab{position:fixed;left:14px;top:74px;z-index:93;width:56px;height:56px;border-radius:50%;padding:0;border:2px solid rgba(211,188,142,.85);overflow:visible;display:none;',
    'background:radial-gradient(circle at 50% 30%,#5b6585,#363d54 70%);box-shadow:0 6px 18px rgba(0,0,0,.45),inset 0 0 0 2px rgba(59,66,85,.9),0 0 14px rgba(246,230,180,.25);cursor:pointer;touch-action:manipulation;transition:filter .2s,transform .2s var(--e-out),opacity .3s ease}',
    '#kg-fab.on{display:block;animation:kgPop .6s var(--e-spring) both,kgFab 3.2s ease-in-out .6s infinite}#kg-fab:hover{filter:brightness(1.12)}#kg-fab:active{transform:scale(.94)}#kg-fab.away{visibility:hidden}',
    '#kg-fab .kg-svg{position:absolute;left:3px;top:3px;width:46px;height:auto;filter:none;pointer-events:none}#kg-fab .kg-f,#kg-fab .kg-hat,#kg-fab .kg-eye,#kg-fab .kg-cape{animation:none}',
    '#kg-fab.ping::after{content:"";position:absolute;inset:-7px;border-radius:50%;border:2px solid rgba(246,230,180,.85);animation:kgPing 1.3s ease-out 3}',
    '@keyframes kgPop{from{transform:scale(.2);opacity:0}to{transform:scale(1);opacity:1}}@keyframes kgFab{50%{transform:translateY(-4px)}}@keyframes kgPing{from{transform:scale(.85);opacity:1}to{transform:scale(1.35);opacity:0}}',
    '#kg-menu{position:fixed;left:14px;top:138px;z-index:97;min-width:226px;max-width:calc(100vw - 28px);box-sizing:border-box;display:flex;flex-direction:column;gap:6px;padding:10px;color:#ece5d8;',
    'background:linear-gradient(180deg,#4a5368,#3b4255);border:1px solid rgba(236,229,216,.2);border-radius:8px;box-shadow:inset 0 0 0 2px #3b4255,inset 0 0 0 3px rgba(211,188,142,.55),0 12px 30px rgba(0,0,0,.45);',
    'opacity:0;transform:scale(.9) translateY(-8px);transform-origin:top left;pointer-events:none;visibility:hidden;transition:opacity .22s ease,transform .4s var(--e-spring),visibility 0s .4s}',
    '#kg-menu.on{opacity:1;transform:none;pointer-events:auto;visibility:visible;transition-delay:0s}',
    '#kg-menu .gm-t{font-size:11px;letter-spacing:.24em;color:#d3bc8e;padding:2px 4px 4px}',
    '#kg-menu button{display:flex;align-items:center;gap:10px;text-align:left;padding:11px 14px;border-radius:5px;border:1px solid rgba(211,188,142,.4);background:rgba(236,229,216,.08);color:#ece5d8;font:inherit;font-size:14px;cursor:pointer;opacity:0;transform:translateX(-8px);transition:background .2s,opacity .3s ease,transform .4s var(--e-out)}',
    '#kg-menu.on button{opacity:1;transform:none}#kg-menu.on button:nth-of-type(2){transition-delay:.04s}#kg-menu.on button:nth-of-type(3){transition-delay:.08s}#kg-menu.on button:nth-of-type(4){transition-delay:.12s}',
    '#kg-menu button:hover,#kg-menu button:active{background:rgba(236,229,216,.18)}',
    '.map-marker.kg-hint{box-shadow:none!important;animation:kgHintM 1.15s ease-in-out infinite!important}@keyframes kgHintM{50%{filter:drop-shadow(0 0 9px #f6e6b4) drop-shadow(0 0 20px rgba(246,230,180,.9))}}',
    '.kg-confetti{position:fixed;top:-20px;z-index:145;width:0;height:0;pointer-events:none;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:13px solid var(--c,#ffd54a);animation:confFall var(--t,3.4s) ease-in forwards}',
    '@media(max-width:639px){#kg{--kg-s:92px}#kg-say{padding:10px 13px 8px}#kg-say .gs-text{font-size:14px}#kg-fab{width:52px;height:52px}#kg-fab .kg-svg{width:42px}#kg-menu{top:134px}}',
    '@media(max-height:420px){#kg{--kg-s:78px}#kg-say .gs-text{font-size:13px}}',
    '@media(prefers-reduced-motion:reduce){.kg-f,.kg-hat,.kg-cape,.kg-eye{animation:none!important}}'
  ].join('');

  /* ------------------------------------------------------------------ DOM --------------------------------------- */
  var built = false, shield, spot, wrap, charEl, charIn, say, textEl, chipsEl, actsEl, nextEl, skipEl, fab, menu;
  function build() {
    if (built) return; built = true;
    var st = doc.createElement('style'); st.id = 'kg-css'; st.textContent = CSS; doc.head.appendChild(st);
    var holder = doc.createElement('div'); holder.innerHTML = DEFS; doc.body.appendChild(holder.firstChild);
    shield = el('div', 'kg-shield'); spot = el('div', 'kg-spot'); wrap = el('div', 'kg');
    charEl = el('div', 'kg-char'); charEl.innerHTML = '<div class="kg-f">' + guideSVG() + '</div>'; charIn = charEl.firstChild;
    say = el('div', 'kg-say'); say.setAttribute('role', 'dialog');
    say.innerHTML = '<div class="gs-name">' + CFG.name + '</div><div class="gs-text"><span class="gs-vis"></span><span class="gs-ghost"></span></div><div class="gs-chips"></div>' +
      '<div class="gs-foot"><span class="gs-next">Ketuk untuk lanjut ▾</span><button type="button" class="gs-skip">Lewati</button></div><div class="gs-acts"></div>';
    textEl = say.querySelector('.gs-text'); chipsEl = say.querySelector('.gs-chips'); actsEl = say.querySelector('.gs-acts'); nextEl = say.querySelector('.gs-next'); skipEl = say.querySelector('.gs-skip');
    wrap.appendChild(charEl); wrap.appendChild(say);
    fab = el('button', 'kg-fab'); fab.type = 'button'; fab.setAttribute('aria-label', 'Guide: bantuan'); fab.innerHTML = guideSVG('14 -2 92 112');
    menu = el('div', 'kg-menu'); menu.setAttribute('role', 'menu');
    [shield, spot, wrap, fab, menu].forEach(function (n) { doc.body.appendChild(n); });
    shield.addEventListener('click', tap);
    say.addEventListener('click', function (e) { if (!e.target.closest('button')) tap(); });
    skipEl.addEventListener('click', function (e) { e.stopPropagation(); S.skip = true; if (S.typing) S.typing.finish(); tap(); });
    fab.addEventListener('click', function (e) { e.stopPropagation(); toggleMenu(); });
    fab.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    menu.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    doc.addEventListener('pointerdown', function (e) { if (menu.classList.contains('on') && !menu.contains(e.target) && !fab.contains(e.target)) closeMenu(); }, true);
    addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { if (S.busy) { S.skip = true; if (S.typing) S.typing.finish(); if (S.actsAbort) { var ab = S.actsAbort; S.actsAbort = null; ab(); } tap(); } else closeMenu(); }
      else if (S.busy && (e.key === 'Enter' || e.key === ' ') && !actsEl.contains(doc.activeElement)) { e.preventDefault(); tap(); }
    });
    addEventListener('resize', function () { if (S.busy && S.spotSel) moveSpot(S.spotSel); });
    addEventListener('pointermove', function (e) {          // mata mengikuti pointer
      if (M3) { ptr.x = e.clientX; ptr.y = e.clientY; ptr.t = clock; return; }
      if (!charEl || !wrap.classList.contains('on') && !fab.classList.contains('on')) return;
      var tgt = wrap.classList.contains('on') ? charEl : fab, r = tgt.getBoundingClientRect(), eyes = tgt.querySelector('.kg-eyes');
      if (!eyes) return;
      var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height * .45), d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 220);
      eyes.style.transform = 'translate(' + (dx / d * 3.4 * k).toFixed(2) + 'px,' + (dy / d * 2.6 * k).toFixed(2) + 'px)';
    }, { passive: true });
    fab.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && !S.busy && !menu.classList.contains('on')) gesture('wave', 1400, fab); });
    buildMenu();
    rdy = loadEngine().then(function (ok) { if (ok) upgradeDOM(); return ok; });
  }
  function el(tag, id) { var n = doc.createElement(tag); n.id = id; return n; }

  function buildMenu() {
    var items = [['tour', '✦', 'Cara memakai peta'], ['intro', '↺', 'Ulangi sapaan awal'], ['about', '🗝', 'Tentang Mode Lengkap']];
    if (embed) items.push(['home', '←', 'Kembali ke Pulau Awan']);
    menu.innerHTML = '<div class="gm-t">' + CFG.name + '</div>' + items.map(function (i) { return '<button type="button" data-k="' + i[0] + '"><span aria-hidden="true">' + i[1] + '</span>' + i[2] + '</button>'; }).join('');
    menu.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; closeMenu();
      var k = b.dataset.k;
      setTimeout(function () { if (k === 'tour') G.tour(); else if (k === 'intro') G.intro(true); else if (k === 'about') G.about(); else if (k === 'home') G.askHome(); }, 180);
    });
  }
  function toggleMenu() { if (S.busy) return; menu.classList.toggle('on'); gesture(menu.classList.contains('on') ? 'wave' : 'idle', 1200, fab); }
  function closeMenu() { if (menu) menu.classList.remove('on'); }

  /* ------------------------------------------------------------------ mesin dialog ------------------------------ */
  var S = { busy: false, skip: false, tapR: null, typing: null, spotSel: null };
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function waitTap() { return new Promise(function (r) { S.tapR = r; }); }
  function tap() { if (S.typing) { S.typing.finish(); return; } if (S.tapR) { var r = S.tapR; S.tapR = null; r(); } }
  var gestTimer = 0;
  function gesture(g, ms, root) {
    if (M3) { setGesture(g, ms); kick(); return; }
    var t = root || charEl; ['kg-wave', 'kg-cheer', 'kg-point'].forEach(function (c) { t.classList.remove(c); });
    if (g && g !== 'idle') t.classList.add('kg-' + g);
    if (ms) { clearTimeout(gestTimer); gestTimer = setTimeout(function () { ['kg-wave', 'kg-cheer', 'kg-point'].forEach(function (c) { t.classList.remove(c); }); }, ms); }
  }
  function typeText(text) {
    return new Promise(function (res) {
      var chars = Array.from(text), vis = textEl.querySelector('.gs-vis'), gh = textEl.querySelector('.gs-ghost'), t0 = performance.now(), done = false, iv, last = -1;
      vis.textContent = ''; gh.textContent = text; say.classList.remove('done'); talkT = 1;
      function fin() { if (done) return; done = true; clearInterval(iv); vis.textContent = text; gh.textContent = ''; S.typing = null; say.classList.add('done'); talkT = 0; res(); }
      if (reduce) { fin(); return; }
      iv = setInterval(function () {
        var n = Math.min(chars.length, Math.floor((performance.now() - t0) / CFG.typeMs));
        if (n !== last) { last = n; vis.textContent = chars.slice(0, n).join(''); gh.textContent = chars.slice(n).join(''); }
        if (n >= chars.length) fin();
      }, 16);
      S.typing = { finish: fin };
    });
  }
  function visible(n) { var r = n.getBoundingClientRect(); return r.width > 2 && r.height > 2 && getComputedStyle(n).visibility !== 'hidden'; }
  function moveSpot(sel) {
    S.spotSel = sel || null;
    var n = sel ? [].filter.call(doc.querySelectorAll(sel), visible)[0] : null;
    if (!n) { spot.classList.remove('on'); shield.classList.add('dim'); return; }
    var r = n.getBoundingClientRect(), p = 8, fresh = !spot.classList.contains('on');
    if (fresh) { spot.style.transition = 'opacity .45s ease'; }          // muncul di tempat, tanpa meluncur dari posisi lama
    spot.style.left = (r.left - p) + 'px'; spot.style.top = (r.top - p) + 'px'; spot.style.width = (r.width + p * 2) + 'px'; spot.style.height = (r.height + p * 2) + 'px';
    if (fresh) { void spot.offsetWidth; spot.style.transition = ''; }
    spot.classList.add('on'); shield.classList.remove('dim');
  }
  function setHint(sel) { clearHint(); if (sel) [].forEach.call(doc.querySelectorAll(sel), function (n) { if (visible(n)) n.classList.add('kg-hint'); }); }
  function clearHint() { [].forEach.call(doc.querySelectorAll('.kg-hint'), function (n) { n.classList.remove('kg-hint'); }); }

  async function runSteps(steps) {
    var result = null;
    for (var i = 0; i < steps.length && !S.skip; i++) {
      var st = steps[i];
      gesture(st.g || 'idle'); moveSpot(st.spot); setHint(st.hint);
      chipsEl.innerHTML = ''; actsEl.innerHTML = ''; say.classList.remove('acts'); say.classList.remove('swap'); void say.offsetWidth; if (i) say.classList.add('swap');
      if (st.on) { try { st.on(); } catch (e) {} }
      await typeText(st.t);
      if (S.skip) break;
      if (st.chips) {
        chipsEl.innerHTML = st.chips.map(function (c, k) { return '<span style="animation-delay:' + (k * 0.09) + 's">' + c + '</span>'; }).join('');
        await sleep(reduce ? 0 : 260 + st.chips.length * 90);
      }
      if (st.acts) {
        actsEl.innerHTML = st.acts.map(function (a) { return '<button type="button" data-v="' + a.val + '"' + (a.primary ? ' class="pri"' : '') + '>' + a.label + '</button>'; }).join('');
        say.classList.add('acts');
        result = await new Promise(function (res) {
          S.tapR = null;
          actsEl.onclick = function (e) { var b = e.target.closest('button'); if (b) { actsEl.onclick = null; S.actsAbort = null; res(b.dataset.v); } };
          S.actsAbort = function () { actsEl.onclick = null; res(null); };
        });
        break;
      }
      await waitTap();
    }
    return result;
  }

  /* masuk & keluar maskot */
  function rect(n) { return n.getBoundingClientRect(); }
  async function enterChar(fromFab) {
    wrap.classList.add('on'); shield.classList.add('on'); shield.classList.add('dim'); spin('in', 1150); kick();
    say.classList.remove('show'); textEl.querySelector('.gs-vis').textContent = ''; textEl.querySelector('.gs-ghost').textContent = '';
    var r = rect(charEl), vw = innerWidth, vh = innerHeight, kf;
    if (fromFab && fab.classList.contains('on')) {
      var f = rect(fab), dx = f.left + f.width / 2 - (r.left + r.width / 2), dy = f.top + f.height / 2 - (r.top + r.height / 2);
      kf = [{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.38) rotate(-18deg)', opacity: 0 }, { transform: 'translate(' + dx * .45 + 'px,' + (dy * .45 - 50) + 'px) scale(.8) rotate(10deg)', opacity: 1, offset: .5 }, { transform: 'none', opacity: 1 }];
      fab.classList.add('away');
    } else {
      kf = [{ transform: 'translate(' + (-vw * .55) + 'px,' + (vh * .22) + 'px) scale(.3) rotate(-30deg)', opacity: 0 }, { transform: 'translate(' + (-vw * .2) + 'px,' + (-vh * .14) + 'px) scale(.75) rotate(14deg)', opacity: 1, offset: .55 },
        { transform: 'translate(' + (vw * .02) + 'px,' + (vh * .02) + 'px) scale(1.08) rotate(-4deg)', opacity: 1, offset: .82 }, { transform: 'none', opacity: 1 }];
    }
    if (!reduce) await charEl.animate(kf, { duration: 1150, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'backwards' }).finished.catch(function () {});
    say.classList.add('show');
    await sleep(reduce ? 0 : 120);
  }
  async function leaveChar() {
    say.classList.remove('show'); spot.classList.remove('on'); clearHint(); S.spotSel = null; gesture('idle');
    var firstFab = !fab.classList.contains('on');
    fab.classList.add('on'); fab.classList.add('away'); talkT = 0;
    if (firstFab) { fab.style.animation = 'none'; }
    await sleep(reduce ? 0 : 240);
    var r = rect(charEl), f = rect(fab), dx = f.left + f.width / 2 - (r.left + r.width / 2), dy = f.top + f.height / 2 - (r.top + r.height / 2);
    shield.classList.remove('dim'); spin('out', 800);
    if (!reduce) await charEl.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(' + dx * .4 + 'px,' + (dy * .4 - 40) + 'px) scale(.8) rotate(-12deg)', opacity: 1, offset: .45 }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.36) rotate(-22deg)', opacity: .15 }],
      { duration: 800, easing: 'cubic-bezier(.5,0,.75,.4)', fill: 'forwards' }).finished.catch(function () {});
    wrap.classList.remove('on'); shield.classList.remove('on');
    charEl.getAnimations().forEach(function (a) { a.cancel(); });
    fab.style.animation = ''; fab.classList.remove('away');
    fab.classList.remove('on'); void fab.offsetWidth; fab.classList.add('on'); lastC = null; kick();
    if (firstFab) { fab.classList.add('ping'); setTimeout(function () { fab.classList.remove('ping'); }, 4200); }
  }
  async function session(steps, opt) {
    opt = opt || {}; build();
    if (S.busy) return null;
    S.busy = true; S.skip = false; closeMenu(); html.classList.add('kg-busy');
    var res = null;
    try { try { await Promise.race([rdy || Promise.resolve(), sleep(3500)]); } catch (e) {} await enterChar(opt.fromFab !== false); res = await runSteps(steps); }
    finally { try { await leaveChar(); } catch (e) {} S.busy = false; html.classList.remove('kg-busy'); S.skip = false; if (opt.onEnd) { try { opt.onEnd(res); } catch (e) {} } }
    return res;
  }

  function confetti() {
    var cols = ['#ffd54a', '#8be061', '#7ec8ff', '#ff9ec7', '#c8a6ff', '#ffb066'];
    for (var i = 0; i < 54; i++) {
      var c = doc.createElement('i'); c.className = 'kg-confetti';
      c.style.left = (Math.random() * 100) + 'vw'; c.style.setProperty('--c', cols[i % cols.length]);
      c.style.setProperty('--x', ((Math.random() - 0.5) * 180) + 'px'); c.style.setProperty('--r', ((Math.random() - 0.5) * 1080) + 'deg');
      c.style.setProperty('--t', (2.6 + Math.random() * 2) + 's'); c.style.animationDelay = (Math.random() * 0.9) + 's';
      doc.body.appendChild(c); (function (n) { setTimeout(function () { n.remove(); }, 6000); })(c);
    }
  }

  /* ------------------------------------------------------------------ API publik -------------------------------- */
  var G = window.KaihMapGuide = {
    busy: function () { return S.busy; },
    say: function (steps, opt) { return session(steps, opt); },
    intro: function (force) {
      try { sessionStorage.setItem(CFG.seenKey, '1'); } catch (e) {}
      return session(CFG.intro, { fromFab: !!force });
    },
    tour: function () { return session(CFG.tour(), { fromFab: true }); },
    about: function () { return session(CFG.about(), { fromFab: true, onEnd: function (v) { if (v === 'open') openFull(); } }); },
    askHome: function () { return session(CFG.home, { fromFab: true, onEnd: function (v) { if (v === 'go') try { parent.postMessage({ kaih: 'map-exit' }, '*'); } catch (e) {} } }); },
    celebrate: function (info) {
      var unlocked = false;
      var hooks = { confetti: confetti, unlock: function () { unlocked = true; playUnlock(true); } };
      return session(CFG.celebrate(info, hooks), {
        fromFab: false,
        onEnd: function (v) {
          if (!unlocked) playUnlock(false);                      // dilewati sebelum langkah gembok: tetap buka gemboknya
          if (v === 'open') setTimeout(openFull, 450);
        }
      });
    }
  };

  /* ------------------------------------------------------------------ mulai ------------------------------------- */
  function start() {
    build();
    var seen = false; try { seen = !!sessionStorage.getItem(CFG.seenKey); } catch (e) {}
    var force = qs.get('guide') === '1';
    var done = visited.size === TOTAL;
    if (done || (seen && !force)) { setTimeout(function () { fab.classList.add('on'); fab.classList.add('ping'); kick(); setTimeout(function () { fab.classList.remove('ping'); }, 4200); }, 1500); return; }
    setTimeout(function () { G.intro(false); }, 2100);          // setelah peta & indikator selesai masuk
  }
  if (html.classList.contains('kx-run') || !html.classList.contains('kx-pre')) {
    if (html.classList.contains('kx-run')) start(); else addEventListener('kaih-map-run', start, { once: true });
  } else addEventListener('kaih-map-run', start, { once: true });
  window.addEventListener('kaih-map-run', function () { build(); });
})();
