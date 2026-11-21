/* ============================================================================
   MUSIK DASHBOARD PETA                                                    [Fase 4.1]
   File: assets/audio/map-music.mp3 ("A Map of Small Wonders"). Kategori: MUSIK (slider Musik di Settings).
   - Mulai saat tombol peta ditekan (event 'kaih-map-opening' dari map-doorway.js), fade-in halus.
   - Berhenti (fade-out) saat dashboard peta ditutup ('kaih-map-closing'). Tidak pernah diputar di luar dashboard peta.
   - Musik Pulau Awan dijeda selama dashboard terbuka, lalu dilanjutkan saat kembali (kaihPauseWorldMusic / kaihResumeWorldMusic).
   - Memakai elemen <audio> biasa: settings.js sudah mengalikan volume elemen dengan nilai slider Musik secara otomatis.
   API: KaihMapMusic.start() / .stop() / .playing()
   ========================================================================== */
(function () {
  'use strict';
  var SRC = 'assets/audio/map-music.mp3', VOL = 0.7, FADE_IN = 2200, FADE_OUT = 1400;
  var el = null, raf = 0, on = false;

  function ensure() {
    if (el) return el;
    el = new Audio(SRC);
    el.loop = true; el.preload = 'auto'; el.volume = 0;
    return el;
  }
  function fade(to, ms, done) {
    cancelAnimationFrame(raf);
    var a = ensure(), from = a.volume, t0 = performance.now();
    (function step(now) {
      var k = Math.min(1, (now - t0) / Math.max(1, ms));
      // a.volume yang diset dikalikan slider Musik oleh settings.js (nilai asli dibaca balik utuh)
      try { a.volume = Math.max(0, Math.min(1, from + (to - from) * k)); } catch (e) {}
      if (k < 1) raf = requestAnimationFrame(step); else if (done) done();
    })(t0);
  }
  function start() {
    if (on) return; on = true;
    var a = ensure();
    try { a.currentTime = 0; } catch (e) {}
    var p = a.play();
    if (p && p.catch) p.catch(function () {          // autoplay ditolak: coba lagi pada ketukan berikutnya
      var retry = function () { if (on && a.paused) a.play().catch(function () {}); };
      addEventListener('pointerdown', retry, { once: true, passive: true });
    });
    fade(VOL, FADE_IN);
    try { if (window.kaihPauseWorldMusic) window.kaihPauseWorldMusic(1.2); } catch (e) {}
  }
  function stop() {
    if (!on) return; on = false;
    fade(0, FADE_OUT, function () { if (!on && el) { el.pause(); try { el.currentTime = 0; } catch (e) {} } });
    try { if (window.kaihResumeWorldMusic) window.kaihResumeWorldMusic(); } catch (e) {}
  }
  addEventListener('kaih-map-opening', start);
  addEventListener('kaih-map-closing', stop);
  window.KaihMapMusic = { start: start, stop: stop, playing: function () { return on; } };
})();
