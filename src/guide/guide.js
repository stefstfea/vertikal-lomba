/* ============================================================================
 * THE GUIDE — engine, animasi, dialog, tombol FAB                 [Fase 3.1]
 * Mengikuti "3D Production Turnaround Blueprint":
 *   - Idle: hover sine (ala Paimon), topi memantul tiap detik (Bone_Hat), ekor jas bergoyang (Bone_SuitTail)
 *   - Klik: twirl + confetti putih/abu-abu
 *   - Dialog Pulau Awan (7 kalimat) & Ladang Langit; setelah tutorial terbang ke pojok di bawah Settings,
 *     mesh 3D diganti Render Texture 2D = tombol FAB; klik FAB -> dropdown (Ulangi Tutorial, Kembali ke Pulau Awan)
 * Fase 3.1:
 *   - Masuk dari kejauhan: terbang melengkung, makin dekat, lalu berputar menghadap POV user
 *   - Trail dihapus -> CAPE hitam (simulasi kain) yang mengibar sesuai arah gerak Guide
 *   - Konfirmasi "Apakah kamu yakin ingin melewati tutorial?" saat user menekan Lewati / Lanjutkan ke dashboard di tengah tutorial
 *   - Tangan & kaki reaktif: lambaian, merentang, bersorak, menunjuk, terbang, mengayuh; tertinggal saat bergerak;
 *     mata/wajah mengikuti pointer; melambai saat di-hover; gestur acak saat diam
 *   - Kamera Pulau Awan ikut bercerita: menyapu pulau, lalu berpindah dari satu teman ke teman lain
 *     (memakai pemilihan bawaan Pulau Awan: daftar tombol di bawah -> OrbitControls pindah fokus)
 * Fase 3.2:
 *   - Dialog "kamu bisa menekan tombol ini" dihapus; diganti cutscene peta: Guide mendekat ke POV, merogoh ke belakang, mengeluarkan peta
 *     (stretch ease in/out + ledakan cahaya prismatik), mengangkat & membawa peta, lalu meletakkannya di pojok kiri bawah (src/guide/guide-map.js)
 * Dirender oleh renderer WebGL sendiri (canvas transparan) yang menempel di <html>, sehingga tetap hidup
 * ketika <body> diganti dari Pulau Awan ke Ladang Langit. Memakai window.THREE (r128 CDN) saat dijalankan.
 * Matikan sepenuhnya dengan menambah ?noguide pada URL.
 * ========================================================================== */
