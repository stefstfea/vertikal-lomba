/* ============================================================================
   KAIH — splash-guide.js : Guide 3D (guide-model.js) di halaman awal "Ketuk di mana saja".
   Guide melayang, melambai, dan menoleh mengikuti kursor/jari. Berhenti otomatis saat splash dimulai (#kaih-splash.go / .done).
   THREE r128 dimuat dari CDN bila belum ada; bila gagal, halaman awal tetap berupa teks saja.
   ========================================================================== */
(function () {
  'use strict';
  var cv = document.getElementById('splash-guide'), splash = document.getElementById('kaih-splash');
  if (!cv || !splash) return;
  function load(src) { return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = function () { rej(new Error(src)); }; document.head.appendChild(s); }); }
  var look = 0, lookT = 0;
  addEventListener('pointermove', function (e) { lookT = Math.max(-1, Math.min(1, (e.clientX / innerWidth - .5) * 2)); }, { passive: true });
  (async function () {
    try { if (!window.THREE) await load('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'); if (!window.KaihGuideModel) await load('src/guide/guide-model.js'); } catch (e) { return; }
    var T = window.THREE; if (!T || !window.KaihGuideModel) return;
    var S = 520, rr, sc, cam, gm;
    try {
      rr = new T.WebGLRenderer({ canvas: cv, alpha: true, antialias: true }); rr.setClearColor(0, 0); rr.setPixelRatio(1); rr.setSize(S, S, false);
      sc = new T.Scene(); cam = new T.OrthographicCamera(0, S, S, 0, -1000, 1000); gm = window.KaihGuideModel.build(T); sc.add(gm.root); sc.add(gm.cape.mesh);
    } catch (e) { return; }
    var P = gm.parts, r = gm.root, last = performance.now(), t0 = last, init = false, blinkT = 2, blink = 0, wave = 0, waveT = 1.2, px = 0;
    cv.style.opacity = 0; cv.style.transition = 'opacity .9s ease';
    function tick(now) {
      if (splash.classList.contains('go') || splash.classList.contains('done')) { rr.dispose(); return; }
      requestAnimationFrame(tick);
      var dt = Math.min(.05, Math.max(.001, (now - last) / 1000)), t = (now - t0) / 1000; last = now;
      look += (lookT - look) * Math.min(1, dt * 4);
      var bob = Math.sin(t * 2.1) * S * .018, vy = Math.cos(t * 2.1) * S * .018 * 2.1;
      r.scale.set(S * .21, S * .21, S * .21); r.position.set(S / 2, S * .5 + bob, 0);
      r.rotation.set(Math.sin(t * 1.3) * .04, look * .5 + Math.sin(t * .8) * .12, Math.sin(t * 1.1) * .04);
      waveT -= dt; if (waveT < 0) { waveT = 4 + Math.random() * 3; wave = 1.6; } if (wave > 0) wave -= dt;
      P.arms.forEach(function (a, i) {
        var sg = i ? 1 : -1, tz = sg * .96 + Math.sin(t * 1.9 + i * 1.7) * .07, tx = 0;
        if (wave > 0 && i === 1) { tz = 2.55 + Math.sin(t * 9.5) * .4; tx = .1; }
        var k = Math.min(1, dt * 10); a.rotation.z += (tz - a.rotation.z) * k; a.rotation.x += (tx - a.rotation.x) * k;
      });
      P.legs.forEach(function (l, i) { l.rotation.x = Math.sin(t * 2 + i * Math.PI) * .09; });
      P.hat.rotation.x = Math.max(-.4, Math.min(.4, -vy * .002));
      blinkT -= dt; if (blinkT < 0) { blinkT = 2.4 + Math.random() * 2.6; blink = .13; } if (blink > 0) blink -= dt;
      P.eyes.forEach(function (e) { e.scale.y = blink > 0 ? .012 : .07; });
      P.face.rotation.y = look * .4;
      r.updateMatrixWorld(true); if (!init) { gm.cape.snap(r.matrixWorld, t); init = true; } gm.cape.update(dt, t, r.matrixWorld, (look - px) * 60, -vy * 4, 0); px = look;
      rr.render(sc, cam);
      cv.style.opacity = 1;
    }
    requestAnimationFrame(tick);
  })();
})();
