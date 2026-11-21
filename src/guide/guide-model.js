/* ============================================================================
 * THE GUIDE — model 3D (maskot / companion)                       [Fase 3.0]
 * Mengikuti "3D Production Turnaround Blueprint" + gambar turnaround (front/side/back):
 *   bola putih matte, wajah minimalis (2 mata + senyum), jas hitam + dasi kupu-kupu,
 *   topi fedora hitam miring, tangan & kaki mungil. Cel-shaded + rim (fresnel) tipis.
 * Bone (rig prosedural): Bone_Root = model.root, Bone_Hat = parts.hat, Bone_SuitTail = parts.tail
 * Dibuat murni dari primitif THREE (kompatibel r128 CDN Ladang Langit & r160 bundle Pulau Awan):
 * tidak memakai Color(hex) (beda color-management antar versi) -> warna dikirim sebagai vec3 sRGB langsung.
 * Tidak ada side-effect saat dimuat: model baru dibangun saat KaihGuideModel.build(THREE) dipanggil.
 * ========================================================================== */
(function () {
  'use strict';

  // ---- palet (ubah di sini bila ingin menyesuaikan) -----------------------------------------------------
  var PAL = {
    body:   ['#fbfbfd', '#c4dcf3'],   // [terang, bayangan]
    jacket: ['#26262e', '#0d0d12'],
    lapel:  ['#34343e', '#15151b'],
    shirt:  ['#ffffff', '#d2e3f4'],
    hat:    ['#1e1e24', '#08080b'],
    hatBand:['#41414c', '#17171d'],   // gambar turnaround: pita hitam (blueprint menyebut putih -> ganti ke ['#ffffff','#cfd3e4'])
    black:  ['#16161b', '#050507'],
    cape:   ['#1b1b24', '#050508'],   // cape hitam (Fase 3.1)
    hand:   ['#ffffff', '#cde0f4']
  };

  function hex(h) {
    h = h.replace('#', '');
    return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255];
  }

  var VS = [
    'varying vec3 vN;',
    'void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }'
  ].join('\n');

  // 3-band cel shading lembut + rim fresnel tipis (view-space, kamera ortografis => arah pandang konstan +Z)
  var FS = [
    'uniform vec3 uC; uniform vec3 uS; uniform vec3 uRim; uniform float uRimK; uniform float uSpec; uniform float uFlash; uniform float uA;',
    'varying vec3 vN;',
    'void main(){',
    '  vec3 n = normalize(vN);',
    '  #ifdef FLIP',
    '  if (!gl_FrontFacing) n = -n;',
    '  #endif',
    '  vec3 L = normalize(vec3(-0.42, 0.72, 0.62));',
    '  float d = dot(n, L);',
    '  float lit = smoothstep(-0.10, 0.10, d) * 0.62 + smoothstep(0.34, 0.50, d) * 0.38;',
    '  vec3 col = mix(uS, uC, lit);',
    '  float fr = pow(1.0 - clamp(n.z, 0.0, 1.0), 3.0);',
    '  col += uRim * fr * uRimK;',
    '  vec3 r = reflect(-L, n);',
    '  col += vec3(smoothstep(0.93, 0.965, r.z) * uSpec);',
    '  col += vec3(uFlash);',
    '  gl_FragColor = vec4(col, uA);',
    '}'
  ].join('\n');

  function build(THREE) {
    var V3 = THREE.Vector3, mats = [];

    function mat(pal, o) {
      o = o || {};
      var m = new THREE.ShaderMaterial({
        vertexShader: VS, fragmentShader: FS, transparent: true,
        uniforms: {
          uC: { value: new V3().fromArray(hex(pal[0])) },
          uS: { value: new V3().fromArray(hex(pal[1])) },
          uRim: { value: new V3().fromArray(hex(o.rim || '#b4dcff')) },
          uRimK: { value: o.rimK == null ? 0.35 : o.rimK },
          uSpec: { value: o.spec == null ? 0.10 : o.spec },
          uFlash: { value: 0 }, uA: { value: 1 }
        }
      });
      if (o.double) m.side = THREE.DoubleSide;
      if (o.flip) m.defines = { FLIP: 1 };
      mats.push(m);
      return m;
    }
    var mBody = mat(PAL.body, { rim: '#ffe9a6', rimK: 0.28, spec: 0.025 });   // matte: sedikit specularity saja
    var mJacket = mat(PAL.jacket, { rim: '#8ec6f4', rimK: 0.75, spec: 0.05, double: true });
    var mLapel = mat(PAL.lapel, { rim: '#8ec6f4', rimK: 0.7, spec: 0.05 });
    var mShirt = mat(PAL.shirt, { rim: '#ffe9a6', rimK: 0.2, spec: 0.04 });
    var mHat = mat(PAL.hat, { rim: '#ffe08a', rimK: 0.5, spec: 0.03, double: true });
    var mBand = mat(PAL.hatBand, { rim: '#ffe08a', rimK: 0.6, spec: 0.05 });
    var mBlack = mat(PAL.black, { rim: '#8ec6f4', rimK: 0.4, spec: 0.12 });
    var mHand = mat(PAL.hand, { rim: '#ffe9a6', rimK: 0.25, spec: 0.1 });
    var mOutline = new THREE.ShaderMaterial({   // outline tipis (inverted hull) agar kontras di langit terang
      vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform float uA; void main(){ gl_FragColor = vec4(0.18, 0.31, 0.50, 0.55 * uA); }',
      uniforms: { uA: { value: 1 } }, side: THREE.BackSide, transparent: true, depthWrite: false
    });
    mats.push(mOutline);

    function mesh(geo, m, x, y, z) { var o = new THREE.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); return o; }
    function ellipsoid(m, rx, ry, rz, x, y, z) { var o = mesh(new THREE.SphereGeometry(1, 28, 20), m, x, y, z); o.scale.set(rx, ry, rz); return o; }

    // permukaan bola: (lat theta, lon phi) -> posisi. depan = +Z, phi positif ke +X
    function sp(r, th, ph) { return [r * Math.cos(th) * Math.sin(ph), r * Math.sin(th), r * Math.cos(th) * Math.cos(ph)]; }

    // patch di permukaan bola: baris lat t0..t1, bujur dari lonA(t) sampai lonB(t); center = titik pivot (agar bisa diputar)
    function patch(r, t0, t1, lonA, lonB, rows, cols, center) {
      var c = center || [0, 0, 0], pos = [], nor = [], idx = [], i, j;
      for (i = 0; i <= rows; i++) {
        var u = i / rows, th = t0 + (t1 - t0) * u, a = lonA(u), b = lonB(u);
        for (j = 0; j <= cols; j++) {
          var ph = a + (b - a) * (j / cols), p = sp(r, th, ph), n = sp(1, th, ph);
          pos.push(p[0] - c[0], p[1] - c[1], p[2] - c[2]); nor.push(n[0], n[1], n[2]);
        }
      }
      for (i = 0; i < rows; i++) for (j = 0; j < cols; j++) {
        var k = i * (cols + 1) + j;
        idx.push(k, k + cols + 1, k + 1, k + 1, k + cols + 1, k + cols + 2);
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setIndex(idx);
      return g;
    }

    var root = new THREE.Group();       // Bone_Root (pusat bola)
    var body = new THREE.Group(); root.add(body);

    // ---- badan: bola putih sempurna + outline tipis ------------------------------------------------------
    var sphere = mesh(new THREE.SphereGeometry(1, 64, 44), mBody);
    var outline = mesh(new THREE.SphereGeometry(1.022, 48, 32), mOutline);
    body.add(outline, sphere);

    // ---- wajah ---------------------------------------------------------------------------------------------
    var face = new THREE.Group(); body.add(face);
    var eyes = [];
    [-1, 1].forEach(function (s) {
      var e = ellipsoid(mBlack, 0.054, 0.07, 0.03);
      var p = sp(1.004, 0.075, s * 0.36);
      e.position.set(p[0], p[1], p[2]); e.lookAt(p[0] * 2, p[1] * 2, p[2] * 2);
      face.add(e); eyes.push(e);
    });
    var smilePts = [], k;     // senyum tepat di garis ekuator
    for (k = 0; k <= 8; k++) {
      var f = (k / 8) * 2 - 1, p2 = sp(1.01, -0.012 - 0.052 * (1 - f * f), f * 0.14);
      smilePts.push(new V3(p2[0], p2[1], p2[2]));
    }
    var mouth = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(smilePts), 24, 0.014, 6, false), mBlack);
    face.add(mouth);
    var mp = sp(1.0, -0.065, 0);
    var mouthOpen = ellipsoid(mBlack, 0.085, 0.06, 0.03, mp[0], mp[1], mp[2]);   // dibuka saat berbicara ("tersenyum lebar")
    mouthOpen.lookAt(mp[0] * 2, mp[1] * 2, mp[2] * 2); mouthOpen.visible = false; mouthOpen.scale.y = 0.0001;
    face.add(mouthOpen);

    // ---- jas hitam: pita melingkar pada bola, V-neck, lapel, kemeja, dasi kupu-kupu ----------------------
    var jacketGeo = new THREE.SphereGeometry(1.035, 64, 24, 0, Math.PI * 2, 1.75, 0.85);
    body.add(mesh(jacketGeo, mJacket));
    function hem(y, tube) { var rr = Math.sqrt(1.035 * 1.035 - y * y), t = mesh(new THREE.TorusGeometry(rr, tube, 8, 64), mJacket); t.rotation.x = Math.PI / 2; t.position.y = y; return t; }
    body.add(hem(-0.18, 0.026), hem(-0.89, 0.03));
    var vTop = -0.2, vBot = -1.1, vHalf = function (u) { return 0.5 * (1 - u * 0.97); };
    body.add(mesh(patch(1.052, vTop, vBot, function (u) { return -vHalf(u); }, function (u) { return vHalf(u); }, 14, 18), mShirt));
    [-1, 1].forEach(function (s) {       // lapel mengikuti sisi V
      body.add(mesh(patch(1.064, vTop, vBot, function (u) { return s < 0 ? -vHalf(u) - 0.2 * (1 - u * 0.4) : vHalf(u); }, function (u) { return s < 0 ? -vHalf(u) : vHalf(u) + 0.2 * (1 - u * 0.4); }, 14, 6), mLapel));
    });
    var bow = new THREE.Group(), bp = sp(1.07, -0.43, 0);
    bow.position.set(bp[0], bp[1], bp[2]); bow.lookAt(bp[0] * 2, bp[1] * 2, bp[2] * 2);
    [-1, 1].forEach(function (s) { var w = mesh(new THREE.ConeGeometry(0.085, 0.17, 4), mBlack); w.rotation.z = s * Math.PI / 2; w.position.x = s * 0.085; w.scale.z = 0.55; bow.add(w); });
    bow.add(ellipsoid(mBlack, 0.042, 0.042, 0.04));
    body.add(bow);
    [-0.62, -0.84].forEach(function (y) {   // kancing
      var b = sp(1.07, y, 0), bt = ellipsoid(mBlack, 0.035, 0.035, 0.022, b[0], b[1], b[2]); bt.lookAt(b[0] * 2, b[1] * 2, b[2] * 2); body.add(bt);
    });
    // Bone_SuitTail: panel belakang jas (vent) yang bergoyang saat terbang
    var tailPivot = sp(1.0, -0.5, Math.PI);
    var tail = new THREE.Group(); tail.position.set(tailPivot[0], tailPivot[1], tailPivot[2]);
    tail.add(mesh(patch(1.05, -0.5, -1.0, function () { return Math.PI - 0.5; }, function () { return Math.PI + 0.5; }, 8, 14, tailPivot), mJacket));
    var vent = mesh(patch(1.058, -0.56, -1.0, function () { return Math.PI - 0.012; }, function () { return Math.PI + 0.012; }, 8, 1, tailPivot), mBlack); tail.add(vent);   // garis belahan (vent) mengikuti permukaan
    body.add(tail);

    // ---- lengan (jas) + tangan putih -----------------------------------------------------------------------
    var arms = [];
    [-1, 1].forEach(function (s) {
      var a = new THREE.Group(); a.position.set(s * 0.94, -0.27, 0.05); a.userData.base = s * 0.96;
      var sleeve = mesh(new THREE.CylinderGeometry(0.135, 0.12, 0.42, 14), mJacket, 0, -0.21, 0);
      var cap = ellipsoid(mJacket, 0.135, 0.135, 0.135);
      var handM = ellipsoid(mHand, 0.115, 0.115, 0.115, 0, -0.5, 0);
      a.add(sleeve, cap, handM); a.rotation.order = 'ZXY'; a.rotation.z = a.userData.base; body.add(a); arms.push(a);
    });

    // ---- kaki mungil ----------------------------------------------------------------------------------------
    var legs = [-1, 1].map(function (s) {
      var hip = new THREE.Group(); hip.position.set(s * 0.28, -0.9, 0.02); hip.rotation.order = 'ZXY';
      hip.add(ellipsoid(mHand, 0.16, 0.25, 0.16, 0, -0.12, 0));                 // kaki
      hip.add(ellipsoid(mHand, 0.15, 0.085, 0.2, 0, -0.3, 0.05));               // telapak kecil menghadap depan
      body.add(hip); return hip;
    });

    // ---- Bone_Hat: topi fedora hitam miring ----------------------------------------------------------------
    var hat = new THREE.Group(); hat.position.set(0, 0.92, 0); hat.rotation.z = -0.12; hat.userData.baseZ = -0.12;
    var brimPts = [[0.3, -0.01], [0.46, 0.0], [0.58, 0.012], [0.64, 0.05], [0.655, 0.09], [0.62, 0.095], [0.55, 0.045], [0.44, 0.03], [0.3, 0.03]].map(function (p) { return new THREE.Vector2(p[0], p[1]); });
    hat.add(mesh(new THREE.LatheGeometry(brimPts, 40), mHat));
    var crownPts = [[0.33, 0.02], [0.335, 0.12], [0.31, 0.3], [0.27, 0.42], [0.2, 0.46], [0.1, 0.45], [0.0, 0.44]].map(function (p) { return new THREE.Vector2(p[0], p[1]); });
    var crownGeo = new THREE.LatheGeometry(crownPts, 40), pa = crownGeo.attributes.position, i2;
    for (i2 = 0; i2 < pa.count; i2++) {     // pinch fedora: penyok di tengah atas
      var cx = pa.getX(i2), cy = pa.getY(i2);
      if (cy > 0.3) pa.setY(i2, cy - 0.07 * Math.pow(Math.max(0, 1 - Math.abs(cx) / 0.24), 1.6) * Math.min(1, (cy - 0.3) / 0.14));
    }
    crownGeo.computeVertexNormals();
    hat.add(mesh(crownGeo, mHat));
    var bandPts = [[0.345, 0.03], [0.352, 0.07], [0.35, 0.13], [0.34, 0.14]].map(function (p) { return new THREE.Vector2(p[0], p[1]); });
    hat.add(mesh(new THREE.LatheGeometry(bandPts, 40), mBand));
    var knot = mesh(new THREE.BoxGeometry(0.06, 0.1, 0.03), mBand, 0.355, 0.085, 0.03); knot.rotation.y = 1.2; hat.add(knot);
    body.add(hat);


    // ---- CAPE hitam: kain simulasi (spring-lag + kibaran), dalam ruang dunia (px) -----------------------------
    var mCape = mat(PAL.cape, { rim: '#8ec6f4', rimK: 0.85, spec: 0.06, double: true, flip: true });
    var cape = (function () {
      var C = 9, R = 9, N = C * R, rest = [], i, j;
      for (i = 0; i < R; i++) {
        var u = i / (R - 1), th = 0.04 - u * 1.32, r = 1.07 + 0.05 * u, rh = r * Math.cos(th) + 0.58 * Math.pow(u, 1.3), yy = r * Math.sin(th);
        for (j = 0; j < C; j++) { var f = (j / (C - 1)) * 2 - 1, ph = Math.PI + f * (1.08 + 0.10 * u); rest.push(new V3(rh * Math.sin(ph), yy, rh * Math.cos(ph))); }
      }
      var pos = new Float32Array(N * 3), idx = [];
      for (i = 0; i < R - 1; i++) for (j = 0; j < C - 1; j++) { var k = i * C + j; idx.push(k, k + C, k + 1, k + 1, k + C, k + C + 1); }
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(N * 3), 3)); g.setIndex(idx);
      var mesh = new THREE.Mesh(g, mCape); mesh.frustumCulled = false;
      var P = new Float32Array(N * 3), Vv = new Float32Array(N * 3), rw = new Float32Array(N * 3), inited = false, tmp = new V3(), nb = new V3(), lat = new V3();
      function restWorld(mw, t, amp) {
        // arah belakang & samping model di ruang dunia (untuk kibaran)
        nb.set(0, 0, -1).transformDirection(mw); lat.set(1, 0, 0).transformDirection(mw);
        var s = Math.sqrt(mw.elements[0] * mw.elements[0] + mw.elements[1] * mw.elements[1] + mw.elements[2] * mw.elements[2]);
        for (var a = 0; a < R; a++) {
          var uu = a / (R - 1), w = Math.pow(uu, 1.3);
          for (var b = 0; b < C; b++) {
            var q = a * C + b; tmp.copy(rest[q]).applyMatrix4(mw);
            var fl = s * amp * w * (Math.sin(t * 8.5 + b * 0.9 + a * 0.45) + 0.6 * Math.sin(t * 13.1 + b * 1.7 - a * 0.8));
            rw[q * 3] = tmp.x + nb.x * fl * 0.8 + lat.x * fl * 0.5; rw[q * 3 + 1] = tmp.y + nb.y * fl * 0.8 + lat.y * fl * 0.5 + fl * 0.7; rw[q * 3 + 2] = tmp.z + nb.z * fl * 0.8 + lat.z * fl * 0.5;
          }
        }
        return s;
      }
      function write() {
        var a = g.attributes.position.array; for (var q = 0; q < N * 3; q++) a[q] = P[q];
        g.attributes.position.needsUpdate = true; g.computeVertexNormals();
      }
      return {
        mesh: mesh,
        reset: function () { inited = false; },
        // snap: taruh persis di posisi istirahat (dipakai render texture FAB)
        snap: function (mw, t) { restWorld(mw, t, 0.03); for (var q = 0; q < N * 3; q++) { P[q] = rw[q]; Vv[q] = 0; } inited = false; write(); },
        // vx, vy: kecepatan dunia (px/s, y ke atas); flap: 0..1 tambahan kibaran
        update: function (dt, t, mw, vx, vy, flap) {
          var speed = Math.sqrt(vx * vx + vy * vy), amp = 0.035 + Math.min(1, speed / 450) * 0.11 + (flap || 0) * 0.12;
          var s = restWorld(mw, t, amp);
          if (!inited) { for (var q0 = 0; q0 < N * 3; q0++) { P[q0] = rw[q0]; Vv[q0] = 0; } inited = true; }
          var sub = dt > 0.026 ? 2 : 1, h = dt / sub, st;
          for (st = 0; st < sub; st++) {
            for (var a = C; a < N; a++) {          // baris 0 = terpasang pada badan
              var row = Math.floor(a / C), uu = row / (R - 1), k = 700 + (40 - 700) * Math.pow(uu, 0.7), damp = 7 + (2.2 - 7) * uu, w = Math.pow(uu, 1.3);
              var ax = a * 3, ay = ax + 1, az = ax + 2;
              // angin: berlawanan arah gerak -> cape mengibar ke belakang gerakan
              var fx = -vx * k * 0.12 * w, fy = -vy * k * 0.12 * w + Math.abs(vx) * k * 0.07 * w;     // terangkat seperti bendera saat bergerak ke samping
              Vv[ax] += (k * (rw[ax] - P[ax]) + fx) * h; Vv[ay] += (k * (rw[ay] - P[ay]) + fy) * h; Vv[az] += (k * (rw[az] - P[az])) * h;
              var dmp = Math.exp(-damp * h); Vv[ax] *= dmp; Vv[ay] *= dmp; Vv[az] *= dmp;
              P[ax] += Vv[ax] * h; P[ay] += Vv[ay] * h; P[az] += Vv[az] * h;
              var dx = P[ax] - rw[ax], dy = P[ay] - rw[ay], dz = P[az] - rw[az], dd = Math.sqrt(dx * dx + dy * dy + dz * dz), mx = s * (0.15 + 1.25 * uu);
              if (dd > mx) { var c = mx / dd; P[ax] = rw[ax] + dx * c; P[ay] = rw[ay] + dy * c; P[az] = rw[az] + dz * c; Vv[ax] *= 0.5; Vv[ay] *= 0.5; Vv[az] *= 0.5; }
            }
          }
          for (var r0 = 0; r0 < C * 3; r0++) P[r0] = rw[r0];     // baris atas terkunci
          write();
        }
      };
    })();

    // titik emisi (dipertahankan; trail sudah diganti cape)
    var emit = new THREE.Object3D(); emit.position.set(0, -0.82, -0.55); body.add(emit);

    function setAlpha(a) { mats.forEach(function (m) { if (m.uniforms.uA) m.uniforms.uA.value = a; }); }
    function setFlash(f) { mats.forEach(function (m) { if (m.uniforms.uFlash) m.uniforms.uFlash.value = f; }); }
    function dispose() {
      root.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); cape.mesh.geometry.dispose();
      mats.forEach(function (m) { m.dispose(); });
    }
    return { root: root, body: body, cape: cape, parts: { hat: hat, tail: tail, arms: arms, legs: legs, eyes: eyes, face: face, mouth: mouth, mouthOpen: mouthOpen, emit: emit }, setAlpha: setAlpha, setFlash: setFlash, dispose: dispose };
  }

  window.KaihGuideModel = { build: build, palette: PAL };
})();