(function () {
  'use strict';
  if (/[?&]noguide\b/.test(location.search)) return;

  var HTML = document.documentElement;
  var G = window.KaihGuide = { version: '3.2' };
  var CANCEL = { cancelled: true };
  var FONT = '"Genshin","Plus Jakarta Sans",system-ui,sans-serif';

  // ------------------------------------------------------------------ teks dialog (dari blueprint) --------------
  var LINES = {
    awan: [
      'Halo semua! Aku adalah Guide! Aku akan membantumu selama perjalanan di website ini!',
      'Ini adalah pulau awan! Tempat di dalam pikiran terdalam manusia!',
      'Di tempat ini, tercipta berbagai pikiran kebaikan!',
      'Kamu bisa lihat-lihat sekitar!',
      'Kamu bisa berinteraksi dengan setiap teman-temanku disini!',
      'Setiap bola merepresentasikan kebiasaan baik manusia!',
      'Setelah semuanya selesai, kamu bisa langsung pergi ke dashboard untuk melihat rinciannya!'
    ],
    ladang: [
      'Halo! kita bertemu lagi!',
      'Lihat! Teman-temanku berjatuhan dari langit!',
      'Ini adalah dunia ketenangan dimana teman-temanku beristirahat!',
      'Kamu bisa memencet aku lagi untuk bantuan ya!'
    ]
  };
  var ASK_TEXT = 'Apakah kamu yakin ingin melewati tutorial?';

  // ------------------------------------------------------------------ util -----------------------------------------
  var ease = {
    lin: function (u) { return u; },
    io: function (u) { return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; },
    out: function (u) { return 1 - Math.pow(1 - u, 3); },
    inn: function (u) { return u * u * u; },
    smooth: function (u) { return u * u * u * (u * (u * 6 - 15) + 10); },
    back: function (u) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); }
  };
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function $(id) { return document.getElementById(id); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function noop() {}
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function inLandscape() { return window.__landscapeLoaded === true || !!(window.KAIH && window.KAIH.ctx && $('scene')); }
  function gfx() { return (window.KaihSettings && window.KaihSettings.gfx) || 'tinggi'; }

  // ------------------------------------------------------------------ state ----------------------------------------
  var T = null, ready = false, renderer, scene, cam, camRT, rt, rtBuf, rtCtx, rtFail = false, model, parts, cape;
  var lockTwirl = false;
  var cv, hit, say, sayText, saySkip, fab, fabCv, menu, askYes, askNo;
  var partSys = null, pd = null;
  var W = innerWidth, H = innerHeight, DPR = 1, Rpx = 50, RTS = 192, PMAX = 240;
  var P = { x: 0, y: 0, sc: 1, yaw: 0, flip: 0, roll: 0, sy: 1, hov: 1, idle: 1, talk: 0, jumpY: 0, vis: true };
  var mode = 'hidden';                 // hidden | 3d | fab
  var rafId = 0, lastT = 0, clock = 0, tws = [], runId = 0, bubbleOn = false, ladangShown = false, twirling = false, flash = 0;
  var dlg = null;                      // dialog aktif {res, timers}
  var hat = { a: 0, v: 0 }, tail = { a: 0, v: 0 }, vel = { x: 0, y: 0 }, lastPx = 0, lastPy = 0, lastSec = -1, blinkT = 3, blink = 0;
  var fabTimer = 0, hitSize = 0, asking = false, askAfter = null, askWait = [], seqActive = false, bypass = false, camOrig = null, tourSel = false;
  // gestur & respons interaktif
  var arm = [{ z: -0.96, x: 0, vz: 0, vx: 0 }, { z: 0.96, x: 0, vz: 0, vx: 0 }], leg = [{ x: 0, z: 0, vx: 0, vz: 0 }, { x: 0, z: 0, vx: 0, vz: 0 }];
  var gest = { n: 'idle', until: 0, o: {} }, look = { x: 0, y: 0 }, lookTo = null, ptr = { x: -1, y: -1, t: -99 }, legPh = 0, idleT = 4;

  // ------------------------------------------------------------------ audio kecil (lewat hook SFX settings) ------
  var ac = null;
  function A() {
    try {
      if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return null;
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended' && ac.resume) ac.resume().catch(noop);
    } catch (e) { ac = null; }
    return ac;
  }
  function tone(f0, f1, d, type, g0) {
    var c = A(); if (!c) return;
    try {
      var o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
      o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(g0 || 0.05, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + 0.03);
    } catch (e) {}
  }
  var sfx = {
    pop: function () { tone(280, 880, 0.2, 'sine', 0.07); tone(660, 1320, 0.28, 'triangle', 0.035); },
    whoosh: function () { tone(420, 1500, 0.3, 'triangle', 0.045); },
    swoop: function () { tone(180, 760, 0.9, 'sine', 0.05); tone(360, 1500, 0.9, 'triangle', 0.02); },
    blip: function () { var f = rnd(560, 700); tone(f, f * 1.04, 0.035, 'square', 0.014); },
    land: function () { tone(150, 70, 0.14, 'sine', 0.06); },
    rustle: function () { var f = rnd(110, 210); tone(f, f * 0.6, 0.07, 'sawtooth', 0.02); },
    reveal: function () {
      tone(220, 55, 0.55, 'sine', 0.13); tone(700, 2600, 0.7, 'triangle', 0.05);
      [880, 1175, 1568, 2093, 2637].forEach(function (f, k) { setTimeout(function () { tone(f, f * 1.01, 0.5, 'sine', 0.035); }, 70 + k * 75); });
    },
    confetti: function () { tone(900, 1900, 0.18, 'triangle', 0.04); tone(1200, 2400, 0.2, 'sine', 0.025); }
  };

  // ------------------------------------------------------------------ tween ringan ---------------------------------
  function tw(dur, fn, e) {
    return new Promise(function (res) {
      tws.push({ t0: performance.now(), dur: Math.max(1, dur), fn: fn, e: e || ease.io, res: res });
      loop();
    });
  }
  function stepTweens(now) {
    for (var i = tws.length - 1; i >= 0; i--) {
      var t = tws[i], u = clamp((now - t.t0) / t.dur, 0, 1);
      try { t.fn(t.e(u), u); } catch (e) { console.warn('[Guide] tween', e); }
      if (u >= 1) { tws.splice(i, 1); t.res(); }
    }
  }
  function ck(id) { if (id !== runId) throw CANCEL; }
  async function Wt(id, p) { await p; ck(id); }
  function cancelAll() {
    runId++; seqActive = false; asking = false; if (say) say.classList.remove('ask');
    var old = tws.splice(0); old.forEach(function (t) { t.res(); });
    closeBubble(true); camReset(); endTour(); lockTwirl = false;
    flushAsk();
  }
  async function go(fn) {
    cancelAll();
    var id = runId;
    try { await fn(id); } catch (e) { if (e !== CANCEL) console.warn('[Guide]', e); }
    if (id === runId) seqActive = false;
  }

  // ------------------------------------------------------------------ DOM + CSS -------------------------------------
  function buildUI() {
    if (cv) return;
    var st = document.createElement('style'); st.id = 'kx-guide-css';
    st.textContent =
      'html.kxg-off #kx-guide-cv,html.kxg-off #kx-guide-hit,html.kxg-off #kx-guide-say,html.kxg-off #kx-guide-fab,html.kxg-off #kx-guide-menu{display:none!important}' +
      'html.kxg-tour .fixed.z-20.h-0.w-0{visibility:hidden!important}' +    // kartu info bawaan disembunyikan saat tur kamera (agar tidak menutup dialog)
      '#kx-guide-cv{position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:2147481500;display:none}#kx-guide-cv.on{display:block}' +
      '#kx-guide-hit{position:fixed;left:0;top:0;z-index:2147481650;border-radius:50%;pointer-events:auto;cursor:pointer;display:none;-webkit-tap-highlight-color:transparent;touch-action:manipulation;background:transparent}#kx-guide-hit.on{display:block}' +
      '#kx-guide-say{position:fixed;left:0;top:0;z-index:2147481600;width:min(420px,calc(100vw - 24px));box-sizing:border-box;display:none;opacity:0;transition:opacity .22s ease;font-family:' + FONT + ';color:#ece5d8;' +
      'background:linear-gradient(180deg,#4a5368,#3b4255);border:1px solid rgba(236,229,216,.2);border-radius:8px;box-shadow:inset 0 0 0 2px #3b4255,inset 0 0 0 3px rgba(211,188,142,.55),0 12px 30px rgba(0,0,0,.45);padding:12px 16px 10px;-webkit-tap-highlight-color:transparent;touch-action:manipulation;cursor:pointer}' +
      '#kx-guide-say.on{display:block}#kx-guide-say.show{opacity:1}' +
      '#kx-guide-say .gs-name{font-size:12px;letter-spacing:.24em;color:#d3bc8e;margin-bottom:5px}#kx-guide-say .gs-name::before{content:"";display:inline-block;width:7px;height:7px;background:#d3bc8e;transform:rotate(45deg);margin-right:9px;vertical-align:1px}' +
      '#kx-guide-say .gs-text{font-size:15.5px;line-height:1.5;letter-spacing:.015em}#kx-guide-say .gs-ghost{opacity:0}' +
      '#kx-guide-say .gs-foot{display:flex;align-items:center;justify-content:space-between;margin-top:8px;gap:12px}' +
      '#kx-guide-say .gs-next{font-size:11.5px;color:#d3bc8e;letter-spacing:.08em;opacity:0;transition:opacity .2s}#kx-guide-say.done .gs-next{opacity:.9;animation:kxgb 1.1s ease-in-out infinite}' +
      '#kx-guide-say .gs-skip{background:rgba(236,229,216,.1);border:1px solid rgba(211,188,142,.4);color:#ece5d8;border-radius:5px;padding:4px 11px;font:inherit;font-size:12px;cursor:pointer}' +
      '#kx-guide-say .gs-askrow{display:none;gap:10px;margin-top:12px}#kx-guide-say.ask .gs-askrow{display:flex}#kx-guide-say.ask .gs-foot{display:none}' +
      '#kx-guide-say .gs-askrow button{flex:1;padding:9px 10px;border-radius:5px;border:1px solid rgba(211,188,142,.5);background:rgba(236,229,216,.1);color:#ece5d8;font:inherit;font-size:14px;cursor:pointer}' +
      '#kx-guide-say .gs-askrow .gs-yes{background:linear-gradient(180deg,#efe6d2,#d9ccb0);color:#3b4255;font-weight:700;border-color:#d3bc8e}' +
      '#kx-guide-say .gs-askrow button:active{transform:scale(.97)}' +
      '@keyframes kxgb{50%{transform:translateY(2px);opacity:.4}}' +
      '#kx-guide-fab{position:fixed;z-index:2147481700;width:62px;height:62px;border-radius:50%;border:2px solid rgba(211,188,142,.85);padding:0;background:radial-gradient(circle at 50% 30%,#5b6585,#363d54 70%);' +
      'box-shadow:0 6px 18px rgba(0,0,0,.45),inset 0 0 0 2px rgba(59,66,85,.9),0 0 14px rgba(246,230,180,.25);cursor:pointer;display:none;touch-action:manipulation;-webkit-tap-highlight-color:transparent;font-size:28px;line-height:58px;text-align:center}' +
      '#kx-guide-fab.on{display:block;animation:kxfpop .55s cubic-bezier(.34,1.56,.64,1) both,kxfloat 3.2s ease-in-out .55s infinite}' +
      '#kx-guide-fab.ping::after{content:"";position:absolute;inset:-7px;border-radius:50%;border:2px solid rgba(246,230,180,.85);animation:kxping 1.3s ease-out 3}' +
      '#kx-guide-fab canvas{position:absolute;left:-13px;top:-23px;width:88px;height:88px;pointer-events:none}' +
      '@keyframes kxfpop{from{transform:scale(.2);opacity:0}to{transform:scale(1);opacity:1}}@keyframes kxfloat{50%{transform:translateY(-4px)}}' +
      '@keyframes kxping{from{transform:scale(.85);opacity:1}to{transform:scale(1.35);opacity:0}}' +
      '#kx-guide-menu{position:fixed;z-index:2147481800;min-width:216px;box-sizing:border-box;display:flex;flex-direction:column;gap:6px;padding:10px;font-family:' + FONT + ';color:#ece5d8;' +
      'background:linear-gradient(180deg,#4a5368,#3b4255);border:1px solid rgba(236,229,216,.2);border-radius:8px;box-shadow:inset 0 0 0 2px #3b4255,inset 0 0 0 3px rgba(211,188,142,.55),0 12px 30px rgba(0,0,0,.45);' +
      'opacity:0;transform:scale(.9) translateY(-8px);transform-origin:top left;pointer-events:none;transition:opacity .18s ease,transform .22s cubic-bezier(.34,1.56,.64,1);visibility:hidden}' +
      '#kx-guide-menu.on{opacity:1;transform:none;pointer-events:auto;visibility:visible}' +
      '#kx-guide-menu .gm-t{font-size:11px;letter-spacing:.24em;color:#d3bc8e;padding:2px 4px 4px}' +
      '#kx-guide-menu button{display:flex;align-items:center;gap:10px;text-align:left;padding:11px 14px;border-radius:5px;border:1px solid rgba(211,188,142,.4);background:rgba(236,229,216,.08);color:#ece5d8;font:inherit;font-size:14px;cursor:pointer}' +
      '#kx-guide-menu button:hover,#kx-guide-menu button:active{background:rgba(236,229,216,.18)}' +
      '.kx-guide-hint{animation:kxhint 1s ease-in-out infinite;box-shadow:0 0 0 3px rgba(246,230,180,.95),0 0 24px rgba(246,230,180,.85)!important}@keyframes kxhint{50%{transform:scale(1.045)}}';
    document.head.appendChild(st);

    cv = document.createElement('canvas'); cv.id = 'kx-guide-cv';
    hit = document.createElement('div'); hit.id = 'kx-guide-hit'; hit.setAttribute('role', 'button'); hit.setAttribute('aria-label', 'Guide');
    say = document.createElement('div'); say.id = 'kx-guide-say';
    say.innerHTML = '<div class="gs-name">GUIDE</div><div class="gs-text"></div>' +
      '<div class="gs-foot"><span class="gs-next">Ketuk untuk lanjut ▾</span><button type="button" class="gs-skip">Lewati</button></div>' +
      '<div class="gs-askrow"><button type="button" class="gs-yes">Ya, lewati</button><button type="button" class="gs-no">Tidak</button></div>';
    sayText = say.querySelector('.gs-text'); saySkip = say.querySelector('.gs-skip'); askYes = say.querySelector('.gs-yes'); askNo = say.querySelector('.gs-no');
    fab = document.createElement('button'); fab.id = 'kx-guide-fab'; fab.type = 'button'; fab.setAttribute('aria-label', 'Guide: bantuan');
    fabCv = document.createElement('canvas'); fabCv.width = RTS; fabCv.height = RTS; fab.appendChild(fabCv);
    menu = document.createElement('div'); menu.id = 'kx-guide-menu'; menu.setAttribute('role', 'menu');
    [cv, hit, say, fab, menu].forEach(function (e) { HTML.appendChild(e); });
    [hit, say, fab, menu].forEach(function (e) { e.addEventListener('pointerdown', function (ev) { ev.stopPropagation(); }); });

    hit.addEventListener('click', function () { G.twirl(); });
    hit.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && mode === '3d' && gest.n === 'idle') setGesture('wave', 1.6); });
    say.addEventListener('click', function (ev) { if (ev.target === saySkip || asking || ev.target.closest('.gs-askrow')) return; advance(); });
    saySkip.addEventListener('click', function (ev) { ev.stopPropagation(); askSkip(null); });
    askYes.addEventListener('click', function (ev) { ev.stopPropagation(); answerSkip(true); });
    askNo.addEventListener('click', function (ev) { ev.stopPropagation(); answerSkip(false); });
    fab.addEventListener('click', function (ev) { ev.stopPropagation(); setGesture('cheer', 0.7); toggleMenu(); });
    fab.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') setGesture('wave', 1.4); });
    document.addEventListener('pointerdown', function (ev) { if (menu.classList.contains('on') && !menu.contains(ev.target) && !fab.contains(ev.target)) closeMenu(); }, true);
    addEventListener('pointermove', function (e) { ptr.x = e.clientX; ptr.y = e.clientY; ptr.t = clock; }, { passive: true });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) loop(); });
    // Lanjutkan ke dashboard di tengah tutorial -> konfirmasi dulu (capture: sebelum handler bawaan)
    document.addEventListener('click', function (ev) {
      var b = $('kx-btn');
      if (bypass || !b || !b.contains(ev.target) || !(seqActive && mode === '3d')) return;
      ev.preventDefault(); ev.stopImmediatePropagation();
      askSkip(function () { bypass = true; try { b.click(); } finally { bypass = false; } });
    }, true);
  }

  // ------------------------------------------------------------------ init 3D --------------------------------------
  var SHADER_V = {
    part: 'attribute float aSize; attribute float aAlpha; attribute float aShape; attribute vec3 aColor; uniform float uDpr; varying float vA; varying float vS; varying vec3 vC;' +
          'void main(){ vA = aAlpha; vS = aShape; vC = aColor; gl_PointSize = aSize * uDpr; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    partF: 'varying float vA; varying float vS; varying vec3 vC; void main(){ vec2 c = gl_PointCoord - 0.5; float a;' +
           'if (vS < 0.5) { a = step(max(abs(c.x), abs(c.y)), 0.36); }' +
           'else if (vS < 1.5) { float s = sqrt(abs(c.x)) + sqrt(abs(c.y)); a = smoothstep(0.80, 0.58, s); }' +
           'else if (vS < 2.5) { a = smoothstep(0.5, 0.05, length(c)); }' +
           'else { a = step(abs(c.x), 0.13) * step(abs(c.y), 0.42); }' +
           'if (a < 0.01) discard; gl_FragColor = vec4(vC, a * vA); }'
  };

  function ensure3D() {
    if (ready) return true;
    T = window.THREE;
    if (!T || !window.KaihGuideModel) { console.warn('[Guide] THREE / model belum tersedia'); return false; }
    try {
      buildUI();
      renderer = new T.WebGLRenderer({ canvas: cv, alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setClearColor(0x000000, 0);
      scene = new T.Scene();
      cam = new T.OrthographicCamera(0, W, H, 0, -1000, 1000);
      camRT = new T.OrthographicCamera(-1.75, 1.75, 1.85, -1.65, -10, 10);
      model = window.KaihGuideModel.build(T); parts = model.parts; cape = model.cape; scene.add(model.root); scene.add(cape.mesh);
      buildParticles();
      ready = true; onResize();
    } catch (e) { console.warn('[Guide] gagal menyiapkan 3D', e); ready = false; return false; }
    return true;
  }

  function buildParticles() {
    var g = new T.BufferGeometry(), pos = new Float32Array(PMAX * 3), col = new Float32Array(PMAX * 3), sz = new Float32Array(PMAX), al = new Float32Array(PMAX), sh = new Float32Array(PMAX);
    g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aColor', new T.BufferAttribute(col, 3));
    g.setAttribute('aSize', new T.BufferAttribute(sz, 1)); g.setAttribute('aAlpha', new T.BufferAttribute(al, 1)); g.setAttribute('aShape', new T.BufferAttribute(sh, 1));
    var m = new T.ShaderMaterial({ vertexShader: SHADER_V.part, fragmentShader: SHADER_V.partF, transparent: true, depthTest: false, depthWrite: false, uniforms: { uDpr: { value: 1 } } });
    var pts = new T.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 5; scene.add(pts);
    pd = []; for (var i = 0; i < PMAX; i++) pd.push({ on: false, x: 0, y: 0, vx: 0, vy: 0, g: 0, age: 0, ttl: 1, sz: 8, drag: 0, r: 1, gC: 1, b: 1, sh: 0, a0: 1 });
    partSys = { pts: pts, g: g, pos: pos, col: col, sz: sz, al: al, sh: sh, mat: m, alive: 0 };
  }

  function spawn(o) {
    for (var i = 0; i < PMAX; i++) {
      var p = pd[i]; if (p.on) continue;
      p.on = true; p.x = o.x; p.y = o.y; p.vx = o.vx; p.vy = o.vy; p.g = o.g || 0; p.drag = o.drag || 0; p.age = 0; p.ttl = o.ttl; p.sz = o.sz; p.sh = o.sh; p.r = o.c[0]; p.gC = o.c[1]; p.b = o.c[2]; p.a0 = o.a == null ? 1 : o.a;
      return;
    }
  }
  function dust(x, y, n) {
    var cols = [[1, 0.96, 0.78], [1, 0.9, 0.62], [1, 1, 1], [0.78, 0.9, 1]];
    for (var i = 0; i < n; i++) { var a = rnd(0, 6.283), s = rnd(60, 230); spawn({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, g: 40, drag: 1.6, ttl: rnd(0.7, 1.3), sz: rnd(10, 20), sh: 1, c: cols[i % 4] }); }
  }
  function confetti(x, y, n) {
    var cols = [[1, 1, 1], [0.86, 0.87, 0.92], [0.64, 0.66, 0.74], [0.42, 0.44, 0.52]];
    for (var i = 0; i < n; i++) { var a = rnd(-3.0, -0.14), s = rnd(190, 470); spawn({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 780, drag: 0.9, ttl: rnd(0.95, 1.7), sz: rnd(6, 11), sh: i % 3 === 0 ? 3 : 0, c: cols[i % 4] }); }
  }
  function updateParticles(dt) {
    if (!partSys) return;
    var n = 0, i, ps = partSys;
    for (i = 0; i < PMAX; i++) {
      var p = pd[i];
      if (p.on) {
        p.age += dt;
        if (p.age >= p.ttl) { p.on = false; }
        else {
          p.vx *= Math.max(0, 1 - p.drag * dt); p.vy *= Math.max(0, 1 - p.drag * dt); p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
          var u = p.age / p.ttl; n++;
          ps.pos[i * 3] = p.x; ps.pos[i * 3 + 1] = H - p.y; ps.pos[i * 3 + 2] = 1;
          ps.col[i * 3] = p.r; ps.col[i * 3 + 1] = p.gC; ps.col[i * 3 + 2] = p.b;
          ps.sz[i] = p.sz * (p.sh === 1 ? (1 - 0.5 * u) : 1); ps.al[i] = p.a0 * Math.min(1, u * 8) * (1 - u * u); ps.sh[i] = p.sh;
          continue;
        }
      }
      ps.sz[i] = 0; ps.al[i] = 0;
    }
    ps.alive = n;
    ps.g.attributes.position.needsUpdate = ps.g.attributes.aColor.needsUpdate = ps.g.attributes.aSize.needsUpdate = ps.g.attributes.aAlpha.needsUpdate = ps.g.attributes.aShape.needsUpdate = true;
  }

  // ------------------------------------------------------------------ resize ----------------------------------------
  function onResize() {
    W = innerWidth; H = innerHeight;
    Rpx = clamp(Math.min(W, H) * 0.12, 34, 74);
    if (!ready) return;
    DPR = Math.min(window.devicePixelRatio || 1, gfx() === 'extreme' ? 3 : 2);
    renderer.setPixelRatio(DPR); renderer.setSize(W, H, false);
    cam.left = 0; cam.right = W; cam.top = H; cam.bottom = 0; cam.updateProjectionMatrix();
    partSys.mat.uniforms.uDpr.value = DPR;
    if (mode === 'fab') placeFab();
    loop();
  }

  // ------------------------------------------------------------------ gestur ---------------------------------------
  function setGesture(n, dur, o) { gest = { n: n, until: dur ? clock + dur : 1e9, o: o || {} }; }
  function pointAt(x, y, dur) {   // lengan terdekat menunjuk ke titik layar (x,y)
    var dx = x - P.x, dyUp = -(y - (P.y + P.jumpY));
    setGesture('point', dur || 2.2, { ang: Math.atan2(dx, -dyUp), arm: dx >= 0 ? 1 : 0 });
    lookTo = { x: x, y: y, until: clock + (dur || 2.2) };
  }
  function armTarget(i) {          // i: 0 = kiri layar (-X), 1 = kanan layar (+X)
    var sg = i ? 1 : -1, tz = sg * 0.96, tx = 0, n = gest.n;
    if (clock > gest.until) { gest = { n: 'idle', until: 0, o: {} }; n = 'idle'; }
    switch (n) {
      case 'wave':   if (i === 1) { tz = 2.55 + Math.sin(clock * 9.5) * 0.4; tx = 0.1; } else { tz = sg * 0.7; tx = -0.1; } break;
      case 'spread': tz = sg * (1.5 + Math.sin(clock * 3.2) * 0.1); tx = 0.12; break;
      case 'cheer':  tz = sg * (2.65 + Math.sin(clock * 10.5 + i * 1.3) * 0.24); tx = 0.05; break;
      case 'heart':  tz = sg * 0.5; tx = 1.1 + Math.sin(clock * 4.2) * 0.07; break;
      case 'fly':    tz = sg * 1.25; tx = -0.8 + Math.sin(clock * 5.4 + i) * 0.14; break;
      case 'point':  if (gest.o.arm === i) { tz = gest.o.ang; tx = 0.12; } else { tz = sg * 0.55; tx = 0.2; } break;
      case 'reach':  tz = sg * 0.28 + Math.sin(clock * 13 + i * 2.4) * 0.1; tx = -1.45 + Math.sin(clock * 17 + i * 1.7) * 0.22; break;   // tangan ke belakang (merogoh)
      case 'lift':   tz = sg * (2.75 + Math.sin(clock * 6 + i) * 0.06); tx = 0.08; break;                                              // tangan terangkat (membawa peta)
      case 'ask':    if (i === 1) { tz = 0.75; tx = 1.25; } else { tz = sg * 0.7; tx = 0.1; } break;
      default:       tz = sg * 0.96 + Math.sin(clock * 1.9 + i * 1.7) * 0.07;
    }
    if (P.talk > 0.01 && (n === 'idle' || n === 'ask')) { tz += sg * Math.sin(clock * 2.7 + i * 2.1) * 0.17 * P.talk; tx += Math.sin(clock * 3.3 + i) * 0.3 * P.talk; }
    if (n === 'idle') tz += sg * clamp(-vel.y * 0.0009, -0.35, 0.35);       // lengan tertinggal saat naik/turun
    return { z: tz, x: tx };
  }
  function spring(o, k, tgt, dt, kk, c) { var v = 'v' + k; o[v] += (tgt - o[k]) * kk * dt; o[v] *= Math.exp(-c * dt); o[k] += o[v] * dt; }

  // ------------------------------------------------------------------ pose & animasi bone ---------------------------
  function placeRoot(dt) {
    var R = Rpx * P.sc;
    var hy = Math.sin(clock * 2.1) * Rpx * 0.075 * P.hov, hx = Math.sin(clock * 1.05) * Rpx * 0.03 * P.hov;   // hover sine (Paimon-like)
    var x = P.x + hx, y = P.y + P.jumpY + hy;
    vel.x = (x - lastPx) / Math.max(dt, 0.001); vel.y = (y - lastPy) / Math.max(dt, 0.001); lastPx = x; lastPy = y;
    var r = model.root, s = Math.max(0.001, R), bank = clamp(-vel.x * 0.0007, -0.42, 0.42);      // miring mengikuti arah gerak
    r.position.set(x, H - y, 0);
    r.scale.set(s / Math.sqrt(P.sy), s * P.sy, s);
    r.rotation.set(P.flip + Math.sin(clock * 1.3) * 0.035 * P.idle, P.yaw + look.x * 0.22 + Math.sin(clock * 0.8) * 0.15 * P.idle, P.roll + bank + Math.sin(clock * 1.1) * 0.035 * P.idle);
  }
  function animateBones(dt) {
    // --- Bone_Hat / Bone_SuitTail
    var sec = Math.floor(clock);
    if (sec !== lastSec) { lastSec = sec; hat.v += 3.2; }                      // topi memantul ringan tiap detik
    hat.v += (-hat.a * 90 - hat.v * 7 - vel.y * 0.004) * dt; hat.a += hat.v * dt;
    parts.hat.rotation.x = clamp(hat.a, -0.7, 0.7) * 0.42;
    parts.hat.rotation.z = parts.hat.userData.baseZ + hat.a * 0.08;
    parts.hat.position.y = 0.92 + Math.max(0, hat.a) * 0.035;
    tail.v += (-tail.a * 70 - tail.v * 6 + vel.y * 0.0035 - Math.abs(vel.x) * 0.0006) * dt; tail.a += tail.v * dt;
    parts.tail.rotation.x = 0.03 + clamp(tail.a, -0.5, 0.5) + Math.sin(clock * 3.1) * 0.05;
    // --- tangan: spring menuju target gestur (ada overshoot kecil -> terasa hidup)
    var speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y), run = clamp(speed / 380, 0, 1), kk = 170, cc = 13;
    if (dt > 0.05) { kk = 80; cc = 9; }
    parts.arms.forEach(function (a, i) {
      var t = armTarget(i);
      spring(arm[i], 'z', t.z, dt, kk, cc); spring(arm[i], 'x', t.x, dt, kk, cc);
      a.rotation.z = arm[i].z; a.rotation.x = arm[i].x;
    });
    // --- kaki: ayun idle, mengayuh saat bergerak cepat, tertinggal saat bergeser, menendang saat bersorak
    legPh += dt * (2.2 + run * 9);
    parts.legs.forEach(function (l, i) {
      var ph = legPh + i * Math.PI, tx = Math.sin(ph) * (0.09 + 0.75 * run), tz = clamp(-vel.x * 0.0011, -0.6, 0.6) + (i ? 0.07 : -0.07);
      if (gest.n === 'cheer') tx += Math.sin(clock * 11 + i * Math.PI) * 0.5;
      if (gest.n === 'wave' && i === 0) tx += Math.sin(clock * 4) * 0.12;
      if (P.jumpY < -2) tx -= 0.5;                                              // lutut ditekuk saat melompat
      spring(leg[i], 'x', tx, dt, kk * 0.8, cc); spring(leg[i], 'z', tz, dt, kk * 0.6, cc);
      l.rotation.x = leg[i].x; l.rotation.z = leg[i].z;
    });
    // --- mata/wajah mengikuti pointer (atau titik yang sedang ditunjuk)
    var tx2 = 0, ty2 = 0, lt = null;
    if (lookTo && clock < lookTo.until) lt = lookTo; else if (clock - ptr.t < 6 && ptr.x >= 0) lt = ptr;
    if (lt) { tx2 = clamp((lt.x - P.x) / (W * 0.45), -1, 1); ty2 = clamp((lt.y - P.y) / (H * 0.45), -1, 1); }
    else { tx2 = Math.sin(clock * 0.45) * 0.3; ty2 = Math.sin(clock * 0.31) * 0.1; }
    look.x += (tx2 - look.x) * Math.min(1, dt * 6); look.y += (ty2 - look.y) * Math.min(1, dt * 6);
    parts.face.rotation.y = look.x * 0.42; parts.face.rotation.x = look.y * 0.28;
    // --- kedip & mulut
    blinkT -= dt; if (blinkT < 0) { blinkT = rnd(2.4, 5); blink = 0.13; }
    if (blink > 0) blink -= dt;
    parts.eyes.forEach(function (e) { e.scale.y = blink > 0 ? 0.012 : 0.07; });
    var open = P.talk > 0.01;
    parts.mouth.visible = !open; parts.mouthOpen.visible = open;
    if (open) parts.mouthOpen.scale.y = 0.012 + (0.5 + 0.5 * Math.sin(clock * 17)) * 0.062 * P.talk;
    if (flash > 0.002) { flash *= Math.pow(0.0008, dt); model.setFlash(flash); } else if (flash !== 0) { flash = 0; model.setFlash(0); }
    // --- gestur acak saat diam (supaya terasa hidup di layar sentuh yang tanpa hover)
    if (mode === '3d' && gest.n === 'idle' && P.talk < 0.01 && !asking) {
      idleT -= dt;
      if (idleT < 0) { idleT = rnd(5, 9); var pick = Math.random(); if (pick < 0.45) setGesture('wave', 1.5); else if (pick < 0.75) setGesture('spread', 1.4); else setGesture('heart', 1.3); }
    }
  }

  function updateHit() {
    if (mode !== '3d' || P.sc < 0.35) { hit.classList.remove('on'); return; }
    var s = Math.round(Rpx * P.sc * 2.5);
    if (s !== hitSize) { hitSize = s; hit.style.width = hit.style.height = s + 'px'; }
    hit.style.transform = 'translate3d(' + Math.round(P.x - s / 2) + 'px,' + Math.round(P.y + P.jumpY - s / 2.1) + 'px,0)';
    hit.classList.add('on');
  }

  // ------------------------------------------------------------------ loop ------------------------------------------
  function needLoop() { return !document.hidden && (mode === '3d' || tws.length > 0 || (partSys && partSys.alive > 0)); }
  function loop() { if (!rafId && ready && needLoop()) { lastT = performance.now(); rafId = requestAnimationFrame(tick); } }
  function tick(now) {
    rafId = 0;
    var dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000)); lastT = now; clock += dt;
    stepTweens(now);
    if (mode === '3d' || (partSys && partSys.alive > 0)) {
      var vis = mode === '3d' && P.vis;
      model.root.visible = vis; cape.mesh.visible = vis;
      if (mode === '3d') {
        placeRoot(dt); animateBones(dt);
        if (vis) {
          model.root.updateMatrixWorld(true);
          cape.update(dt, clock, model.root.matrixWorld, vel.x, -vel.y, (gest.n === 'fly' ? 0.6 : 0) + P.talk * 0.1);   // cape mengibar mengikuti gerak
        }
      }
      updateParticles(dt);
      renderer.render(scene, cam);
    }
    if (bubbleOn) placeBubble();
    updateHit();
    if (needLoop()) rafId = requestAnimationFrame(tick);
    else if (mode !== '3d') cv.classList.toggle('on', !!(partSys && partSys.alive > 0));
  }

  function show3D() {
    cv.classList.add('on'); model.root.visible = P.vis; cape.mesh.visible = P.vis; cape.reset();
    lastPx = P.x; lastPy = P.y; vel.x = vel.y = 0; mode = '3d'; fab.classList.remove('on', 'ping'); closeMenu(); loop();
  }

  // ------------------------------------------------------------------ bubble dialog --------------------------------
  function homePos() { return { x: W / 2, y: Math.max(Rpx * 2.15, H * 0.3) }; }
  function placeBubble() {
    var bw = say.offsetWidth, bh = say.offsetHeight, gx = P.x, gy = P.y + P.jumpY, gr = Rpx * P.sc;
    var x = clamp(gx - bw / 2, 12, W - bw - 12), below = gy + gr * 1.75 + 10, above = gy - gr * 1.55 - bh - 10, y;
    if (below + bh <= H - 14) y = below; else if (above >= 10) y = above; else y = clamp(gy - bh / 2, 10, H - bh - 10);
    say.style.transform = 'translate3d(' + Math.round(x) + 'px,' + Math.round(y) + 'px,0)';
  }
  function openBubble() { bubbleOn = true; say.classList.add('on'); placeBubble(); requestAnimationFrame(function () { say.classList.add('show'); }); loop(); }
  function closeBubble(now) {
    P.talk = 0;
    if (dlg) { clearTimeout(dlg.t1); clearTimeout(dlg.t2); var r = dlg.res; dlg = null; r && r(); }
    if (!say) { bubbleOn = false; return; }
    bubbleOn = false; say.classList.remove('show', 'done');
    if (now) say.classList.remove('on'); else setTimeout(function () { if (!bubbleOn) say.classList.remove('on'); }, 240);
  }
  function advance() {
    if (!dlg || asking) return;
    if (dlg.typing) { dlg.i = dlg.text.length; renderText(); return; }
    if (dlg.holding) return;                                   // menunggu animasi kamera selesai
    var r = dlg.res; clearTimeout(dlg.t1); clearTimeout(dlg.t2); dlg = null; r && r();
  }
  function armAdvance() {
    if (!dlg) return; clearTimeout(dlg.t2);
    dlg.t2 = setTimeout(advance, Math.max(2200, dlg.text.length * 70 + 1500));      // otomatis lanjut; ketuk untuk lebih cepat
  }
  function renderText() {
    if (!dlg) return;
    sayText.innerHTML = '';
    var a = document.createElement('span'), b = document.createElement('span'); b.className = 'gs-ghost';
    a.textContent = dlg.text.slice(0, dlg.i); b.textContent = dlg.text.slice(dlg.i);
    sayText.appendChild(a); sayText.appendChild(b);
    if (dlg.i >= dlg.text.length && dlg.typing) { dlg.typing = false; P.talk = 0; say.classList.add('done'); armAdvance(); }
  }
  function speak(id, text, o) {
    o = o || {};
    return new Promise(function (res) {
      if (id !== runId) return res();
      var begin = function () {
        if (id !== runId) return res();
        if (!bubbleOn) openBubble();
        dlg = { text: text, i: 0, typing: true, res: res, t1: 0, t2: 0, t0: performance.now(), holding: false };
        if (o.hold) { dlg.holding = true; o.hold.then(function () { return wait(500); }).catch(noop).then(function () { if (dlg && dlg.text === text) { dlg.holding = false; if (!dlg.typing) armAdvance(); } }); }
        if (o.g) setGesture(o.g, o.gdur || 2.4, o.go);
        say.classList.remove('done'); P.talk = 1; renderText(); placeBubble();
        (function type() {
          if (!dlg || dlg.text !== text || !dlg.typing) return;
          var n = Math.min(text.length, Math.max(dlg.i + 1, Math.floor((performance.now() - dlg.t0) / 28)));   // berbasis waktu nyata: akurat di perangkat lambat
          if (n !== dlg.i && n % 2 === 0) sfx.blip();
          dlg.i = n;
          if (!asking) renderText();
          if (dlg && dlg.typing) dlg.t1 = setTimeout(type, 28);
        })();
      };
      if (asking) askWait.push(begin); else begin();
    });
  }
  function flushAsk() { var w = askWait.splice(0); w.forEach(function (f) { f(); }); }

  // ------------------------------------------------------------------ konfirmasi lewati tutorial ------------------
  function askSkip(after) {
    if (asking || !ready) return;
    asking = true; askAfter = after || null;
    if (dlg) { clearTimeout(dlg.t1); clearTimeout(dlg.t2); }
    if (!bubbleOn) openBubble();
    say.classList.add('ask'); say.classList.remove('done');
    sayText.textContent = ASK_TEXT; P.talk = 1; setTimeout(function () { if (asking) P.talk = 0; }, 1500);
    setGesture('ask', 0); sfx.pop(); placeBubble();
  }
  function answerSkip(yes) {
    if (!asking) return;
    asking = false; say.classList.remove('ask'); P.talk = 0; setGesture('idle', 0);
    var after = askAfter; askAfter = null;
    if (yes) { go(async function (id) { await toFab(id); if (after) setTimeout(after, 120); }); return; }
    if (dlg) {                                                                    // lanjutkan dialog yang tertunda
      dlg.i = dlg.text.length; dlg.typing = false; say.classList.add('done'); renderText();
      if (!dlg.holding) armAdvance();
    } else closeBubble(false);
    flushAsk();
  }

  // ------------------------------------------------------------------ gerakan dasar --------------------------------
  function moveTo(id, x, y, dur, e) {
    var x0 = P.x, y0 = P.y;
    return Wt(id, tw(dur, function (u) { P.x = x0 + (x - x0) * u; P.y = y0 + (y - y0) * u; }, e || ease.io));
  }
  function scaleTo(id, s, dur, e) { var s0 = P.sc; return Wt(id, tw(dur, function (u) { P.sc = s0 + (s - s0) * u; }, e || ease.io)); }

  async function flyAround(id) {
    var cx = P.x, cy = P.y;
    sfx.whoosh(); setGesture('fly', 1.5);
    await Wt(id, tw(1500, function (u) {
      var a = u * Math.PI * 2;
      P.x = cx + Math.sin(a) * Rpx * 2.1; P.y = cy + (Math.cos(a) - 1) * Rpx * 0.9; P.yaw = Math.sin(a * 2) * 0.55;
    }, ease.io));
    P.x = cx; P.y = cy; P.yaw = 0;
  }
  async function nod(id) {
    for (var k = 0; k < 2; k++) await Wt(id, tw(260, function (u) { P.flip = Math.sin(u * Math.PI) * 0.32; }, ease.lin));
    P.flip = 0;
  }
  // Masuk dari kejauhan: terbang melengkung, makin dekat, lalu berputar (melambat) hingga menghadap POV user
  async function flyIn(id) {
    var h = homePos(), p0 = { x: W * 0.74, y: H * 0.4 }, c = { x: W * 0.02, y: H * 0.1 };
    P.x = p0.x; P.y = p0.y; P.sc = 0.07; P.hov = 0; P.yaw = Math.PI * 3; P.flip = 0; P.roll = 0; P.jumpY = 0; P.sy = 1; P.talk = 0; P.vis = true;
    model.setAlpha(0); show3D(); setGesture('fly', 0); sfx.swoop();
    await Wt(id, tw(3100, function (u) {
      var e = 1 - Math.pow(1 - u, 2.2), m = 1 - e;                               // melambat saat mendekat
      P.x = m * m * p0.x + 2 * m * e * c.x + e * e * h.x; P.y = m * m * p0.y + 2 * m * e * c.y + e * e * h.y;
      P.sc = 1 / (1 + 13 * (1 - e));                                              // jauh -> dekat (perspektif)
      P.yaw = Math.PI * 3 * (1 - ease.smooth(u));                                 // berputar menghadap kamera
      P.flip = -0.32 * (1 - e);                                                   // condong ke depan saat terbang
      P.hov = clamp((u - 0.75) / 0.25, 0, 1);
      model.setAlpha(Math.min(1, u * 8));
    }, ease.lin));
    model.setAlpha(1); P.yaw = 0; P.flip = 0; P.sc = 1; P.hov = 1;
    dust(P.x, P.y, 20); sfx.pop(); setGesture('wave', 2.2);
    await Wt(id, tw(480, function (u) { P.sy = 1 - 0.1 * Math.sin(u * Math.PI); }, ease.lin));   // pendaratan lembut
    P.sy = 1;
  }
  async function slideIn(id) {
    var h = homePos(), p0 = { x: W * 0.78, y: -Rpx * 3 }, c = { x: W * 0.1, y: H * 0.04 };
    P.x = p0.x; P.y = p0.y; P.sc = 1; P.hov = 0; P.yaw = Math.PI * 2; P.flip = 0; P.roll = 0; P.jumpY = 0; P.sy = 1; P.talk = 0; P.vis = true;
    model.setAlpha(1); show3D(); setGesture('fly', 0); sfx.swoop();
    await Wt(id, tw(2300, function (u) {
      var e = 1 - Math.pow(1 - u, 2.4), m = 1 - e;
      P.x = m * m * p0.x + 2 * m * e * c.x + e * e * h.x; P.y = m * m * p0.y + 2 * m * e * c.y + e * e * h.y;
      P.yaw = Math.PI * 2 * (1 - ease.smooth(u)); P.hov = clamp((u - 0.7) / 0.3, 0, 1);
    }, ease.lin));
    P.yaw = 0; P.hov = 1; sfx.land(); setGesture('wave', 2);
  }

  // ------------------------------------------------------------------ kamera Pulau Awan (tur teman) -----------------
  function R3() { return window.__kaihThree || null; }
  function ctrl() { var s = R3(); return s && s.controls ? s.controls : null; }
  function camSpeed(v) { var c = ctrl(); if (!c) return; if (camOrig == null) camOrig = c.autoRotateSpeed; c.autoRotateSpeed = v; }
  function camReset() { var c = ctrl(); if (c && camOrig != null) c.autoRotateSpeed = camOrig; camOrig = null; }
  function friendBtns() { return [].slice.call(document.querySelectorAll('#root .fixed.inset-x-0.bottom-0 button')); }
  function clearSel() { try { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); } catch (e) {} }
  function endTour() { HTML.classList.remove('kxg-tour'); if (tourSel) { tourSel = false; clearSel(); } }
  // kamera berpindah dari satu teman ke teman lain lewat pemilihan bawaan (OrbitControls memindahkan fokus)
  async function tourFriends(id) {
    var btns = friendBtns(); if (!btns.length) return;
    HTML.classList.add('kxg-tour'); tourSel = true;
    for (var i = 0; i < btns.length; i++) {
      ck(id);
      btns[i].click();
      pointAt(W / 2, H * 0.52, 1.6);                                              // Guide menunjuk & menoleh ke teman yang disorot
      tw(420, function (u) { P.jumpY = -Math.sin(u * Math.PI) * Rpx * 0.35; }, ease.lin);
      await Wt(id, wait(1750));
    }
    tourSel = false; clearSel(); HTML.classList.remove('kxg-tour');                // kembali ke pandangan seluruh pulau
    P.jumpY = 0;
  }

  // ------------------------------------------------------------------ FAB (render texture 2D) -----------------------
  function fabRect() {
    var g = $('kx-gear'), r = g ? g.getBoundingClientRect() : { left: 14, bottom: 58, width: 44 };
    var left = Math.max(6, Math.round(r.left + (r.width - 62) / 2)), top = Math.round(r.bottom + 12);
    // hindari menimpa kartu HUD kecil di bawah Settings (mis. judul "Pulau Awan Pikiran"): geser FAB ke bawahnya
    var root = $('root');
    if (root) {
      for (var pass = 0; pass < 2; pass++) {
        var els = root.querySelectorAll('*');
        for (var k = 0; k < els.length; k++) {
          var e = els[k]; if (e.tagName === 'CANVAS' || !(e.textContent || '').trim()) continue;
          var b = e.getBoundingClientRect();
          if (b.width < 40 || b.height < 18 || b.width > W * 0.85 || b.height > 200) continue;
          if (b.right < left || b.left > left + 62 || b.bottom < top || b.top > top + 62) continue;
          var cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.1) continue;
          top = Math.max(top, Math.round(b.bottom + 10));
        }
      }
    }
    return { left: left, top: top };
  }
  function placeFab() { var f = fabRect(); fab.style.left = f.left + 'px'; fab.style.top = f.top + 'px'; }
  function drawFab() {
    if (!ready || rtFail) return;
    try {
      if (!rt) { rt = new T.WebGLRenderTarget(RTS, RTS); rtBuf = new Uint8Array(RTS * RTS * 4); rtCtx = fabCv.getContext('2d'); }
      var r = model.root, p0 = r.position.clone(), s0 = r.scale.clone(), r0 = r.rotation.clone(), v0 = r.visible, cv0 = cape.mesh.visible, pv = partSys.pts.visible;
      var dt = 0.08; clock += dt;
      r.position.set(0, 0, 0); r.scale.set(1, 1, 1); r.rotation.set(0, Math.sin(clock * 0.8) * 0.22, 0); r.visible = true;
      partSys.pts.visible = false; vel.x = vel.y = 0; P.talk = 0;
      animateBones(dt);
      r.updateMatrixWorld(true); cape.snap(r.matrixWorld, clock); cape.mesh.visible = true;
      renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camRT);
      renderer.readRenderTargetPixels(rt, 0, 0, RTS, RTS, rtBuf); renderer.setRenderTarget(null);
      r.position.copy(p0); r.scale.copy(s0); r.rotation.copy(r0); r.visible = v0; cape.mesh.visible = cv0; partSys.pts.visible = pv; cape.reset();
      var img = rtCtx.createImageData(RTS, RTS), d = img.data, x, y;
      for (y = 0; y < RTS; y++) {
        var si = (RTS - 1 - y) * RTS * 4, di = y * RTS * 4;
        for (x = 0; x < RTS; x++) {
          var i = si + x * 4, j = di + x * 4, a = rtBuf[i + 3];
          if (a) { var k = 255 / a; d[j] = Math.min(255, rtBuf[i] * k); d[j + 1] = Math.min(255, rtBuf[i + 1] * k); d[j + 2] = Math.min(255, rtBuf[i + 2] * k); }
          d[j + 3] = a;
        }
      }
      rtCtx.putImageData(img, 0, 0);
    } catch (e) {
      console.warn('[Guide] render texture gagal, memakai ikon cadangan', e); rtFail = true; try { renderer.setRenderTarget(null); } catch (e2) {}
      fabCv.style.display = 'none'; fab.textContent = '🎩';
    }
  }
  function showFab(ping) {
    placeFab(); mode = 'fab'; setGesture('idle', 0); drawFab();
    fab.classList.remove('on', 'ping'); void fab.offsetWidth; fab.classList.add('on'); if (ping) fab.classList.add('ping');
    cv.classList.remove('on'); hit.classList.remove('on');
    clearInterval(fabTimer); fabTimer = setInterval(function () { if (mode === 'fab' && !document.hidden && !HTML.classList.contains('kxg-off')) drawFab(); }, 80);
    document.documentElement.dispatchEvent(new Event('kaih-guide-fab'));
  }
  function fabCenter() { var f = fabRect(); return { x: f.left + 31, y: f.top + 31 + 2 }; }
  // peta: pastikan sudah berada di pojok kiri bawah (mis. tutorial dilewati di tengah cutscene)
  function ensureMap() {
    var MP = window.KaihGuideMap; if (!MP || inLandscape()) return;
    MP.clearFx(); MP.dim(false);
    if (!MP.isResting()) MP.popIn();
    if (!MP.doorShown()) MP.doorPop();
  }
  async function toFab(id) {
    closeBubble(false); setGesture('fly', 0); lockTwirl = false; ensureMap();
    var c = fabCenter(), x0 = P.x, y0 = P.y, s0 = P.sc, s1 = 26 / Rpx, rr = P.roll;
    sfx.whoosh();
    await Wt(id, tw(800, function (u) {
      P.x = x0 + (c.x - x0) * u; P.y = y0 + (c.y - y0) * u - Math.sin(Math.PI * u) * Rpx * 0.9;
      P.sc = s0 + (s1 - s0) * u; P.yaw = u * Math.PI * 2; P.roll = rr * (1 - u);
    }, ease.io));
    P.yaw = 0; P.roll = 0;
    showFab(true);
  }
  function toFabInstant() { cancelAll(); ensureMap(); if (ready) { showFab(false); } }

  // ------------------------------------------------------------------ dropdown ---------------------------------------
  function menuItems() {
    var items = [
      { ic: '🎓', tx: 'Panduan Guide', run: function () { G.replay(); } }
    ];
    if (inLandscape()) {
      items.push(
        { ic: '◈', tx: 'Edit Bola', run: function () { var b = document.getElementById('edit-btn'); if (b) b.click(); } },
        { ic: '◷', tx: 'Edit Jam', run: function () { var b = document.getElementById('time-btn'); if (b) b.click(); } },
        { ic: '◉', tx: 'Edit Tampilan', run: function () { var b = document.getElementById('cam-btn'); if (b) b.click(); } }
      );
    }
    return items;
  }
  function toggleMenu() { if (menu.classList.contains('on')) closeMenu(); else openMenu(); }
  function openMenu() {
    menu.innerHTML = '<div class="gm-t">GUIDE · BANTUAN</div>';
    menuItems().forEach(function (it) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem');
      b.innerHTML = '<span>' + it.ic + '</span><span>' + it.tx + '</span>';
      b.addEventListener('click', function (ev) { ev.stopPropagation(); closeMenu(); it.run(); });
      menu.appendChild(b);
    });
    var f = fabRect(); menu.style.left = f.left + 'px'; menu.style.top = (f.top + 62 + 8) + 'px';
    menu.classList.add('on'); sfx.pop();
  }
  var homeBusy = false;
  addEventListener('kaih-home-confirm', function () { if (homeBusy) return; homeBusy = true; backToAwan(); });
  function closeMenu() { if (menu) menu.classList.remove('on'); }
  function backToAwan() {
    try { sessionStorage.setItem('kaih-guide-goto', 'awan'); } catch (e) {}
    try { if (window.KaihSkip) window.KaihSkip.loading(true, { text: 'Kembali ke Pulau Awan…', until: function () { return false; }, max: 20000 }); } catch (e) {}
    setTimeout(function () { location.reload(); }, 380);
  }

  // ------------------------------------------------------------------ sekuens ---------------------------------------
  async function seqAwan(id, brief) {
    seqActive = !brief;
    if (brief) {                                                                    // tutorial sudah pernah diputar di sesi ini: Guide langsung jadi tombol FAB, peta & pintu langsung di tempat
      var MPb = window.KaihGuideMap;
      if (MPb && !inLandscape()) { MPb.clearFx(); MPb.dim(false); MPb.restNow(false); MPb.doorPop(true); }
      showFab(false); return;
    }
    if (window.KaihSeen) window.KaihSeen.mark('tutorial');
    if (window.KaihGuideMap) window.KaihGuideMap.slideOutAll();                     // ulang tutorial: peta & pintu meluncur ke bawah lalu hilang; muncul lagi setelah tutorial selesai
    await flyIn(id);
    if (brief) { await wait(250); ck(id); await toFab(id); return; }
    var L = LINES.awan, h = homePos();
    scaleTo(id, 1.15, 700, ease.out).catch(noop);                                  // maju sedikit ke arah kamera
    await Wt(id, speak(id, L[0], { g: 'wave', gdur: 2.6 }));
    await scaleTo(id, 1, 450);
    await Wt(id, speak(id, L[1], { g: 'spread', gdur: 2.6 }));
    await Wt(id, speak(id, L[2], { g: 'heart', gdur: 2.6 }));
    // "lihat-lihat sekitar" -> kamera menyapu mengelilingi pulau
    camSpeed(4.6);
    await Wt(id, speak(id, L[3], { g: 'spread', gdur: 3, hold: wait(3000) }));
    camReset();
    // "teman-temanku" -> Guide minggir ke atas, kamera berpindah dari satu teman ke teman lain
    var tx = W * (W > 700 ? 0.78 : 0.76), ty = Math.max(Rpx * 1.9, H * 0.17);
    moveTo(id, tx, ty, 800, ease.io).catch(noop); scaleTo(id, 0.85, 800, ease.io).catch(noop);
    var tour = tourFriends(id); tour.catch(noop);
    await Wt(id, speak(id, L[4], { g: 'point', gdur: 2, hold: tour }));
    await Wt(id, tour);
    moveTo(id, h.x, h.y, 900, ease.io).catch(noop); scaleTo(id, 1, 900, ease.io).catch(noop);
    await Wt(id, speak(id, L[5], { g: 'spread', gdur: 2.6 }));
    await Wt(id, speak(id, L[6], { g: 'heart', gdur: 2.6 }));
    closeBubble(false);
    await seqMap(id);                                                               // cutscene peta (menggantikan dialog tombol dashboard)
  }

  // ------------------------------------------------------------------ cutscene peta ---------------------------------
  function lerp(a, b, u) { return a + (b - a) * u; }
  async function seqMap(id) {
    var MP = window.KaihGuideMap;
    if (!MP) { await toFab(id); return; }
    MP.preload(); lockTwirl = true;
    var sc0 = 1.8, R = Rpx * sc0, gx = W / 2, gy = Math.min(H * 0.7, H - R * 1.55);
    var botMap = gy - R * 0.8, ar = MP.aspect();
    var bigW = clamp(Math.min((botMap - 18) / ar, W * 0.86, 680), 150, 680), bigH = bigW * ar, tcx = W / 2, tcy = Math.max(bigH / 2 + 10, botMap - bigH / 2);

    // A. mendekat ke POV user (membesar, condong ke depan) + spotlight gelap
    MP.dim(true); sfx.swoop(); setGesture('fly', 0);
    var x0 = P.x, y0 = P.y, s0 = P.sc;
    await Wt(id, tw(1000, function (u) {
      P.x = lerp(x0, gx, u); P.y = lerp(y0, gy, u) - Math.sin(Math.PI * u) * Rpx * 0.5; P.sc = lerp(s0, sc0, u);
      P.flip = -0.26 * Math.sin(Math.PI * u); P.yaw = Math.sin(u * Math.PI * 2) * 0.35;
    }, ease.io));
    P.flip = 0; P.yaw = 0; P.x = gx; P.y = gy; P.sc = sc0; setGesture('idle', 0);
    await Wt(id, wait(260));

    // B. berbalik sedikit dan merogoh sesuatu dari belakang punggung
    setGesture('reach', 0);
    await Wt(id, tw(420, function (u) { P.yaw = 0.95 * u; P.roll = -0.1 * u; }, ease.out));
    var rs = 0;
    await Wt(id, tw(1250, function (u, lin) {
      var env = Math.sin(Math.min(1, lin * 1.05) * Math.PI) * 0.6 + 0.4;
      P.roll = -0.1 + Math.sin(lin * 34) * 0.07 * env; P.jumpY = Math.sin(lin * 22) * Rpx * 0.05 * env; P.x = gx + Math.sin(lin * 41) * 3 * env;
      var n = Math.floor(lin * 11); if (n !== rs) { rs = n; sfx.rustle(); }
    }, ease.lin));
    P.jumpY = 0; P.x = gx;
    await Wt(id, tw(260, function (u) { P.roll = -0.1 - 0.16 * u; P.sy = 1 + 0.07 * u; P.flip = 0.16 * u; }, ease.out));   // tersentak: dapat!

    // C. berputar menghadap POV, mengangkat tangan & mengeluarkan peta (stretch ease in/out + ledakan prismatik)
    setGesture('lift', 0);
    var hx = gx, hy = gy + R * 0.25, w0 = R * 1.0, TA = 230, TL = 300, TS = 820, burst = false;
    tw(420, function (u) { P.yaw = 0.95 * (1 - u); P.roll = lerp(-0.26, 0, u); P.flip = 0.16 * (1 - u); P.sy = 1.07 - 0.07 * u; }, ease.out).catch(noop);
    sfx.whoosh();
    await Wt(id, tw(TA + TL + TS, function (u, lin) {
      var t = lin * (TA + TL + TS), cx, cy, w, sx, sy, rot, al = clamp(t / 90, 0, 1);
      if (t < TA) {                                                   // antisipasi: peta mungil memipih (squash) di tangan Guide
        var e = ease.io(t / TA); cx = hx; cy = hy - e * R * 0.1; w = w0 * (0.6 + 0.4 * e); sx = 1 + 0.4 * e; sy = 1 - 0.4 * e; rot = -0.1;
      } else if (t < TA + TL) {                                       // meluncur: stretch ease-in (makin cepat, makin memanjang)
        var v = (t - TA) / TL, e2 = ease.inn(v);
        cx = lerp(hx, tcx, e2); cy = lerp(hy - R * 0.1, tcy, e2); w = lerp(w0, bigW * 0.85, e2);
        sy = lerp(0.6, 1.9, ease.out(Math.min(1, v * 1.5))); sx = 1 / Math.sqrt(sy); rot = lerp(-0.1, 0.12, v);
      } else {                                                         // tiba -> benturan, squash, lalu elastis menenang (ease-out)
        if (!burst) {
          burst = true; sfx.reveal(); MP.burst(tcx, tcy, { size: Math.max(W, H) * 0.95 }); MP.flash(tcx, tcy, 0.92, 560); MP.sheen(1100); MP.glow(18);
          dust(P.x, P.y, 16);
        }
        var q = (t - TA - TL) / TS, d = Math.exp(-5.2 * q) * Math.cos(Math.PI * 2 * 1.85 * q);
        sy = 1 + 0.9 * d; sx = 1 / Math.sqrt(Math.max(0.3, sy)); w = bigW * (1 - 0.15 * d); cx = tcx; cy = tcy + bigH * 0.04 * (1 - sy);
        rot = 0.16 * Math.exp(-4 * q) * Math.sin(Math.PI * 2 * 1.4 * q);
      }
      MP.setPose(cx, cy, w, sx, sy, rot, al);
    }, ease.lin));
    MP.setPose(tcx, tcy, bigW, 1, 1, 0, 1); P.roll = 0; P.sy = 1; P.flip = 0;
    setGesture('cheer', 1.3);
    await Wt(id, tw(1500, function (u, lin) {                            // tampil megah: peta melayang pelan, cahaya mereda
      MP.setPose(tcx, tcy + Math.sin(lin * Math.PI * 2) * bigH * 0.012, bigW, 1, 1, Math.sin(lin * Math.PI * 2) * 0.012, 1); MP.glow(lerp(18, 7, lin));
    }, ease.lin));

    // D. Guide mengangkat peta (peta menempel di atas kepala) lalu membawanya ke pojok kiri bawah dan meletakkannya
    setGesture('lift', 0); MP.dim(false); sfx.whoosh();
    var over = function (w) { var Rn = Rpx * P.sc; return { x: P.x, y: P.y + P.jumpY - Rn * 1.15 - w * ar / 2 }; };
    var wLift = bigW * 0.6;
    await Wt(id, tw(650, function (u) {                                // angkat
      P.sc = lerp(sc0, 1.4, u); P.jumpY = -Math.sin(u * Math.PI) * Rpx * 0.25; var w = lerp(bigW, wLift, u), o = over(w);
      MP.setPose(lerp(tcx, o.x, u), lerp(tcy, o.y, u), w, 1, 1, lerp(0, -0.06, u), 1); MP.glow(lerp(7, 0, u));
    }, ease.io));
    P.jumpY = 0;
    var rr = MP.restRect(), R2 = Rpx * 0.95, ex = clamp(rr.cx + rr.w / 2 + R2 * 1.5, R2 * 1.4, W - R2 * 1.4), ey = clamp(rr.cy - rr.h * 0.1, R2 * 2.2, H - R2 * 1.6);
    var sx0 = P.x, sy0 = P.y, ss0 = P.sc, ccx = (sx0 + ex) / 2 - W * 0.04, ccy = Math.min(sy0, ey) - H * 0.1;
    await Wt(id, tw(1750, function (u, lin) {                          // bawa
      var m = 1 - u;
      P.x = m * m * sx0 + 2 * m * u * ccx + u * u * ex; P.y = m * m * sy0 + 2 * m * u * ccy + u * u * ey; P.sc = lerp(ss0, 0.95, u);
      var w = lerp(wLift, rr.w, ease.io(u)), o = over(w), b = ease.io(clamp((u - 0.55) / 0.45, 0, 1));
      MP.setPose(lerp(o.x, rr.cx, b), lerp(o.y, rr.cy, b), w, 1, 1, lerp(-0.06 + Math.sin(lin * 9) * 0.06, -0.05, b), 1);
    }, ease.io));
    P.x = ex; P.y = ey; P.sc = 0.95;
    sfx.land(); MP.restNow(true);                                      // diletakkan di pojok kiri bawah (+ pantulan kecil & percikan)
    pointAt(rr.cx, rr.cy, 2);
    await Wt(id, wait(1100));
    lockTwirl = false;
    await toFab(id);
  }
  // ---- Fase 3.8: cutscene badai. Guide TIDAK bicara: ia terbang ke tengah layar lalu melebur jadi partikel cahaya dan lenyap ----
  var exitPhase = {};
  addEventListener('kaih-exit-phase', function (e) { var d = e.detail || {}; exitPhase[d.phase] = d; });
  function phaseWait(id, ph, max) {
    return new Promise(function (r) { var t0 = Date.now(); (function chk() { if (id !== runId || exitPhase[ph] || Date.now() - t0 > max) return r(); setTimeout(chk, 40); })(); });
  }
  async function seqExit(id) {
    seqActive = true; exitPhase = {}; closeMenu(); closeBubble(true);
    if (window.KaihGuideMap) window.KaihGuideMap.slideOutAll();
    var c = fabCenter(), tx = W * 0.5, ty = Math.max(Rpx * 1.7, H * 0.28);
    P.x = c.x; P.y = c.y; P.sc = 26 / Rpx; P.hov = 0; P.yaw = 0; P.flip = 0; P.roll = 0; P.jumpY = 0; P.sy = 1; P.talk = 0; P.vis = true;
    model.setAlpha(1); show3D(); setGesture('fly', 0); sfx.swoop();
    var s0 = P.sc, x0 = P.x, y0 = P.y;
    await Wt(id, tw(850, function (u) {                                            // keluar dari tombol FAB ke tengah layar
      var e = ease.out(u); P.x = x0 + (tx - x0) * e; P.y = y0 + (ty - y0) * e - Math.sin(Math.PI * u) * Rpx * 0.7; P.sc = s0 + (1 - s0) * e; P.yaw = Math.PI * 2 * e; P.hov = u;
    }, ease.lin));
    P.yaw = 0; P.hov = 1; P.sc = 1; setGesture('wave', 2);
    await Wt(id, phaseWait(id, 'dissolve', 6000));                                  // menunggu bundle memulai adegan
    // Guide melebur perlahan menjadi partikel cahaya (kuning-biru pastel) lalu lenyap
    var gx = P.x, gy = P.y, cols = [[1, 0.93, 0.66], [0.72, 0.84, 1], [1, 1, 1], [1, 0.86, 0.5]], acc = 0, lastT = performance.now();
    setGesture('spread', 3);
    await Wt(id, tw(2300, function (u) {
      var nowT = performance.now(), dt = Math.min(0.05, (nowT - lastT) / 1000); lastT = nowT;
      var e = ease.smooth(u); model.setAlpha(1 - e); P.sc = 1 + 0.12 * e; P.y = gy - Rpx * 0.35 * e; P.hov = 1;
      acc += dt * (30 + 140 * Math.sin(u * Math.PI));
      while (acc >= 1) { acc -= 1; var a = rnd(0, 6.283), r = rnd(0, Rpx * 0.9 * P.sc);
        spawn({ x: P.x + Math.cos(a) * r, y: P.y + Math.sin(a) * r, vx: rnd(-35, 35), vy: rnd(-150, -50), g: -25, drag: 0.8, ttl: rnd(1.1, 1.9), sz: rnd(9, 20), sh: 1, c: cols[(Math.random() * 4) | 0] }); }
    }, ease.lin));
    P.vis = false; model.root.visible = false; cape.mesh.visible = false; model.setAlpha(1); P.sc = 1; HTML.classList.add('kxg-off');
    seqActive = false;                                                              // menunggu 'kaih-ladang-arrive' -> seqLadang
  }
  var ladangRun = false, ballsSent = false;
  async function seqLadang(id, brief) {
    if (brief) { seqActive = false; ladangShown = true; ladangRun = true; ballsSent = true; showFab(false); return; }   // kedatangan sudah pernah diputar: tanpa Guide turun & dialog
    seqActive = true; ladangShown = true; ladangRun = true; closeBubble(true);
    await slideIn(id);                                                              // Guide turun lebih dulu lewat celah langit
    await Wt(id, wait(900));                                                        // biarkan cahaya langit mereda dulu agar animasi tetap bersih
    var L = LINES.ladang;
    await Wt(id, speak(id, L[0], { g: 'wave', gdur: 2.4 }));
    var first = !ballsSent; if (first) { ballsSent = true; dispatchEvent(new Event('kaih-ladang-balls')); }   // 7 bola jatuh dari langit (sekali saja)
    await Wt(id, speak(id, L[1], { g: 'spread', gdur: 2.8, hold: first ? wait(5500) : null }));
    await Wt(id, speak(id, L[2], { g: 'spread', gdur: 2.8 }));
    var f = fabCenter(); pointAt(f.x, f.y, 3.5);                                    // "pencet aku lagi" -> menunjuk ke pojok tempat FAB
    await Wt(id, speak(id, L[3]));
    await toFab(id);
  }
  G.play = function (world, o) {
    o = o || {};
    if (!ensure3D()) return Promise.resolve();
    return go(function (id) { return world === 'ladang' ? seqLadang(id, !!o.brief) : seqAwan(id, !!o.brief); });
  };
  G.replay = function () { return G.play(inLandscape() ? 'ladang' : 'awan'); };
  G.skipDialog = function () { return go(function (id) { return toFab(id); }); };       // lewati langsung (tanpa konfirmasi)
  G.askSkip = function () { askSkip(null); };
  G.twirl = function () {
    if (mode !== '3d' || twirling || lockTwirl) return;
    twirling = true; sfx.confetti(); flash = 0.28; setGesture('cheer', 1.1);
    confetti(P.x, P.y + P.jumpY, 42);
    var y0 = P.yaw;
    tw(620, function (u) { P.yaw = y0 + Math.PI * 2 * ease.io(u); P.sy = 1 + 0.06 * Math.sin(u * Math.PI); P.jumpY = -Math.sin(u * Math.PI) * Rpx * 0.4; }, ease.lin).then(function () { P.yaw = y0; P.sy = 1; P.jumpY = 0; twirling = false; });
  };
  G._map = function () { if (!ensure3D()) return Promise.resolve(); return go(function (id) { seqActive = true; P.x = W / 2; P.y = homePos().y; P.sc = 1; P.vis = true; show3D(); return seqMap(id); }); };   // hook uji: langsung ke cutscene peta
  G._set = function (o) { for (var k in o) if (k in P) P[k] = o[k]; };   // hook uji (tidak dipakai produksi)
  G._debug = function () {
    return { alive: partSys ? partSys.alive : 0, P: JSON.parse(JSON.stringify(P)), bubble: bubbleOn, text: sayText ? sayText.textContent : '', asking: asking, gest: gest.n, seqActive: seqActive,
      dlg: dlg ? { typing: dlg.typing, i: dlg.i, n: dlg.text.length, holding: dlg.holding } : null, runId: runId, tws: tws.length, arm: [arm[0].z, arm[1].z], leg: [leg[0].x, leg[1].x], look: [look.x, look.y], tour: HTML.classList.contains('kxg-tour') };
  };
  G.state = function () { return { mode: mode, ready: ready, landscape: inLandscape(), ladangShown: ladangShown, rtFail: rtFail }; };

  // ------------------------------------------------------------------ pengait ke dunia ------------------------------
  function suspended() {
    var b = document.body; if (!b) return true;
    var dl = $('kx-dlg'); if (dl && dl.classList.contains('on')) return true;
    if (inLandscape() && !ladangShown) return true;   // sebelum langit terbelah, Guide disembunyikan
    return false;
  }
  function briefFlag() { try { if (sessionStorage.getItem('kaih-guide-brief') === '1') { sessionStorage.removeItem('kaih-guide-brief'); return true; } } catch (e) {} return false; }

  addEventListener('kaih-ready', function () {
    if (inLandscape()) return;
    var brief = !!(window.KaihSeen && window.KaihSeen.has('tutorial')) || briefFlag();
    setTimeout(function () { G.play('awan', { brief: brief }); }, 700);
  });
  addEventListener('kaih-finale', function () { if (!ensure3D()) { cancelAll(); return; } go(seqExit); });
  function arriveLadang() { if (ladangRun) return; HTML.classList.remove('kxg-off'); ladangShown = true; G.play('ladang', { brief: !!window.__kaihLadangSeen }); }
  addEventListener('kaih-ladang-arrive', arriveLadang);
  addEventListener('kaih-ladang-skip', function () { if (ladangRun) return; arriveLadang(); });

  setInterval(function () {
    HTML.classList.toggle('kxg-nomap', inLandscape());
    HTML.classList.toggle('kxg-home', inLandscape() && !!document.body && document.body.classList.contains('intro-done'));
    if (cv) { var s = suspended(); HTML.classList.toggle('kxg-off', s); if (s) closeMenu(); }
  }, 350);

  // "Kembali ke Pulau Awan": setelah reload, cutscene yang sudah pernah diputar dilewati (lihat boot/seen.js) lalu PLAY ditekan otomatis
  (function autoAwan() {
    var flag = null; try { flag = sessionStorage.getItem('kaih-guide-goto'); } catch (e) {}
    if (flag !== 'awan') return;
    try { sessionStorage.removeItem('kaih-guide-goto'); } catch (e) {}
    var seen = !!(window.KaihSeen && window.KaihSeen.has('prelude'));
    if (seen) window.__kaihSkipIntro = window.KaihSeen.has('intro');
    var n = 0, iv = setInterval(function () {
      n++;
      var sp = $('kaih-splash');
      if (!seen && sp && typeof window.__kaihSkipPrelude === 'function' && $('play')) {   // prelude belum pernah diputar: perilaku lama
        clearInterval(iv); sp.click();
        setTimeout(function () { try { window.__kaihSkipPrelude(); } catch (e) {} waitPlay(); }, 350);
      } else if (seen && $('play') && window.__kaihMount) { clearInterval(iv); waitPlay(); }
      if (n > 100) clearInterval(iv);
    }, 100);
    function waitPlay() {
      var m = 0, iv2 = setInterval(function () {
        m++; var pl = $('play'), mn = $('menu');
        if (pl && mn && !mn.classList.contains('hide') && (seen || getComputedStyle(mn).display !== 'none')) { clearInterval(iv2); setTimeout(function () { pl.click(); }, 450); }
        if (m > 60) clearInterval(iv2);
      }, 150);
    }
  })();
})();
