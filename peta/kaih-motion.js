/* ============================================================================
   KAIH PETA — kaih-motion.js
   Pelengkap animasi halus (dimuat SETELAH script utama di index.html, memakai variabel global script utama).
   - Mode embed: dibuka sebagai iframe oleh file utama; masuk dimulai saat induk mengirim 'kaih-map-show'.
   - Zoom scroll yang diinterpolasi (tidak melompat), geser dengan inersia.
   - Render ulang panel data yang halus (hanya kartu grafik yang bertukar, bukan seluruh panel).
   - Pips / angka progres berdenyut saat bertambah.
   ========================================================================== */
(function () {
  'use strict';
  var html = document.documentElement, $ = function (id) { return document.getElementById(id); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- gerbang animasi masuk ---------- */
  var embed = html.classList.contains('embed');
  function run() { html.classList.remove('kx-pre'); html.classList.add('kx-run'); window.dispatchEvent(new CustomEvent('kaih-map-run')); }
  window.KaihMapMotion = { run: run, embed: embed };
  if (embed) {
    window.addEventListener('message', function (e) {
      var d = e.data || {};
      if (d.kaih === 'map-show') run();
    });
    setTimeout(function () { if (html.classList.contains('kx-pre')) run(); }, 12000);       // jaring pengaman
    try { parent.postMessage({ kaih: 'map-ready' }, '*'); } catch (err) {}
  } else {
    html.classList.remove('kx-pre');
    requestAnimationFrame(function () { requestAnimationFrame(run); });
  }

  /* ---------- zoom scroll halus (interpolasi menuju target) ---------- */
  var zt = null, zr = 0;
  function zoomLoop() {
    if (!zt) { zr = 0; return; }
    var diff = zt.s - state.scale;
    if (Math.abs(diff) < 0.0015) { zoomAt(zt.x, zt.y, zt.s, false); zt = null; zr = 0; return; }
    zoomAt(zt.x, zt.y, state.scale + diff * 0.2, false);
    zr = requestAnimationFrame(zoomLoop);
  }
  window.addEventListener('wheel', function (e) {
    if (!e.target.closest || !e.target.closest('#map-viewport')) return;
    e.preventDefault(); e.stopPropagation();
    stage.style.transition = 'none';
    var base = zt ? zt.s : state.scale;
    var next = Math.max(state.minScale, Math.min(state.maxScale, base * Math.exp(-e.deltaY * (e.deltaMode ? 0.05 : 0.0016))));
    if (reduce) { zoomAt(e.clientX, e.clientY, next, false); return; }
    zt = { x: e.clientX, y: e.clientY, s: next };
    if (!zr) zr = requestAnimationFrame(zoomLoop);
  }, { capture: true, passive: false });

  /* ---------- geser dengan inersia ---------- */
  var hist = [], glide = 0;
  window.addEventListener('pointerdown', function () { cancelAnimationFrame(glide); hist.length = 0; }, true);
  window.addEventListener('pointermove', function (e) {
    if (!state.isDragging || !state.hasMoved || e.pointerType === 'mouse' && e.buttons === 0) return;
    hist.push({ x: state.x, y: state.y, t: performance.now() }); if (hist.length > 5) hist.shift();
  }, true);
  window.addEventListener('pointerup', function (e) {
    if (reduce || !state.hasMoved || hist.length < 2) { hist.length = 0; return; }
    var a = hist[0], b = hist[hist.length - 1], dt = b.t - a.t;
    if (dt <= 0 || performance.now() - b.t > 90) { hist.length = 0; return; }
    var vx = (b.x - a.x) / dt, vy = (b.y - a.y) / dt, last = performance.now();    // px per ms
    hist.length = 0;
    if (Math.hypot(vx, vy) < 0.12) return;
    stage.style.transition = 'none';
    (function step(now) {
      var dtf = Math.min(32, now - last); last = now;
      state.x += vx * dtf; state.y += vy * dtf; applyTransform(false);
      var k = Math.pow(0.0035, dtf / 1000); vx *= k; vy *= k;            // peluruhan halus
      if (Math.hypot(vx, vy) > 0.02 && !state.isDragging) glide = requestAnimationFrame(step);
    })(last);
  }, false);

  /* ---------- panel data: ganti isi tanpa membangun ulang seluruh panel ---------- */
  var baseRender = renderModal;
  renderModal = function () {
    var body = $('dm-body'), oldPcard = body.querySelector('.pcard');
    if (!oldPcard || body.dataset.loc !== ui.id || reduce) { baseRender(); body.dataset.loc = ui.id; return; }
    var old = Array.prototype.slice.call(body.childNodes);
    baseRender();                                                      // isi baru sementara di body
    var nSeg = body.querySelector('.seg'), nFsel = body.querySelector('.fsel'), nPcard = body.querySelector('.pcard');
    while (body.firstChild) body.removeChild(body.firstChild);
    old.forEach(function (n) { body.appendChild(n); });                // kembalikan node lama (animasi CSS tetap berjalan)
    var oSeg = body.querySelector('.seg'), oFsel = body.querySelector('.fsel');
    // tab
    [].forEach.call(oSeg.querySelectorAll('.seg-b'), function (b) { var m = nSeg.querySelector('[data-tab="' + b.dataset.tab + '"]'); b.classList.toggle('on', !!m && m.classList.contains('on')); });
    // pilihan F1-F4
    if (oFsel && nFsel) { [].forEach.call(oFsel.querySelectorAll('.pill'), function (b) { var m = nFsel.querySelector('[data-f="' + b.dataset.f + '"]'); b.classList.toggle('on', !!m && m.classList.contains('on')); }); }
    else if (oFsel && !nFsel) { var f = oFsel; f.style.overflow = 'hidden'; f.animate([{ opacity: 1, maxHeight: f.offsetHeight + 'px', marginBottom: '12px' }, { opacity: 0, maxHeight: '0px', marginBottom: '0px' }], { duration: 260, easing: 'ease', fill: 'forwards' }).onfinish = function () { f.remove(); }; }
    else if (!oFsel && nFsel) { nFsel.style.animation = 'kxFade .4s ease backwards'; oSeg.parentNode.insertBefore(nFsel, oSeg.nextSibling); }
    // kartu grafik: pudar -> ganti -> muncul
    var pc = body.querySelector('.pcard'); if (!pc) return;
    pc.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(6px)' }], { duration: 140, easing: 'ease-in', fill: 'forwards' }).onfinish = function () {
      pc.innerHTML = nPcard.innerHTML;
      pc.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
      pc.getAnimations().forEach(function (a) { if (a.effect && a.effect.getComputedTiming().fill === 'forwards') a.cancel(); });
    };
  };

  /* ---------- progres: pips & angka ---------- */
  var lastN = visited.size, baseUpdate = updateUI;
  updateUI = function () {
    baseUpdate();
    var n = visited.size;
    if (n > lastN) {
      var pips = $('pips').children; if (pips[n - 1]) pips[n - 1].classList.add('fresh');
      var b = $('progress-text'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
    }
    lastN = n;
  };
  html.dataset.kxMotion = '1';
})();
