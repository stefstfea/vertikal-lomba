/* ============================================================================
   PETA = DOORWAY MENUJU DASHBOARD                                         [Fase 4.0]
   Pulau Awan: tombol peta (Guide) ditekan ->
     1) kamera "zoom" ke arah peta, gulungan peta terbang ke tengah layar
     2) kilau cahaya, gulungan berubah menjadi perkamen yang tergulung
     3) gulungan membuka (dua tongkat menjauh, kertas terungkap) -> menampilkan peta dashboard
     4) dashboard (peta/index.html?embed=1, di iframe) memudar masuk, animasi masuk komponen dijalankan
   Kembali: menu Guide di dashboard -> "Kembali ke Pulau Awan" -> urutan yang sama dimainkan MUNDUR.
   Dipicu oleh event 'kaih-map-click' (dikirim guide-map.js). API: KaihMapDoorway.open() / .close().
   ========================================================================== */
(function () {
  'use strict';
  var html = document.documentElement, doc = document;
  var MAP_URL = 'peta/index.html?embed=1';
  var MAP_W = 1376, MAP_H = 768, ICON_AR = 1536 / 1225;
  var T_ZOOM = 1100, T_MORPH_A = 950, T_MORPH = 420, T_OPEN_A = 1380, T_OPEN = 1700, T_SHOW_A = 2900, T_SHOW = 700, T_END = T_SHOW_A + T_SHOW;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var busy = false, isOpen = false, ready = false, built = false;
  var scrim, icon, rig, sheet, eT, eB, shine, shadow, rodT, rodB, flash, frame, load, restBtn;
  var restCx = 0, restCy = 0, restW = 120, snap = {};

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease3(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut4(t) { return 1 - Math.pow(1 - t, 4); }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ------------------------------------------------------------------ suara (ikut pengaturan SFX) --------------- */
  var ac;
  function C() { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.resume) ac.resume(); return ac; }
  function paper(dur, dl) {                                  // desis kertas membuka: derau tersaring
    try {
      var c = C(), n = (c.sampleRate * dur) | 0, bf = c.createBuffer(1, n, c.sampleRate), a = bf.getChannelData(0), i, t = c.currentTime + (dl || 0);
      for (i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * (0.55 + 0.45 * Math.sin(i / 380));
      var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = bf; f.type = 'bandpass'; f.Q.value = 0.9;
      f.frequency.setValueAtTime(700, t); f.frequency.exponentialRampToValueAtTime(2600, t + dur);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.2, t + dur * .3); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(c.destination); s.start(t);
    } catch (e) {}
  }
  function sfx(k) { try { if (window.kxSfx) window.kxSfx(k); } catch (e) {} }

  /* ------------------------------------------------------------------ DOM --------------------------------------- */
  function mk(tag, id, cls) { var n = doc.createElement(tag); if (id) n.id = id; if (cls) n.className = cls; return n; }
  function build() {
    if (built) return; built = true;
    scrim = mk('div', 'kx-dm-scrim');
    icon = mk('img', 'kx-dm-icon'); icon.alt = ''; icon.draggable = false; icon.src = 'assets/img/peta.png';
    rig = mk('div', 'kx-dm-rig');
    shadow = mk('div', null, 'shadow'); sheet = mk('div', null, 'sheet'); eT = mk('div', null, 'eT'); eB = mk('div', null, 'eB'); shine = mk('div', null, 'shine');
    sheet.appendChild(eT); sheet.appendChild(eB); sheet.appendChild(shine);
    rodT = mk('div', null, 'rod'); rodB = mk('div', null, 'rod');
    [rodT, rodB].forEach(function (r) { r.appendChild(mk('i', null, 'cap')); r.appendChild(mk('i', null, 'cap')); });
    [shadow, sheet, rodT, rodB].forEach(function (n) { rig.appendChild(n); });
    flash = mk('div', 'kx-dm-flash'); load = mk('div', 'kx-dm-load'); load.textContent = 'Membuka peta…';
    [scrim, icon, rig, flash, load].forEach(function (n) { html.appendChild(n); });
    scrim.addEventListener('pointerdown', function (e) { e.stopPropagation(); e.preventDefault(); });
  }

  function targetRect() {                                    // sama persis dengan penempatan peta di dashboard
    var vw = innerWidth, vh = innerHeight, small = vw < 640, sideM = small ? 10 : 28, botM = small ? 20 : 26, TOP = 70;
    var u = Math.min((vw - sideM * 2) / MAP_W, (vh - TOP - botM) / MAP_H), w = Math.round(MAP_W * u), h = Math.round(MAP_H * u);
    return { x: (vw - w) / 2, y: TOP + (vh - TOP - 20 - h) / 2, w: w, h: h };
  }

  /* ------------------------------------------------------------------ satu fungsi menggambar semua fase --------- */
  // t = waktu virtual (ms). Membuka: 0 -> T_END. Menutup: T_END -> 0 (fungsi yang sama, jadi otomatis kebalikannya).
  function draw(t) {
    var vw = innerWidth, vh = innerHeight, T = targetRect();
    var Z = ease3(clamp(t / T_ZOOM, 0, 1));
    var M = smooth(clamp((t - T_MORPH_A) / T_MORPH, 0, 1));
    var O = clamp((t - T_OPEN_A) / T_OPEN, 0, 1); O = O < .5 ? 2 * O * O : 1 - Math.pow(-2 * O + 2, 2) / 2; O = lerp(O, easeOut4(clamp((t - T_OPEN_A) / T_OPEN, 0, 1)), .35);
    var R = smooth(clamp((t - T_SHOW_A) / T_SHOW, 0, 1));

    scrim.style.opacity = String(Math.min(1, Z * 1.15) * (1 - R * 0.0));
    // kamera zoom ke arah peta (halaman di belakang membesar dari titik peta)
    var bz = 1 + 0.14 * Z;
    doc.body.style.transformOrigin = snap.cx + 'px ' + snap.cy + 'px';
    doc.body.style.transform = Z > 0.001 ? 'scale(' + bz.toFixed(4) + ')' : '';

    // ikon gulungan: terbang ke tengah, membesar, lalu melebur ke gulungan datar
    var iw1 = clamp(Math.min(vw * .6, vh * .6 * ICON_AR), 200, 720), s = lerp(1, iw1 / snap.w, Z);
    var x = lerp(snap.cx, vw / 2, Z), y = lerp(snap.cy, vh / 2, Z) - Math.sin(Math.PI * Z) * vh * .07, rot = lerp(-2.9, 0, Z) + Math.sin(Math.PI * Z) * 3;
    icon.style.width = snap.w + 'px';
    icon.style.transform = 'translate(' + (x - snap.w / 2) + 'px,' + (y - snap.w / ICON_AR / 2) + 'px) rotate(' + rot.toFixed(2) + 'deg) scale(' + s.toFixed(4) + ')';
    icon.style.opacity = String((1 - M) * (t > 0 ? 1 : 1));
    icon.style.display = (M < 1 && t > 0) ? 'block' : 'none';

    // gulungan datar (dua tongkat + kertas peta)
    var rh = clamp(T.h * .095, 30, 58), ov = rh * .9;
    rig.style.display = M > 0 && R < 1 ? 'block' : 'none';
    rig.style.opacity = String(M * (1 - R));
    rig.style.width = T.w + 'px'; rig.style.height = T.h + 'px';
    rig.style.transform = 'translate(' + T.x + 'px,' + T.y + 'px) scaleX(' + lerp(.5, 1, M).toFixed(4) + ')';
    var c = (T.h * (1 - O)) / 2;                                // tepi atas/bawah kertas yang terungkap
    sheet.style.clipPath = 'inset(' + c.toFixed(2) + 'px 0 ' + c.toFixed(2) + 'px 0)';
    shadow.style.transform = 'scaleY(' + Math.max(O, .001).toFixed(4) + ')';
    eT.style.transform = 'translateY(' + c.toFixed(2) + 'px)'; eB.style.transform = 'translateY(' + (T.h - c - 34).toFixed(2) + 'px)';
    shine.style.transform = 'translateX(' + lerp(-60, 230, clamp(O * 1.05, 0, 1)).toFixed(1) + '%)';
    shine.style.opacity = String(Math.sin(Math.PI * clamp(O, 0, 1)));
    var thick = lerp(1.45, 1, O);
    [[rodT, c], [rodB, T.h - c]].forEach(function (p) {
      var r = p[0], cy = p[1];
      r.style.width = (T.w + ov * 2) + 'px'; r.style.height = rh + 'px'; r.style.setProperty('--rh', rh + 'px');
      r.style.transform = 'translate(' + (-ov) + 'px,' + (cy - rh / 2) + 'px) scaleY(' + thick.toFixed(3) + ')';
      [].forEach.call(r.querySelectorAll('.cap'), function (cp, i) { cp.style.width = cp.style.height = (rh * 1.22) + 'px'; cp.style[i ? 'right' : 'left'] = (-rh * .3) + 'px'; });
    });
    // kilau saat peleburan
    var fl = Math.sin(Math.PI * clamp((t - T_MORPH_A + 120) / (T_MORPH + 240), 0, 1));
    flash.style.display = fl > 0.01 ? 'block' : 'none'; flash.style.opacity = String(fl * .85);

    // dashboard
    frame.style.opacity = String(R);
  }

  /* ------------------------------------------------------------------ pemutar ----------------------------------- */
  function play(dir) {                                        // dir=+1 membuka, -1 menutup
    return new Promise(function (resolve) {
      var vt = dir > 0 ? 0 : T_END, last = performance.now(), shown = false, sfxDone = {};
      function step(now) {
        var dt = Math.min(48, now - last); last = now;
        var next = vt + dir * dt * (reduce ? 6 : 1);
        if (dir > 0 && next >= T_SHOW_A && !ready) { next = T_SHOW_A; load.style.display = 'block'; }   // tunggu dashboard siap
        else load.style.display = 'none';
        vt = clamp(next, 0, T_END);
        if (dir > 0) {
          if (!sfxDone.a) { sfxDone.a = 1; sfx('gust'); }
          if (!sfxDone.b && vt >= T_MORPH_A) { sfxDone.b = 1; sfx('swell'); }
          if (!sfxDone.c && vt >= T_OPEN_A) { sfxDone.c = 1; paper(1.5); }
          if (!shown && vt >= T_SHOW_A && ready) { shown = true; try { frame.contentWindow.postMessage({ kaih: 'map-show' }, '*'); } catch (e) {} }
        } else {
          if (!sfxDone.a) { sfxDone.a = 1; paper(1.3); }
          if (!sfxDone.b && vt <= T_MORPH_A + T_MORPH) { sfxDone.b = 1; sfx('swell'); }
          if (!sfxDone.c && vt <= T_ZOOM * .6) { sfxDone.c = 1; sfx('gust'); }
        }
        draw(vt);
        if ((dir > 0 && vt >= T_END) || (dir < 0 && vt <= 0)) { resolve(); return; }
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  function measureRest() {
    var b = doc.getElementById('kx-map'), r = b ? b.getBoundingClientRect() : { left: 14, top: innerHeight - 160, width: 150, height: 120 };
    snap.cx = r.left + r.width / 2; snap.cy = r.top + r.height / 2; snap.w = Math.max(60, r.width);
  }

  async function open() {
    if (busy || isOpen) return;
    busy = true; build(); ready = false; measureRest();
    window.dispatchEvent(new CustomEvent('kaih-map-opening'));     // musik dashboard peta mulai di sini
    html.classList.add('kx-dash-open');
    scrim.style.display = 'block'; icon.style.display = 'block';
    frame = mk('iframe', 'kx-dm-frame'); frame.title = 'Peta Kebiasaan 7 KAIH'; frame.setAttribute('allow', 'autoplay'); frame.style.display = 'block';
    html.appendChild(frame); frame.src = MAP_URL;
    draw(0);
    await play(1);
    frame.style.pointerEvents = 'auto'; scrim.style.display = 'none'; rig.style.display = 'none'; flash.style.display = 'none'; load.style.display = 'none';
    try { frame.contentWindow.focus(); } catch (e) {}
    isOpen = true; busy = false;
    window.dispatchEvent(new CustomEvent('kaih-map-opened'));
  }

  async function close() {
    if (busy || !isOpen) return;
    busy = true; isOpen = false; build(); measureRest();
    window.dispatchEvent(new CustomEvent('kaih-map-closing'));     // musik dashboard peta berhenti (fade-out)
    frame.style.pointerEvents = 'none'; scrim.style.display = 'block'; scrim.style.opacity = '1'; icon.style.display = 'none'; rig.style.display = 'block';
    draw(T_END);
    await play(-1);
    doc.body.style.transform = ''; doc.body.style.transformOrigin = '';
    [scrim, icon, rig, flash, load].forEach(function (n) { n.style.display = 'none'; });
    try { frame.src = 'about:blank'; } catch (e) {} frame.remove(); frame = null;
    html.classList.remove('kx-dash-open');
    try { if (window.KaihGuideMap && KaihGuideMap.pulse) KaihGuideMap.pulse(); } catch (e) {}
    busy = false;
    window.dispatchEvent(new CustomEvent('kaih-map-closed'));
  }

  // Buka dashboard langsung (tanpa animasi gulungan): dipakai "Skip ke dashboard". gate = Promise yang menentukan kapan dashboard ditampilkan.
  async function openDirect(gate) {
    if (busy || isOpen) return false;
    busy = true; build(); ready = false;
    window.dispatchEvent(new CustomEvent('kaih-map-opening'));
    frame = mk('iframe', 'kx-dm-frame'); frame.title = 'Peta Kebiasaan 7 KAIH'; frame.setAttribute('allow', 'autoplay'); frame.style.display = 'block';
    html.appendChild(frame); frame.src = MAP_URL;
    await new Promise(function (r) { var n = 0, iv = setInterval(function () { if (ready || ++n > 200) { clearInterval(iv); r(); } }, 100); });
    if (gate) await gate;
    html.classList.add('kx-dash-open');
    frame.style.transition = 'none'; frame.style.opacity = '1'; frame.style.pointerEvents = 'auto';
    try { frame.contentWindow.postMessage({ kaih: 'map-show' }, '*'); frame.contentWindow.focus(); } catch (e) {}
    isOpen = true; busy = false;
    window.dispatchEvent(new CustomEvent('kaih-map-opened'));
    return true;
  }

  addEventListener('message', function (e) {
    var d = e.data || {}; if (!frame || e.source !== frame.contentWindow) return;
    if (d.kaih === 'map-ready') ready = true;
    else if (d.kaih === 'map-exit') close();
  });
  addEventListener('kaih-map-click', function () { open(); });
  window.KaihMapDoorway = { open: open, openDirect: openDirect, close: close, isOpen: function () { return isOpen; } };
})();
