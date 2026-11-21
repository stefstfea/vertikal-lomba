/* ============================================================================
   KAIH — skip-dashboard.js   "SKIP KE DASHBOARD"   (v2)
   Topi fedora terbang -> ditebas pedang 4 kali sampai terpotong-potong (slash n slices)
   -> model 3D Guide (guide-model.js) terjun dari atas dan membelah layar jadi dua
   -> kedua belahan layar bergeser membuka dashboard peta di belakangnya (KaihMapDoorway.openDirect).
   API: KaihSkipDash.play(onCovered)   onCovered dipanggil saat layar sudah tertutup overlay.
   Tempo (detik) ada di objek TL; sudut & waktu tebasan ada di SLASH.
   Bila Three.js / guide-model.js gagal dimuat, Guide dilewati (tebasan & pembelahan layar tetap jalan).
   ========================================================================== */
(function () {
  'use strict';
  var doc = document, html = doc.documentElement, busy = false;
  var THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', GUIDE_URL = 'src/guide/guide-model.js';
  var TL = { hat: [.35, 1.55], scatter: 2.4, dive: [3.0, 3.55], split: 3.55, open: [3.55, 4.55], guideOut: [4.3, 4.9], end: 5.1 };
  var SLASH = [{ t: 1.75, a: -.75, ox: -.1, oy: .05 }, { t: 1.95, a: .6, ox: .12, oy: -.05 }, { t: 2.12, a: -.1, ox: 0, oy: .1 }, { t: 2.28, a: 1.35, ox: -.05, oy: 0 }];
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, TAU = Math.PI * 2;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var seg = function (t, a, b) { return clamp((t - a) / (b - a), 0, 1); };
  var eOut = function (t) { return 1 - Math.pow(1 - clamp(t, 0, 1), 3); };
  var eIn = function (t) { t = clamp(t, 0, 1); return t * t * t; };
  var eIO = function (t) { t = clamp(t, 0, 1); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  function loadScript(src) { return new Promise(function (res, rej) { var s = doc.createElement('script'); s.src = src; s.onload = res; s.onerror = function () { rej(new Error(src)); }; doc.head.appendChild(s); }); }
  function sfx(k) { try { if (window.kxSfx) window.kxSfx(k); } catch (e) {} }
  async function engine() {
    try {
      if (!window.THREE) await loadScript(THREE_URL);
      if (!window.KaihGuideModel) await loadScript(GUIDE_URL);
      return !!(window.THREE && window.KaihGuideModel);
    } catch (e) { return false; }
  }

  /* ---------- topi fedora (vektor; pusat = tengah topi, lebar ±1) ---------- */
  function drawHat(c, s) {
    var g;
    c.save(); c.scale(s, s);
    c.beginPath(); c.ellipse(0, .18, 1.0, .3, 0, 0, TAU);
    g = c.createLinearGradient(0, -.1, 0, .5); g.addColorStop(0, '#2a2a33'); g.addColorStop(1, '#07070a'); c.fillStyle = g; c.fill();
    c.lineWidth = .02; c.strokeStyle = 'rgba(255,255,255,.18)'; c.stroke();
    c.beginPath(); c.moveTo(-.52, .16); c.bezierCurveTo(-.54, -.2, -.4, -.5, -.18, -.56);
    c.quadraticCurveTo(0, -.46, .18, -.56); c.bezierCurveTo(.4, -.5, .54, -.2, .52, .16);
    c.quadraticCurveTo(0, .3, -.52, .16); c.closePath();
    g = c.createLinearGradient(-.5, 0, .5, 0); g.addColorStop(0, '#0b0b0f'); g.addColorStop(.35, '#2a2a33'); g.addColorStop(1, '#09090d'); c.fillStyle = g; c.fill();
    c.beginPath(); c.moveTo(-.525, .02); c.quadraticCurveTo(0, .17, .525, .02); c.lineTo(.53, .15); c.quadraticCurveTo(0, .3, -.53, .15); c.closePath();
    c.fillStyle = '#4a4a58'; c.fill();
    c.restore();
  }

  /* ---------- pecahan topi: poligon konveks dipotong garis tebasan ---------- */
  function splitPoly(poly, p0, n) {                                       // Sutherland–Hodgman terhadap dua sisi garis
    function side(sg) {
      var out = [], len = poly.length;
      for (var i = 0; i < len; i++) {
        var a = poly[i], b = poly[(i + 1) % len], da = ((a[0] - p0[0]) * n[0] + (a[1] - p0[1]) * n[1]) * sg, db = ((b[0] - p0[0]) * n[0] + (b[1] - p0[1]) * n[1]) * sg;
        if (da >= 0) out.push(a);
        if ((da >= 0) !== (db >= 0)) { var k = da / (da - db); out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]); }
      }
      return out;
    }
    return [side(1), side(-1)];
  }
  function area(p) { var s = 0; for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
  function centroid(p) { var x = 0, y = 0; p.forEach(function (q) { x += q[0]; y += q[1]; }); return [x / p.length, y / p.length]; }
  function newPiece(poly, parent) { var c = centroid(poly); return { poly: poly, c: c, ox: parent ? parent.ox : 0, oy: parent ? parent.oy : 0, vx: 0, vy: 0, a: 0, w: 0 }; }

  /* ---------- Guide 3D ---------- */
  function makeGuide(cv) {
    var T = window.THREE, rr = new T.WebGLRenderer({ canvas: cv, alpha: true, antialias: true });
    rr.setClearColor(0, 0); rr.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    var sc = new T.Scene(), cam = new T.OrthographicCamera(0, 1, 1, 0, -1000, 1000), gm = window.KaihGuideModel.build(T);
    sc.add(gm.root); sc.add(gm.cape.mesh); gm.root.visible = false;
    return { rr: rr, sc: sc, cam: cam, gm: gm, init: false, blink: 0, blinkT: 2, px: 0, py: 0 };
  }
  function poseGuide(g, t, dt, x, y, size, vis, tilt, alpha, W, H) {
    var m = g.gm, r = m.root, P = m.parts, vx = (x - g.px) / dt, vy = (y - g.py) / dt; g.px = x; g.py = y;
    r.visible = vis; r.scale.set(size, size, size);
    r.position.set(x, H - y + Math.sin(t * 2.3) * size * .05, 0); r.rotation.set(Math.sin(t * 1.3) * .04, Math.sin(t * .9) * .1, tilt);
    P.arms.forEach(function (a, i) { var sg = i ? 1 : -1; a.rotation.z = sg * (2.7 + Math.sin(t * 9 + i * 1.4) * .12); a.rotation.x = .05; });
    P.legs.forEach(function (l, i) { l.rotation.x = Math.sin(t * 9 + i * Math.PI) * .3; });
    P.hat.rotation.x = clamp(-vy * .0004, -.5, .5);
    g.blinkT -= dt; if (g.blinkT < 0) { g.blinkT = 2.5; g.blink = .13; } if (g.blink > 0) g.blink -= dt;
    P.eyes.forEach(function (e) { e.scale.y = g.blink > 0 ? .012 : .07; });
    P.mouthOpen.visible = true; P.mouth.visible = false; P.mouthOpen.scale.y = .05;
    m.setAlpha(alpha); r.updateMatrixWorld(true);
    if (!g.init) { m.cape.snap(r.matrixWorld, t); g.init = true; } m.cape.update(dt, t, r.matrixWorld, vx, -vy, .3);
    g.rr.setSize(W, H, false); g.cam.right = W; g.cam.top = H; g.cam.updateProjectionMatrix(); g.rr.render(g.sc, g.cam);
  }

  /* ---------- tebasan pedang ---------- */
  function drawSword(c, x, y, ang, len, alpha) {                         // x,y = ujung bilah; ang = arah tebasan
    c.save(); c.translate(x, y); c.rotate(ang); c.globalAlpha = alpha;
    var g = c.createLinearGradient(-len, 0, 0, 0); g.addColorStop(0, '#9aa3b8'); g.addColorStop(.7, '#f4f8ff'); g.addColorStop(1, '#ffffff');
    c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.lineTo(-len * .1, -len * .035); c.lineTo(-len, -len * .03); c.lineTo(-len, len * .03); c.lineTo(-len * .1, len * .035); c.closePath(); c.fill();
    c.fillStyle = '#d3bc8e'; c.fillRect(-len - len * .04, -len * .1, len * .04, len * .2);               // pelindung tangan
    c.fillStyle = '#3b4255'; c.fillRect(-len * 1.25, -len * .028, len * .21, len * .056);                // gagang
    c.restore();
  }
  function drawStreak(c, q, a, u, fade, hs) {                            // q = titik tebasan di layar, a = sudut, u = kemajuan 0..1
    var L = Math.hypot(innerWidth, innerHeight), dx = Math.cos(a), dy = Math.sin(a), head = lerp(-L * .7, L * .7, eOut(u)), tail = Math.max(-L * .7, head - L * .55 * (1 - fade * .3));
    c.save(); c.lineCap = 'round';
    if (fade > 0) {
      var g = c.createLinearGradient(q.x + dx * tail, q.y + dy * tail, q.x + dx * head, q.y + dy * head);
      g.addColorStop(0, 'rgba(120,220,255,0)'); g.addColorStop(.7, 'rgba(180,235,255,' + .8 * fade + ')'); g.addColorStop(1, 'rgba(255,255,255,' + fade + ')');
      c.strokeStyle = g; c.shadowColor = '#8fe3ff'; c.shadowBlur = 26; c.lineWidth = 3 + 9 * fade;
      c.beginPath(); c.moveTo(q.x + dx * tail, q.y + dy * tail); c.lineTo(q.x + dx * head, q.y + dy * head); c.stroke();
      c.lineWidth = 1.5; c.strokeStyle = 'rgba(255,255,255,' + fade + ')'; c.stroke();
    }
    c.restore();
    if (u < 1) drawSword(c, q.x + dx * head, q.y + dy * head, a, hs * 1.5, 1);
  }

  /* ---------- pemutar ---------- */
  async function play(onCovered) {
    if (busy) return; busy = true;
    var W = innerWidth, H = innerHeight, ov = doc.createElement('div'), SP = reduce ? 3 : 1;
    ov.id = 'kx-sd'; ov.style.cssText = 'position:fixed;inset:0;z-index:2147481880;overflow:hidden;opacity:0;transition:opacity .35s ease;touch-action:none';
    ov.addEventListener('pointerdown', function (e) { e.stopPropagation(); e.preventDefault(); });
    function cvs(z, w, h) { var c = doc.createElement('canvas'); c.width = w || W; c.height = h || H; c.style.cssText = 'position:absolute;top:0;left:0;width:' + (w || W) + 'px;height:' + (h || H) + 'px;z-index:' + z; ov.appendChild(c); return c; }
    var cB = cvs(1), cG = cvs(3), cF = cvs(4), xB = cB.getContext('2d'), xF = cF.getContext('2d');
    var hw = Math.ceil(W / 2), cL = cvs(2, hw, H), cR = cvs(2, W - hw, H); cL.style.display = cR.style.display = 'none'; cR.style.left = hw + 'px';
    html.appendChild(ov); void ov.offsetWidth; ov.style.opacity = '1';
    var covered = false, guide = null, gateRes, gate = new Promise(function (r) { gateRes = r; }), gateDone = false, split = false;
    var directP = window.KaihMapDoorway.openDirect(gate);                       // dashboard dimuat di belakang layar sejak awal
    engine().then(function (ok) { if (ok) { try { guide = makeGuide(cG); } catch (e) { guide = null; } } });

    var hs = Math.min(W, H) * .2, hatRot = .1, hx = 0, hy = 0, P0 = { x: -W * .12, y: H * 1.08 }, P1 = { x: W * .5, y: H * .46 }, CP = { x: W * .12, y: H * .15 };
    var pieces = [newPiece([[-1.4, -1], [1.4, -1], [1.4, .8], [-1.4, .8]])], scattered = false, sparks = [];
    SLASH.forEach(function (S) { S.done = false; });
    var t = 0, last = performance.now();

    await new Promise(function (done) {
      function frame(now) {
        var dt = Math.min(.05, (now - last) / 1000); last = now; t += dt * SP; var step = dt * SP;
        xB.clearRect(0, 0, W, H); xF.clearRect(0, 0, W, H);
        if (!covered && t > .25) { covered = true; try { onCovered && onCovered(); } catch (e) {} }
        var dimA = (.86 + .14 * seg(t, 2.6, 3.0)) * seg(t, 0, .45);
        if (!split) { xB.fillStyle = 'rgba(8,6,22,' + dimA + ')'; xB.fillRect(0, 0, W, H); }

        /* topi terbang masuk */
        var hu = eOut(seg(t, TL.hat[0], TL.hat[1])), landed = hu >= 1, size = hs * (.6 + .5 * hu);
        if (t > TL.hat[0]) {
          hx = (1 - hu) * (1 - hu) * P0.x + 2 * (1 - hu) * hu * CP.x + hu * hu * P1.x; hy = (1 - hu) * (1 - hu) * P0.y + 2 * (1 - hu) * hu * CP.y + hu * hu * P1.y;
          if (landed) hy += Math.sin(t * 5) * 4 * (1 - seg(t, SLASH[0].t - .3, SLASH[0].t));
        }
        var rot = hatRot + (1 - hu) * (1 - hu) * 9.4;

        /* tebasan: potong poligon pecahan */
        var shake = 0;
        SLASH.forEach(function (S) {
          if (t >= S.t && !S.done) {
            S.done = true; sfx('gust'); shake = 1;
            var la = S.a - hatRot, n = [-Math.sin(la), Math.cos(la)], p0 = [S.ox, S.oy], np = [];
            pieces.forEach(function (pc) {
              var sd = splitPoly(pc.poly, p0, n);
              if (sd[0].length < 3 || sd[1].length < 3 || area(sd[0]) < 1e-4 || area(sd[1]) < 1e-4) { np.push(pc); return; }
              [0, 1].forEach(function (i) { var c2 = newPiece(sd[i], pc), sg = i ? -1 : 1; c2.ox += n[0] * sg * 3; c2.oy += n[1] * sg * 3; c2.vx = n[0] * sg * 55; c2.vy = n[1] * sg * 55; np.push(c2); });
            });
            pieces = np;
            for (var q = 0; q < 14; q++) { var aa = S.a + (Math.random() - .5) * 1.2 + (Math.random() < .5 ? 0 : Math.PI); sparks.push({ x: hx, y: hy, vx: Math.cos(aa) * (200 + Math.random() * 400), vy: Math.sin(aa) * (200 + Math.random() * 400), t0: t }); }
          }
        });
        if (!scattered && t >= TL.scatter) {
          scattered = true; sfx('swell');
          pieces.forEach(function (pc) { var ang = Math.atan2(pc.c[1] + .001, pc.c[0] + .001); pc.vx = Math.cos(ang) * (120 + Math.random() * 260) + (Math.random() - .5) * 80; pc.vy = Math.sin(ang) * (120 + Math.random() * 200) - 220 - Math.random() * 120; pc.w = (Math.random() - .5) * 9; });
        }
        if (t > TL.hat[0] && t < 3.3) {
          pieces.forEach(function (pc) {
            if (scattered) pc.vy += 1500 * step;
            pc.ox += pc.vx * step; pc.oy += pc.vy * step; pc.a += pc.w * step; if (!scattered) { pc.vx *= Math.pow(.05, step); pc.vy *= Math.pow(.05, step); }
            xB.save(); xB.translate(hx + pc.ox, hy + pc.oy); xB.rotate(rot); xB.scale(size, size); xB.translate(pc.c[0], pc.c[1]); xB.rotate(pc.a); xB.translate(-pc.c[0], -pc.c[1]);
            xB.beginPath(); pc.poly.forEach(function (q, i) { i ? xB.lineTo(q[0], q[1]) : xB.moveTo(q[0], q[1]); }); xB.closePath(); xB.clip();
            xB.globalAlpha = scattered ? 1 - seg(t, 2.9, 3.25) : 1; drawHat(xB, 1); xB.restore();
          });
          xB.globalAlpha = 1;
        }

        /* garis tebasan + pedang + percikan */
        SLASH.forEach(function (S) {
          if (t < S.t - .02 || t > S.t + .6) return;
          var u = seg(t, S.t, S.t + .13), fade = u < 1 ? 1 : 1 - seg(t, S.t + .13, S.t + .55), c = Math.cos(rot), sn = Math.sin(rot);
          var q = { x: hx + (c * S.ox - sn * S.oy) * size, y: hy + (sn * S.ox + c * S.oy) * size };
          drawStreak(xF, q, S.a, u, fade, hs);
        });
        sparks = sparks.filter(function (p) { return t - p.t0 < .45; });
        sparks.forEach(function (p) { var a = 1 - (t - p.t0) / .45; p.x += p.vx * step; p.y += p.vy * step; xF.strokeStyle = 'rgba(255,240,200,' + a + ')'; xF.lineWidth = 2; xF.beginPath(); xF.moveTo(p.x, p.y); xF.lineTo(p.x - p.vx * .03, p.y - p.vy * .03); xF.stroke(); });
        if (shake) { ov.style.transform = 'translate(' + ((Math.random() - .5) * 14) + 'px,' + ((Math.random() - .5) * 14) + 'px)'; setTimeout(function () { ov.style.transform = ''; }, 70); }

        /* Guide menerjang dari atas, membelah layar */
        var du = seg(t, TL.dive[0], TL.dive[1]), gs = Math.min(H * .2, W * .13), gy = lerp(-H * .22, H * .52, eIn(du)) - (t > TL.guideOut[0] ? eIO(seg(t, TL.guideOut[0], TL.guideOut[1])) * H * .9 : 0);
        if (t >= TL.dive[0] && t < TL.split) {                                   // garis belahan tumbuh dari atas mengikuti Guide
          var lx = W / 2, g2 = xF.createLinearGradient(0, 0, 0, Math.max(1, gy)); g2.addColorStop(0, 'rgba(160,230,255,.2)'); g2.addColorStop(1, 'rgba(255,255,255,1)');
          xF.save(); xF.shadowColor = '#8fe3ff'; xF.shadowBlur = 28; xF.strokeStyle = g2; xF.lineWidth = 3 + 8 * du; xF.beginPath(); xF.moveTo(lx, 0); xF.lineTo(lx, gy); xF.stroke(); xF.restore();
        }
        if (!split && t >= TL.split) {                                           // ambil gambar layar -> dua belahan
          split = true; sfx('swell');
          cL.getContext('2d').drawImage(cB, 0, 0, hw, H, 0, 0, hw, H); cR.getContext('2d').drawImage(cB, hw, 0, W - hw, H, 0, 0, W - hw, H);
          cL.style.display = cR.style.display = 'block'; cL.style.boxShadow = '3px 0 22px 4px rgba(150,230,255,.9)'; cR.style.boxShadow = '-3px 0 22px 4px rgba(150,230,255,.9)';
          xB.clearRect(0, 0, W, H);
          if (!gateDone) { gateDone = true; gateRes(); }
        }
        if (split) {
          var k = eIO(seg(t, TL.open[0], TL.open[1]));
          cL.style.transform = 'translateX(' + (-k * (hw + 40)) + 'px)'; cR.style.transform = 'translateX(' + (k * (W - hw + 40)) + 'px)';
          var fl = 1 - seg(t, TL.split, TL.split + .25); if (fl > 0) { xF.fillStyle = 'rgba(255,255,255,' + fl * .85 + ')'; xF.fillRect(0, 0, W, H); }
        }
        if (guide && t >= TL.dive[0] - .05) {
          try { poseGuide(guide, t, Math.max(.001, step), W / 2, gy, gs, true, 0, 1, W, H); } catch (e) { guide = null; }
        }

        if (t >= TL.end) { done(); return; }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
    try { await directP; } catch (e) {}
    if (guide) { try { guide.rr.dispose(); } catch (e) {} }
    ov.remove(); busy = false;
  }

  window.KaihSkipDash = { play: play };
})();
