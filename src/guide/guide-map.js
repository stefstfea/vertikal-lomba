/* ============================================================================
 * PETA GUIDE — elemen peta (PNG), ledakan cahaya prismatik, spotlight        [Fase 3.2]
 * Dipakai oleh guide.js pada cutscene Pulau Awan:
 *   Guide mendekat -> merogoh ke belakang -> mengeluarkan peta (stretch ease in/out + ledakan cahaya prismatik)
 *   -> Guide mengangkat & membawa peta -> meletakkannya di pojok kiri bawah (menggantikan menu 7 komponen).
 * Modul ini hanya mengurus tampilan (DOM + canvas 2D). Koreografi ada di guide.js.
 * Gambar peta: assets/img/peta.png (PNG transparan; ganti file ini untuk memakai gambar lain, rasio otomatis).
 * ========================================================================== */
(function () {
  'use strict';
  if (/[?&]noguide\b/.test(location.search)) return;

  var HTML = document.documentElement;
  var SRC = 'assets/img/peta.png', DOORSRC = 'assets/img/pintu.png', HOMESRC = 'assets/img/pulau-awan.png';
  var BASEW = 640;                               // lebar dasar elemen (px CSS); ukuran tampil diatur lewat transform scale
  var Z = 2147481500;                            // sama dengan canvas Guide; urutan: dim < fx < guide < peta < flash
  var M = {};
  var door, home, homeDlg, doorOn = false, doorT = 0, wrap, img, dimEl, fxCv, fxCtx, flashEl, btn, ar = 0.8167, built = false;
  var pose = { cx: 0, cy: 0, w: 200, sx: 1, sy: 1, rot: 0, a: 1 };
  var resting = false, fxList = [], fxRaf = 0, fxLast = 0, fxDpr = 1, W = innerWidth, H = innerHeight;
  var pulseT = 0;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function css() {
    var st = document.createElement('style'); st.id = 'kx-map-css';
    st.textContent =
      'html.kxg-off #kx-map,html.kxg-off #kx-door,html.kxg-off #kx-home,html.kxg-nomap #kx-door,html.kxg-off #kx-map-fx,html.kxg-off #kx-map-dim,html.kxg-off #kx-map-flash,html.kxg-nomap #kx-map{display:none!important}' +
      '#kx-map-dim{position:fixed;inset:0;z-index:' + (Z - 200) + ';pointer-events:none;opacity:0;transition:opacity .55s ease;' +
      'background:radial-gradient(ellipse at 50% 46%,rgba(18,14,40,.18) 0%,rgba(10,8,28,.62) 70%,rgba(4,3,14,.82) 100%)}' +
      '#kx-map-dim.on{opacity:1}' +
      '#kx-map-fx{position:fixed;left:0;top:0;width:100%;height:100%;z-index:' + (Z - 100) + ';pointer-events:none;display:none}#kx-map-fx.on{display:block}' +
      '#kx-map-flash{position:fixed;inset:0;z-index:' + (Z + 400) + ';pointer-events:none;opacity:0;background:radial-gradient(circle at var(--fx,50%) var(--fy,40%),#fff 0%,rgba(255,255,255,.85) 25%,rgba(255,255,255,0) 70%)}' +
      '#kx-map{position:fixed;left:0;top:0;width:' + BASEW + 'px;z-index:' + (Z + 60) + ';margin:0;padding:0;border:0;background:transparent;display:none;transform-origin:50% 50%;will-change:transform;' +
      'cursor:default;pointer-events:none;-webkit-tap-highlight-color:transparent;touch-action:manipulation;outline:none}' +
      '#kx-map.on{display:block}#kx-map.rest{pointer-events:auto;cursor:pointer}' +
      '#kx-map img{display:block;width:100%;height:auto;user-select:none;-webkit-user-drag:none;pointer-events:none;' +
      'filter:drop-shadow(0 10px 14px rgba(0,0,0,.45)) drop-shadow(0 0 var(--glow,0px) rgba(255,236,190,.95))}' +
      // kilau holografik yang menyapu peta (dipotong mengikuti siluet PNG)
      '#kx-map .km-sheen{position:absolute;inset:0;pointer-events:none;mix-blend-mode:screen;opacity:var(--sheen,0);' +
      '-webkit-mask:url(' + SRC + ') center/100% 100% no-repeat;mask:url(' + SRC + ') center/100% 100% no-repeat;' +
      'background:linear-gradient(105deg,transparent 30%,rgba(255,90,140,.55) 40%,rgba(255,220,90,.6) 46%,rgba(90,255,170,.55) 52%,rgba(90,170,255,.6) 58%,rgba(190,110,255,.5) 64%,transparent 74%);' +
      'background-size:300% 100%;background-position:var(--sx,150%) 0}' +
      '#kx-map.rest:hover img{--glow:14px}#kx-map.rest:active{filter:brightness(1.08)}' +
      '#kx-map.idle img{animation:kxmapfl 3.4s ease-in-out infinite}' +
      '@keyframes kxmapfl{50%{transform:translateY(-4%) rotate(-1.2deg)}}' +
      // tombol pintu (Fase 3.6: membuka dialog "apakah kamu ingin ke ladang langit?"); tombol lama disembunyikan tapi tetap ada di DOM
      '#kx-btn{display:none!important}' +
      '#kx-door{position:fixed;right:max(14px,env(safe-area-inset-right));bottom:calc(env(safe-area-inset-bottom) + 22px);width:clamp(92px,min(22vw,22vh),150px);z-index:' + (Z + 60) + ';margin:0;padding:0;border:0;background:transparent;display:none;' +
      'cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;outline:none;transform-origin:50% 100%}' +
      '#kx-door img{display:block;width:100%;height:auto;pointer-events:none;user-select:none;-webkit-user-drag:none;filter:drop-shadow(0 10px 14px rgba(0,0,0,.45));transition:filter .2s}' +
      '#kx-door.on{display:block;animation:kxdpop .62s cubic-bezier(.34,1.56,.64,1) both}' +
      '#kx-door.idle{animation:kxdfl 3s ease-in-out infinite}' +
      '#kx-door.out{display:block;pointer-events:none;animation:kxdout .46s cubic-bezier(.5,0,.9,.4) both}' +
      '#kx-door:hover img{filter:drop-shadow(0 10px 14px rgba(0,0,0,.45)) drop-shadow(0 0 14px rgba(255,236,190,.95))}#kx-door:active{transform:scale(.94)}' +
      '@keyframes kxdpop{0%{transform:scale(0) rotate(-12deg);opacity:0}60%{transform:scale(1.18) rotate(4deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}' +
      '@keyframes kxdfl{50%{transform:translateY(-4%)}}' +
      '@keyframes kxdout{from{transform:translateY(0);opacity:1}to{transform:translateY(160%);opacity:0}}' +
      // holy aura: glow kuning bundar samar-samar di belakang gambar ikon (peta, pintu, pulau awan)
      '#kx-map,#kx-door,#kx-home{isolation:isolate}' +
      '#kx-map::before,#kx-door::before,#kx-home::before{content:"";position:absolute;inset:-16%;z-index:-1;border-radius:50%;pointer-events:none;' +
      'background:radial-gradient(circle at 50% 50%,rgba(255,232,140,.52) 0%,rgba(255,216,96,.3) 34%,rgba(255,200,70,.12) 56%,rgba(255,200,70,0) 72%);filter:blur(5px);animation:kxaura 3.8s ease-in-out infinite}' +
      '#kx-door::before{inset:-22%}#kx-home::before{inset:-20%}' +
      '@keyframes kxaura{0%,100%{opacity:.7;transform:scale(.96)}50%{opacity:1;transform:scale(1.06)}}' +
      // tombol kembali ke Pulau Awan (hanya di Ladang Langit)
      '#kx-home{position:fixed;right:max(14px,env(safe-area-inset-right));top:max(14px,env(safe-area-inset-top));width:clamp(64px,min(12vw,12vh),92px);z-index:' + (Z + 60) + ';margin:0;padding:0;border:0;background:transparent;display:none;' +
      'cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;outline:none;transform-origin:50% 50%}' +
      '#kx-home img{display:block;width:100%;height:auto;pointer-events:none;user-select:none;-webkit-user-drag:none;filter:drop-shadow(0 8px 12px rgba(0,0,0,.4));transition:filter .2s}' +
      'html.kxg-home:not(.kxg-off) #kx-home{display:block;animation:kxdpop .62s cubic-bezier(.34,1.56,.64,1) both,kxdfl 3.4s ease-in-out .7s infinite}' +
      '#kx-home:hover img{filter:drop-shadow(0 8px 12px rgba(0,0,0,.4)) drop-shadow(0 0 14px rgba(255,236,190,.95))}#kx-home:active{transform:scale(.94)}';
    st.textContent +=
      '#kx-home-confirm{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:22px;background:rgba(24,35,48,.48);backdrop-filter:blur(0);-webkit-backdrop-filter:blur(0);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .25s,backdrop-filter .25s,visibility 0s .25s;font-family:"Plus Jakarta Sans",system-ui,sans-serif}' +
      '#kx-home-confirm.on{opacity:1;visibility:visible;pointer-events:auto;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);transition:opacity .25s,backdrop-filter .25s}' +
      '#kx-home-confirm .khc-card{width:min(390px,100%);padding:26px 24px 22px;text-align:center;color:#354253;background:linear-gradient(160deg,rgba(255,253,245,.98),rgba(239,232,211,.98));border:1px solid rgba(181,145,82,.65);border-radius:14px;box-shadow:0 18px 54px rgba(13,28,48,.32),inset 0 0 0 3px rgba(255,255,255,.55);transform:translateY(12px) scale(.97);transition:transform .28s cubic-bezier(.2,.8,.2,1)}' +
      '#kx-home-confirm.on .khc-card{transform:none}' +
      '#kx-home-confirm h2{margin:0 0 9px;color:#8b682e;font:700 clamp(21px,5vw,25px)/1.3 "Plus Jakarta Sans",system-ui,sans-serif;letter-spacing:.01em;text-transform:none;transform:none;animation:none}' +
      '#kx-home-confirm p{margin:0 0 22px;color:#536171;font:400 14px/1.6 "Plus Jakarta Sans",system-ui,sans-serif;letter-spacing:0}' +
      '#kx-home-confirm .khc-actions{display:flex;gap:10px}' +
      '#kx-home-confirm button{flex:1;min-height:46px;padding:9px 12px;border-radius:8px;border:1px solid #b99a61;font:700 13px "Plus Jakarta Sans",system-ui,sans-serif;letter-spacing:.02em;cursor:pointer}' +
      '#kx-home-confirm .khc-cancel{background:#fffdf7;color:#596575}' +
      '#kx-home-confirm .khc-yes{background:linear-gradient(180deg,#e8d3a2,#c6a66a);color:#3f3422;border-color:#a8874d;box-shadow:0 3px 0 #a8874d}' +
      '#kx-home-confirm button:active{transform:translateY(2px)}' +
      '@media(max-width:420px){#kx-home-confirm .khc-card{padding:23px 18px 19px}#kx-home-confirm .khc-actions{gap:8px}}';
    document.head.appendChild(st);
  }

  function build() {
    if (built) return; built = true;
    css();
    dimEl = document.createElement('div'); dimEl.id = 'kx-map-dim';
    fxCv = document.createElement('canvas'); fxCv.id = 'kx-map-fx';
    flashEl = document.createElement('div'); flashEl.id = 'kx-map-flash';
    btn = document.createElement('button'); btn.id = 'kx-map'; btn.type = 'button'; btn.setAttribute('aria-label', 'Peta');
    img = document.createElement('img'); img.alt = ''; img.draggable = false; img.decoding = 'async'; img.src = SRC;
    img.addEventListener('load', function () { if (img.naturalWidth) { ar = img.naturalHeight / img.naturalWidth; apply(); } });
    var sheen = document.createElement('div'); sheen.className = 'km-sheen';
    btn.appendChild(img); btn.appendChild(sheen);
    door = document.createElement('button'); door.id = 'kx-door'; door.type = 'button'; door.setAttribute('aria-label', 'Pergi ke Ladang Langit');
    var di = document.createElement('img'); di.alt = ''; di.draggable = false; di.decoding = 'async'; di.src = DOORSRC; door.appendChild(di);
    door.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    door.addEventListener('click', function (e) {                          // membuka dialog konfirmasi
      e.stopPropagation();
      var b = document.getElementById('kx-btn'); if (b) b.click();
      try { window.dispatchEvent(new CustomEvent('kaih-door-click')); } catch (err) {}
    });
    home = document.createElement('button'); home.id = 'kx-home'; home.type = 'button'; home.setAttribute('aria-label', 'Kembali ke Pulau Awan'); home.title = 'Kembali ke Pulau Awan';
    var hi = document.createElement('img'); hi.alt = ''; hi.draggable = false; hi.decoding = 'async'; hi.src = HOMESRC; home.appendChild(hi);
    home.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    home.addEventListener('click', function (e) { e.stopPropagation(); if (homeDlg) homeDlg.classList.add('on'); });
    homeDlg = document.createElement('div'); homeDlg.id = 'kx-home-confirm'; homeDlg.setAttribute('role', 'dialog'); homeDlg.setAttribute('aria-modal', 'true'); homeDlg.setAttribute('aria-labelledby', 'kx-home-q');
    homeDlg.innerHTML = '<div class="khc-card"><h2 id="kx-home-q">Apakah kamu yakin?</h2><p>Kembali ke Pulau Awan? Kamu akan meninggalkan Ladang Langit saat ini.</p><div class="khc-actions"><button type="button" class="khc-cancel">Tetap di sini</button><button type="button" class="khc-yes">Ya, kembali</button></div></div>';
    homeDlg.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    homeDlg.addEventListener('click', function (e) {
      if (e.target === homeDlg || e.target.closest('.khc-cancel')) { homeDlg.classList.remove('on'); return; }
      if (e.target.closest('.khc-yes')) { homeDlg.classList.remove('on'); try { window.dispatchEvent(new CustomEvent('kaih-home-confirm')); } catch (err) {} }
    });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && homeDlg) homeDlg.classList.remove('on'); });
    [dimEl, fxCv, btn, door, home, flashEl, homeDlg].forEach(function (e) { HTML.appendChild(e); });
    fxCtx = fxCv.getContext('2d');
    btn.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      M.pulse();
      try { window.dispatchEvent(new CustomEvent('kaih-map-click')); } catch (err) {}
    });
    addEventListener('resize', function () { W = innerWidth; H = innerHeight; sizeFx(); if (resting) M.restNow(); });
    sizeFx();
  }

  function sizeFx() {
    if (!fxCv) return;
    W = innerWidth; H = innerHeight; fxDpr = Math.min(window.devicePixelRatio || 1, 2);
    fxCv.width = Math.round(W * fxDpr); fxCv.height = Math.round(H * fxDpr);
  }

  // ---------------------------------------------------------------- pose peta ------------------------------------------
  function apply() {
    if (!btn) return;
    var k = pose.w / BASEW, hh = BASEW * ar;
    btn.style.opacity = pose.a;
    btn.style.transform = 'translate3d(' + (pose.cx - BASEW / 2).toFixed(1) + 'px,' + (pose.cy - hh / 2).toFixed(1) + 'px,0) rotate(' + pose.rot.toFixed(4) + 'rad) scale(' + (k * pose.sx).toFixed(4) + ',' + (k * pose.sy).toFixed(4) + ')';
  }
  M.aspect = function () { return ar; };
  M.setPose = function (cx, cy, w, sx, sy, rot, a) {
    build();
    pose.cx = cx; pose.cy = cy; pose.w = w; pose.sx = sx == null ? 1 : sx; pose.sy = sy == null ? 1 : sy; pose.rot = rot || 0; pose.a = a == null ? 1 : a;
    btn.classList.add('on'); apply();
  };
  M.setVar = function (name, v) { if (btn) btn.style.setProperty(name, v); };
  M.hide = function () { if (!btn) return; btn.classList.remove('on', 'rest', 'idle'); resting = false; };
  M.isResting = function () { return resting; };

  // posisi & ukuran diam (pojok kiri bawah)
  M.restRect = function () {
    var w = clamp(Math.min(innerWidth, innerHeight) * 0.24, 104, 180), h = w * ar, m = 14;
    return { w: w, h: h, cx: m + w / 2, cy: innerHeight - m - 8 - h / 2 };
  };
  M.restNow = function (pop) {
    build();
    var r = M.restRect();
    M.setPose(r.cx, r.cy, r.w, 1, 1, -0.05, 1);
    btn.classList.add('on', 'rest', 'idle'); resting = true;
    btn.style.setProperty('--sheen', '0');
    if (pop) M.pulse();
  };
  M.pulse = function () {
    if (!btn || !resting) return;
    var r = M.restRect(), t0 = performance.now(), id = ++pulseT;
    (function f(now) {
      if (id !== pulseT || !resting) return;
      var u = clamp((now - t0) / 520, 0, 1), s = 1 + 0.16 * Math.sin(u * Math.PI) * (1 - u * 0.4);
      pose.sx = pose.sy = s; pose.rot = -0.05 + Math.sin(u * Math.PI * 2) * 0.05 * (1 - u); apply();
      if (u < 1) requestAnimationFrame(f); else { pose.sx = pose.sy = 1; pose.rot = -0.05; apply(); }
    })(t0);
    M.sparkle(r.cx, r.cy, 14, 0.55);
  };
  M.sheen = function (dur) {                 // kilau holografik menyapu peta sekali
    if (!btn) return; var t0 = performance.now();
    btn.style.setProperty('--sheen', '1');
    (function f(now) {
      var u = clamp((now - t0) / (dur || 900), 0, 1);
      btn.style.setProperty('--sx', (150 - 200 * u).toFixed(1) + '%');
      btn.style.setProperty('--sheen', String(Math.sin(u * Math.PI)));
      if (u < 1) requestAnimationFrame(f); else btn.style.setProperty('--sheen', '0');
    })(t0);
  };
  M.glow = function (px) { if (btn) btn.style.setProperty('--glow', px + 'px'); };

  M.dim = function (on) { build(); dimEl.classList.toggle('on', !!on); };
  M.flash = function (x, y, peak, ms) {
    build(); ms = ms || 520;
    flashEl.style.setProperty('--fx', (x / innerWidth * 100).toFixed(1) + '%'); flashEl.style.setProperty('--fy', (y / innerHeight * 100).toFixed(1) + '%');
    flashEl.animate([{ opacity: 0 }, { opacity: peak == null ? 0.9 : peak, offset: 0.12 }, { opacity: 0 }], { duration: ms, easing: 'ease-out' });
  };

  // ---------------------------------------------------------------- FX prismatik (canvas 2D) ------------------------------
  function hsl(h, s, l, a) { return 'hsla(' + (((h % 360) + 360) % 360).toFixed(0) + ',' + s + '%,' + l + '%,' + a.toFixed(3) + ')'; }
  function easeOutExpo(u) { return u >= 1 ? 1 : 1 - Math.pow(2, -10 * u); }

  // ledakan cahaya: berkas sinar pelangi berputar + cincin kejut pelangi + bloom (aberasi kromatik) + kilau bintang
  M.burst = function (cx, cy, o) {
    build(); o = o || {};
    var size = o.size || Math.max(innerWidth, innerHeight) * 0.9, dur = o.dur || 2.2;
    var rays = [], n = o.rays || 30, i;
    for (i = 0; i < n; i++) rays.push({ a: (i / n) * Math.PI * 2 + rnd(-0.05, 0.05), w: rnd(0.035, 0.1) * (i % 2 ? 0.6 : 1), l: rnd(0.55, 1), hue: (i / n) * 360, sp: rnd(0.8, 1.2) });
    var stars = [], ns = o.stars || 46;
    for (i = 0; i < ns; i++) { var a = rnd(0, 6.283), s = rnd(0.25, 1.1) * size * 0.7; stars.push({ a: a, v: s, hue: rnd(0, 360), sz: rnd(7, 20), ph: rnd(0, 6.28), life: rnd(0.55, 1) }); }
    fxList.push({ cx: cx, cy: cy, t: 0, dur: dur, size: size, rays: rays, stars: stars, spin: rnd(-1, 1) > 0 ? 1 : -1 });
    fxCv.classList.add('on'); fxStart();
  };
  // percikan kecil (dipakai saat peta diletakkan / diklik)
  M.sparkle = function (cx, cy, n, dur) {
    build(); var stars = [], i;
    for (i = 0; i < n; i++) { var a = rnd(0, 6.283), s = rnd(40, 150); stars.push({ a: a, v: s, hue: rnd(0, 360), sz: rnd(6, 13), ph: rnd(0, 6.28), life: rnd(0.6, 1) }); }
    fxList.push({ cx: cx, cy: cy, t: 0, dur: dur || 0.7, size: 160, rays: [], stars: stars, mini: true, spin: 1 });
    fxCv.classList.add('on'); fxStart();
  };
  M.clearFx = function () { fxList.length = 0; if (fxCtx) fxCtx.clearRect(0, 0, fxCv.width, fxCv.height); if (fxCv) fxCv.classList.remove('on'); };
  function fxStart() { if (!fxRaf) { fxLast = performance.now(); fxRaf = requestAnimationFrame(fxTick); } }
  function fxTick(now) {
    fxRaf = 0;
    var dt = Math.min(0.05, (now - fxLast) / 1000); fxLast = now;
    var c = fxCtx; c.setTransform(fxDpr, 0, 0, fxDpr, 0, 0); c.clearRect(0, 0, W, H);
    c.globalCompositeOperation = 'lighter';
    for (var k = fxList.length - 1; k >= 0; k--) {
      var f = fxList[k]; f.t += dt;
      if (f.t >= f.dur) { fxList.splice(k, 1); continue; }
      drawFx(c, f);
    }
    c.globalCompositeOperation = 'source-over';
    if (fxList.length) fxRaf = requestAnimationFrame(fxTick); else fxCv.classList.remove('on');
  }
  function star(c, x, y, r, hue, a) {
    var g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,' + a.toFixed(3) + ')'); g.addColorStop(0.35, hsl(hue, 100, 70, a * 0.7)); g.addColorStop(1, hsl(hue, 100, 60, 0));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill();
    c.fillStyle = 'rgba(255,255,255,' + (a * 0.9).toFixed(3) + ')';                      // kilau 4 sudut
    c.beginPath(); c.moveTo(x - r * 1.8, y); c.lineTo(x, y - r * 0.16); c.lineTo(x + r * 1.8, y); c.lineTo(x, y + r * 0.16); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(x, y - r * 1.8); c.lineTo(x + r * 0.16, y); c.lineTo(x, y + r * 1.8); c.lineTo(x - r * 0.16, y); c.closePath(); c.fill();
  }
  function drawFx(c, f) {
    var u = f.t / f.dur, cx = f.cx, cy = f.cy, S = f.size, env = Math.pow(1 - u, 1.6), grow = easeOutExpo(clamp(f.t / 0.38, 0, 1)), i;
    if (!f.mini) {
      // 1. bloom pusat putih-panas dengan aberasi kromatik (R, G, B bergeser keluar)
      var br = S * (0.12 + 0.28 * grow), ab = S * 0.05 * grow, ba = Math.pow(1 - clamp(f.t / 0.9, 0, 1), 1.4);
      [[255, 40, 70, -1], [60, 255, 120, 0], [70, 120, 255, 1]].forEach(function (ch) {
        var g = c.createRadialGradient(cx + ch[3] * ab, cy, 0, cx + ch[3] * ab, cy, br);
        g.addColorStop(0, 'rgba(' + ch[0] + ',' + ch[1] + ',' + ch[2] + ',' + (0.75 * ba).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + ch[0] + ',' + ch[1] + ',' + ch[2] + ',0)');
        c.fillStyle = g; c.beginPath(); c.arc(cx + ch[3] * ab, cy, br, 0, 6.283); c.fill();
      });
      var wg = c.createRadialGradient(cx, cy, 0, cx, cy, br * 0.8);
      wg.addColorStop(0, 'rgba(255,255,255,' + (0.95 * ba).toFixed(3) + ')'); wg.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = wg; c.beginPath(); c.arc(cx, cy, br * 0.8, 0, 6.283); c.fill();
      // 2. berkas sinar pelangi (memanjang cepat, lalu memudar sambil berputar pelan)
      for (i = 0; i < f.rays.length; i++) {
        var r = f.rays[i], L = S * r.l * grow * (1 + 0.12 * Math.sin(f.t * 5 + i)), ang = r.a + f.spin * f.t * 0.22 * r.sp, hw = r.w * (1 - 0.5 * u);
        var hue = r.hue + f.t * 140;
        var g2 = c.createRadialGradient(cx, cy, 0, cx, cy, L);
        g2.addColorStop(0, hsl(hue, 100, 82, 0.95 * env)); g2.addColorStop(0.35, hsl(hue, 100, 65, 0.55 * env)); g2.addColorStop(1, hsl(hue + 40, 100, 60, 0));
        c.fillStyle = g2; c.beginPath(); c.moveTo(cx, cy);
        c.lineTo(cx + Math.cos(ang - hw) * L, cy + Math.sin(ang - hw) * L); c.lineTo(cx + Math.cos(ang + hw) * L, cy + Math.sin(ang + hw) * L); c.closePath(); c.fill();
      }
      // 3. dua cincin kejut pelangi
      for (i = 0; i < 2; i++) {
        var d = i * 0.12, uu = clamp((f.t - d) / (f.dur * 0.55), 0, 1); if (uu <= 0 || uu >= 1) continue;
        var rr = S * 0.9 * easeOutExpo(uu) + 8, al = Math.pow(1 - uu, 1.5), lw = (22 - i * 10) * (1 - uu) + 2;
        c.lineWidth = lw;
        if (c.createConicGradient) {
          var cg = c.createConicGradient(f.t * 2 * (i ? -1 : 1), cx, cy), st;
          for (st = 0; st <= 6; st++) cg.addColorStop(st / 6, hsl(st * 60, 100, 68, 0.9 * al));
          c.strokeStyle = cg;
        } else c.strokeStyle = 'rgba(255,255,255,' + (0.8 * al).toFixed(3) + ')';
        c.beginPath(); c.arc(cx, cy, rr, 0, 6.283); c.stroke();
      }
    }
    // 4. bintang-bintang kilau pelangi
    var travel = easeOutExpo(clamp(f.t / (f.mini ? 0.5 : 0.9), 0, 1));
    for (i = 0; i < f.stars.length; i++) {
      var s = f.stars[i], lu = clamp(u / s.life, 0, 1); if (lu >= 1) continue;
      var x = cx + Math.cos(s.a) * s.v * travel, y = cy + Math.sin(s.a) * s.v * travel + 30 * f.t * f.t;
      var tw = 0.55 + 0.45 * Math.sin(f.t * 14 + s.ph), a = Math.pow(1 - lu, 1.3) * tw;
      star(c, x, y, s.sz * (0.6 + 0.6 * (1 - lu)), s.hue + f.t * 200, a);
    }
  }

  // ---------------------------------------------------------------- pop up / slide down ------------------------------------
  function backOut(u) { var c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); }
  M.popIn = function () {                    // peta muncul dengan animasi pop up di pojok kiri bawah
    build(); var r = M.restRect(), t0 = performance.now(), id = ++pulseT;
    M.setPose(r.cx, r.cy, r.w, 0.001, 0.001, -0.05, 1); btn.classList.add('on', 'rest'); btn.classList.remove('idle'); resting = true;
    (function f(now) {
      if (id !== pulseT) return;
      var u = clamp((now - t0) / 620, 0, 1), k = Math.max(0.001, backOut(u));
      pose.sx = pose.sy = k; pose.rot = -0.05 + (1 - u) * -0.25; apply();
      if (u < 1) requestAnimationFrame(f); else { pose.sx = pose.sy = 1; pose.rot = -0.05; apply(); btn.classList.add('idle'); }
    })(t0);
    M.sparkle(r.cx, r.cy, 16, 0.7);
  };
  M.slideOut = function () {                 // peta meluncur ke bawah lalu hilang
    if (!btn || !btn.classList.contains('on')) return Promise.resolve();
    var id = ++pulseT, t0 = performance.now(), cy0 = pose.cy, dy = innerHeight - cy0 + pose.w * ar;
    resting = false; btn.classList.remove('rest', 'idle');
    return new Promise(function (res) {
      (function f(now) {
        if (id !== pulseT) return res();
        var u = clamp((now - t0) / 460, 0, 1), e = u * u * u;
        pose.cy = cy0 + dy * e; pose.sx = pose.sy = 1 - 0.1 * u; apply();
        if (u < 1) requestAnimationFrame(f); else { btn.classList.remove('on'); pose.sx = pose.sy = 1; res(); }
      })(t0);
    });
  };
  M.doorShown = function () { return doorOn; };
  M.doorPop = function (quiet) {
    build(); clearTimeout(doorT); doorOn = true;
    if (quiet) { door.classList.remove('out'); door.classList.add('on', 'idle'); return; }   // muncul langsung tanpa animasi pop
    door.classList.remove('out', 'idle'); door.classList.remove('on'); void door.offsetWidth; door.classList.add('on');
    doorT = setTimeout(function () { if (doorOn) door.classList.add('idle'); }, 680);
    var r = door.getBoundingClientRect(); M.sparkle(r.left + r.width / 2, r.top + r.height / 2, 14, 0.7);
  };
  M.doorOut = function () {
    if (!door || !doorOn) return; doorOn = false; clearTimeout(doorT);
    door.classList.remove('on', 'idle'); door.classList.add('out');
    doorT = setTimeout(function () { if (!doorOn) door.classList.remove('out'); }, 480);
  };
  M.slideOutAll = function () { build(); M.clearFx(); M.dim(false); M.doorOut(); return M.slideOut(); };

  // ---------------------------------------------------------------- reset total ------------------------------------------
  M.reset = function () { if (!built) return; M.hide(); doorOn = false; clearTimeout(doorT); door.classList.remove('on', 'idle', 'out'); M.clearFx(); dimEl.classList.remove('on'); pulseT++; };
  M.preload = function () { build(); };

  window.KaihGuideMap = M;
  build();                                         // siapkan CSS (tombol lama disembunyikan) + preload gambar sejak awal
})();
