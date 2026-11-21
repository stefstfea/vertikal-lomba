// ============================================================================
// 7 KAIH - 3D MODELS v2 "SPHERICAL CLAY MASCOT SERIES" (js/models.js)
// Semua karakter: bola clay matte (radius 1) + wajah doodle kapsul + aksesori kecil.
// Setiap model punya:
//   - animasi IDLE sendiri
//   - animasi UNIK saat ditekan/diklik (squash & stretch dasar + aksi khas)
// Cara pakai tidak berubah: createKaihModels({ K, N, Ai, ke }) -> { zm, xj }
// Mau ubah warna?  -> cari konstanta warna di tiap model (mis. "#e8853e").
// Mau ubah lama animasi klik? -> angka pertama di usePet(DURASI_DETIK, ...).
// ============================================================================

function createKaihModels({ K, N, Ai, ke }) {
  // --------------------------------------------------------------------------
  // PERALATAN BERSAMA (helper kecil agar tiap model pendek & konsisten)
  // --------------------------------------------------------------------------
  const PI = Math.PI, TAU = PI * 2, INK = "#2b2b2b";
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const sm = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };   // smoothstep 0..1
  const pulse = (x) => Math.sin(clamp01(x) * PI);                      // 0 -> 1 -> 0
  const E = (c, i) => ({ emissive: c, emissiveIntensity: i });          // bahan menyala
  const SILVER = { metalness: 0.7, roughness: 0.3 };
  // LAND = true di Ladang Langit (tanpa pijakan di bawah kaki); false di Pulau Awan
  const LAND = !document.getElementById("root");
  const PED = (arr) => (LAND ? [] : arr);   // bagian "pijakan" hanya ada di Pulau Awan
  const TACO_N = 16;

  // Mesh clay matte: P("sphere", [radius, w, h], "#warna", { position... }, { opsi material })
  function P(geo, args, color, props = {}, m = {}) {
    const { key, ...rest } = props;
    return N.jsxs("mesh", {
      castShadow: true, ...rest,
      children: [
        N.jsx(geo + "Geometry", { args }),
        N.jsx("meshStandardMaterial", { color, roughness: 0.78, metalness: 0, ...m })
      ]
    }, key);
  }
  // Group: G({ position... }, [anak-anak])
  function G(props, children) {
    const { key, ...rest } = props || {};
    return N.jsxs("group", { ...rest, children }, key);
  }

  // Kedip mata (hanya untuk mata "open")
  function blink(ref, t, off = 0) {
    if (!ref.current) return;
    const u = (t + off) % 3.8, s = u > 3.6 ? 1 - 0.85 * pulse((u - 3.6) / 0.2) : 1;
    ref.current.children.forEach((c) => (c.scale.y = s));
  }

  // --------------------------------------------------------------------------
  // usePet: pegas squash & stretch + pemicu animasi klik.
  //  - ditekan  -> bola gepeng (squash); dilepas/klik -> membal (boing)
  //  - onFrame(t, k, dt, S): k = -1 saat idle, 0..1 saat animasi klik berjalan
  //  - S = tempat menyimpan angka antar-frame (mis. sudut putar)
  //  - pasang pet.sq pada <group> pembungkus badan, dan {...pet.h} pada group akar
  // --------------------------------------------------------------------------
  function usePet(dur, onFrame, onTrigger) {
    const st = K.useRef({ x: 0, v: 0, down: false, a: -1, bag: {} });
    const sq = K.useRef();
    Ai(({ clock }, d) => {
      const dt = Math.min(d || 0.016, 0.05), s = st.current;
      s.v += ((s.down ? 0.2 : 0) - s.x) * 150 * dt - s.v * 9 * dt;
      s.x = Math.max(-0.35, Math.min(0.4, s.x + s.v * dt));
      if (s.a >= 0) { s.a += dt; if (s.a >= dur) { s.a = -1; s.v += 3.5; } }   // mendarat -> gepeng sedikit
      if (sq.current) sq.current.scale.set(1 + s.x * 0.5, 1 - s.x, 1 + s.x * 0.5);
      onFrame(clock.elapsedTime, s.a < 0 ? -1 : s.a / dur, dt, s.bag);
    });
    const h = {
      onPointerDown: () => { st.current.down = true; },
      onPointerUp: () => { st.current.down = false; },
      onPointerOut: () => { st.current.down = false; },
      onClick: () => { st.current.a = 0; st.current.v += 4.5; st.current.down = false; if (onTrigger) onTrigger(st.current.bag); }
    };
    return { sq, h };
  }

  // --------------------------------------------------------------------------
  // Wajah doodle clay: mata kapsul + mulut pipa melengkung (ikut gaya gambar referensi)
  //  eyes : "open" | "sleep" | "dizzy"        mouth: "smile" | "soft" | "chew" | "grin" | "wavy"
  //  flat : kalau diisi, wajah ditaruh di bidang datar z=flat (dipakai muka jam)
  // --------------------------------------------------------------------------
  function Face({ eyes = "open", mouth = "smile", ey = 0.1, ex = 0.34, my = -0.2, flat = 0, eyesRef, mouthRef }) {
    const zAt = (x, y) => flat || Math.sqrt(Math.max(0.04, 1 - x * x - y * y)) * 0.995;
    const yaw = (x, y) => (flat ? 0 : Math.atan2(x, zAt(x, y)));
    const eyeEls = [-ex, ex].map((x, i) => {
      let inner;
      if (eyes === "sleep") inner = P("torus", [0.1, 0.03, 5, 12, PI], INK, { "rotation-z": PI });
      else if (eyes === "dizzy") inner = G({}, [
        P("torus", [0.12, 0.026, 5, 14, 5.0], INK, { "rotation-z": i ? 0 : PI }),
        P("torus", [0.06, 0.026, 5, 10, 4.2], INK, {})
      ]);
      else inner = P("sphere", [0.095, 8, 6], INK, { scale: [0.62, 1.2, 0.55] });
      return G({ key: i, position: [x, ey, zAt(x, ey) + 0.005], "rotation-y": yaw(x, ey) }, [inner]);
    });
    const m = [];
    if (mouth === "smile" || mouth === "soft") {
      const r = 0.22, arc = mouth === "soft" ? 1.9 : 2.4, a0 = -PI / 2 - arc / 2;
      m.push(P("torus", [r, 0.03, 5, 14, arc], INK, { key: "a", position: [0, r, 0], "rotation-z": a0 }));
      if (mouth === "smile") [a0, a0 + arc].forEach((a, i) =>
        m.push(P("sphere", [0.052, 6, 5], INK, { key: "d" + i, position: [Math.cos(a) * r, r + Math.sin(a) * r, 0.01] })));
    } else if (mouth === "chew") {
      m.push(P("sphere", [0.13, 8, 6], INK, { key: "c", scale: [1.15, 0.8, 0.5] }));
    } else if (mouth === "grin") {
      m.push(P("circle", [0.22, 12, PI, PI], INK, { key: "g", position: [0, 0.1, 0] }));
      m.push(P("circle", [0.11, 8, PI, PI], "#ff7aa8", { key: "t", position: [0, 0.0, 0.005] }));
    } else if (mouth === "wavy") {
      for (let i = 0; i < 5; i++) m.push(P("sphere", [0.04, 6, 5], INK, { key: "w" + i, position: [-0.2 + i * 0.1, i % 2 ? 0.045 : -0.045, 0] }));
    }
    return G({}, [
      G({ ref: eyesRef }, eyeEls),
      G({ ref: mouthRef, position: [0, my, zAt(0, my) + 0.01] }, m)
    ]);
  }

  const Ball = (color, extra = {}, key) => P("sphere", [1, 20, 14], color, { key }, extra);

  // --------------------------------------------------------------------------
  // 1. OLAHRAGA — "Sporty Runner Ball"  (menggantikan TreadmillModel)
  //  Idle : jogging di tempat (bola membal, sepatu bergantian, dumbbell dipompa, belt berputar)
  //  Klik : LONCATAN SALTO (front flip) + belt ngebut
  // --------------------------------------------------------------------------
  function SportBall() {
    const body = K.useRef(), slats = K.useRef(), eyes = K.useRef(), mouth = K.useRef();
    const footL = K.useRef(), footR = K.useRef(), handL = K.useRef(), handR = K.useRef();
    const pet = usePet(1.2, (t, k, dt, S) => {
      const on = k >= 0, f = 6.5;
      S.spin = (S.spin || 0) + dt * (1.2 + (on ? pulse(k) * 9 : 0));
      if (slats.current) slats.current.rotation.y = S.spin;
      body.current.position.y = 1.3 + Math.abs(Math.sin(t * f)) * (on ? 0.03 : 0.1) + (on ? pulse(k) * 1.0 : 0);
      body.current.rotation.x = 0.09 + (on ? -TAU * sm((k - 0.12) / 0.76) : 0);   // condong 5° + salto
      body.current.rotation.z = Math.sin(t * f * 0.5) * 0.04;
      const s1 = Math.sin(t * f), s2 = -s1;
      footL.current.position.set(-0.42, -0.98 + Math.max(0, s1) * 0.2, 0.2 + s1 * 0.12);
      footR.current.position.set(0.42, -0.98 + Math.max(0, s2) * 0.2, 0.2 + s2 * 0.12);
      const up = on ? pulse(k) * 0.55 : 0;                                          // dumbbell diangkat saat klik
      handL.current.position.set(-1.1, -0.1 + Math.sin(t * f) * 0.15 + up, 0.3);
      handR.current.position.set(1.1, -0.1 - Math.sin(t * f) * 0.15 + up, 0.3);
      mouth.current.scale.y = on ? 1 + 0.5 * pulse(k) : 1;
      blink(eyes, t);
    });
    const dumbbell = () => [
      P("cylinder", [0.035, 0.035, 0.56, 6], "#cfd3ff", { key: "b", "rotation-x": PI / 2 }),
      P("sphere", [0.11, 8, 6], "#cfd3ff", { key: "c", position: [0, 0, 0.28] }),
      P("sphere", [0.11, 8, 6], "#cfd3ff", { key: "d", position: [0, 0, -0.28] })
    ];
    const shoe = (ref, x) => G({ ref, position: [x, -0.98, 0.2] }, [
      P("sphere", [0.15, 8, 6], "#cfd3ff", { key: "s", scale: [1.2, 0.85, 2.1] }),
      P("sphere", [0.15, 8, 6], "#e94f7a", { key: "o", position: [0, -0.09, 0], scale: [1.25, 0.4, 2.15] })
    ]);
    return G({ ...pet.h }, [
      ...PED([
      // alas treadmill bulat mini + 8 bilah belt yang berputar
      P("cylinder", [1.6, 1.7, 0.16, 28], "#3b3b4f", { position: [0, 0.08, 0] }),
      P("torus", [1.63, 0.07, 5, 26], "#e94f7a", { position: [0, 0.14, 0], "rotation-x": PI / 2 }),
      G({ ref: slats, position: [0, 0.18, 0] }, Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * TAU;
        return P("box", [0.5, 0.03, 0.18], "#8a8ab0", { key: i, position: [Math.cos(a) * 1.2, 0, Math.sin(a) * 1.2], "rotation-y": -a - PI / 2 });
      }))
      ]),
      G({ ref: pet.sq }, [
        G({ ref: body, position: [0, 1.3, 0] }, [
          Ball("#e8853e", {}, "ball"),
          N.jsx(Face, { eyes: "open", mouth: "smile", eyesRef: eyes, mouthRef: mouth }),
          // headband handuk cyan + strip pink + simpul di belakang
          P("torus", [0.93, 0.1, 5, 20], "#7cf3ff", { position: [0, 0.45, 0], "rotation-x": PI / 2 }, { roughness: 0.95 }),
          P("box", [0.24, 0.17, 0.05], "#e94f7a", { position: [0, 0.45, 1.01] }),
          P("sphere", [0.1, 8, 6], "#e94f7a", { position: [0, 0.45, -1.0] }),
          P("box", [0.08, 0.24, 0.03], "#7cf3ff", { position: [-0.08, 0.34, -1.05], "rotation-z": 0.3 }),
          P("box", [0.08, 0.24, 0.03], "#7cf3ff", { position: [0.08, 0.34, -1.05], "rotation-z": -0.3 }),
          // konsol layar treadmill di punggung
          G({ position: [0, -0.1, -0.93], "rotation-y": PI }, [
            P("box", [0.7, 0.45, 0.1], "#2a2a3d", { key: "c" }),
            P("box", [0.56, 0.26, 0.03], "#7cf3ff", { key: "s", position: [0, 0.06, 0.07] }, E("#7cf3ff", 1.1)),
            ...[-0.18, 0, 0.18].map((x) => P("box", [0.1, 0.06, 0.03], "#ff7aa8", { key: "b" + x, position: [x, -0.14, 0.07] }, E("#ff7aa8", 0.8)))
          ]),
          shoe(footL, -0.42), shoe(footR, 0.42),
          G({ ref: handL, position: [-1.1, -0.1, 0.3] }, [P("sphere", [0.17, 8, 6], "#e8853e", { key: "h" }), ...dumbbell()]),
          G({ ref: handR, position: [1.1, -0.1, 0.3] }, [P("sphere", [0.17, 8, 6], "#e8853e", { key: "h" }), ...dumbbell()])
        ])
      ]),
      N.jsx("pointLight", { position: [0, 2.4, -1.4], color: "#7cf3ff", intensity: 4, distance: 6 })
    ]);
  }

  // --------------------------------------------------------------------------
  // 2. TIDUR — "Dreamy Pillow Ball"  (menggantikan BedModel + ZzzShape)
  //  Idle : napas pelan, topi tidur berayun (3 ruas rantai), huruf Zzz melayang, lampu tidur bergoyang
  //  Klik : MENGUAP + oleng ngantuk, topi mengibas, Zzz meledak lebih banyak & cepat, lampu berkedip terang
  // --------------------------------------------------------------------------
  function SleepBall() {
    const body = K.useRef(), c2 = K.useRef(), c3 = K.useRef();
    const lamp = K.useRef(), lampL = K.useRef(), zs = K.useRef([]);
    const openEyes = K.useRef(), shutEyes = K.useRef(), bang = K.useRef();
    const pet = usePet(1.5, (t, k, dt, S) => {
      // Dengar alarm dari bola jam weker di sampingnya (hanya di Pulau Awan)
      if (!S.bound) { S.bound = true; S.wk = -1; if (!LAND) window.addEventListener("kaih-alarm-ring", () => { S.wk = 0; }); }
      if (S.wk >= 0) { S.wk += dt; if (S.wk > 3.8) S.wk = -1; }
      const w = S.wk, wake = w >= 0;
      const startle = wake && w < 0.4 ? pulse(w / 0.4) : 0;                       // kaget: loncat singkat
      const awake = !wake ? 0 : w < 0.18 ? sm(w / 0.18) : w < 2.3 ? 1 : w < 3.3 ? 1 - sm(w - 2.3) : 0;
      const droop = wake && w > 1.2 && w < 3.3 ? sm((w - 1.2) / 1.6) : 0;           // mata makin berat lalu tidur lagi
      const on = k >= 0, env = on ? Math.exp(-2.6 * k) : 0, br = Math.sin(t * 1.6);
      body.current.position.y = 1.1 + br * 0.025 + startle * 0.45;
      body.current.scale.set(1 - br * 0.012 - startle * 0.1, 1 + br * 0.025 + startle * 0.2, 1 - br * 0.012 - startle * 0.1);
      body.current.rotation.z = Math.sin(t * 0.7) * 0.05 + (on ? Math.sin(k * 26) * env * 0.28 : 0)
        + (wake ? Math.sin(w * 55) * startle * 0.22 + Math.sin(t * 2.6) * awake * 0.07 : 0);
      body.current.rotation.x = wake && w > 2.1 && w < 3.4 ? Math.sin((w - 2.1) * PI * 1.5) * 0.16 : 0;   // mengangguk ngantuk
      c2.current.rotation.z = -0.5 + Math.sin(t * 1.4 - 0.6) * 0.07 + (on ? Math.sin(k * 20 - 1) * env * 0.5 : 0) + startle * 0.6;
      c3.current.rotation.z = -0.55 + Math.sin(t * 1.4 - 1.3) * 0.1 + (on ? Math.sin(k * 20 - 2) * env * 0.7 : 0) + startle * 0.8;
      // mata: tidur (busur) <-> terbuka (kapsul)
      openEyes.current.scale.set(1, Math.max(0.001, awake * (1 - droop * 0.55)), 1);
      openEyes.current.visible = awake > 0.03;
      shutEyes.current.visible = awake < 0.5;
      // tanda seru kaget
      const bs = !wake ? 0 : w < 0.1 ? 0 : w < 1.1 ? Math.min(1, (w - 0.1) * 7) : Math.max(0, 1 - (w - 1.1) * 3);
      bang.current.scale.setScalar(Math.max(0.001, bs));
      bang.current.position.y = 1.55 + (wake ? Math.sin(w * 18) * 0.05 : 0);
      lamp.current.position.y = 0.9 + Math.sin(t * 1.3) * 0.08;
      lampL.current.intensity = 5 + (on ? pulse(k * 3) * 9 : 0) + startle * 8;
      S.z = (S.z || 0) + dt * 0.3 * (on ? 3.2 : 1);
      zs.current.forEach((g, i) => {
        const s = (S.z + i / 3) % 1;
        g.position.set(1.0 + s * 0.8, 2.9 + s * 1.0, 0.2);
        g.scale.setScalar(Math.max(0.001, Math.sin(s * PI) * (on ? 1.5 : 0.9) * (1 - awake)));
        g.rotation.z = Math.sin(t * 2 + i) * 0.15;
      });
    });
    const zLetter = (i) => G({ key: i, ref: (g) => (zs.current[i] = g) }, [
      P("box", [0.42, 0.06, 0.06], "#ffe9a0", { key: "t", position: [0, 0.2, 0] }, E("#ffd86a", 1)),
      P("box", [0.42, 0.06, 0.06], "#ffe9a0", { key: "b", position: [0, -0.2, 0] }, E("#ffd86a", 1)),
      P("box", [0.06, 0.57, 0.06], "#ffe9a0", { key: "d", "rotation-z": -0.785 }, E("#ffd86a", 1))
    ]);
    // mata terbuka (dipakai saat kaget terbangun)
    const openEye = (x) => G({ key: "oe" + x, position: [x, 0.1, Math.sqrt(Math.max(0.04, 1 - x * x - 0.01)) * 0.995 + 0.012], "rotation-y": Math.atan2(x, 0.93) }, [
      P("sphere", [0.115, 8, 6], "#ffffff", { key: "w", scale: [0.8, 1.25, 0.5] }),
      P("sphere", [0.075, 8, 6], INK, { key: "p", position: [0, 0, 0.03], scale: [0.7, 1.1, 0.5] })
    ]);
    return G({ ...pet.h }, [
      G({ ref: pet.sq }, [
        // 4 kaki kayu pendek
        ...[[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].map(([x, z], i) =>
          P("cylinder", [0.12, 0.1, 0.45, 8], "#6b4328", { key: "l" + i, position: [x, 0.22, z] })),
        G({ ref: body, position: [0, 1.1, 0] }, [
          Ball("#9a86e8", {}, "ball"),
          G({ ref: shutEyes }, [N.jsx(Face, { eyes: "sleep", mouth: "none" })]),
          G({ ref: openEyes }, [openEye(-0.34), openEye(0.34)]),
          // tanda seru "!" saat kaget
          G({ ref: bang, position: [-0.95, 1.55, 0.3], scale: 0.001 }, [
            P("box", [0.13, 0.4, 0.1], "#ff5a6e", { key: "a", position: [0, 0.12, 0] }, E("#ff5a6e", 1)),
            P("sphere", [0.085, 8, 6], "#ff5a6e", { key: "b", position: [0, -0.17, 0] }, E("#ff5a6e", 1))
          ]),
          // topi tidur: 3 ruas rantai + pom-pom menyala
          G({ position: [0, 0.5, 0] }, [
            P("cylinder", [0.52, 0.88, 0.55, 12], "#b9a8f5", { position: [0, 0.275, 0] }),
            G({ ref: c2, position: [0, 0.55, 0], "rotation-z": -0.5 }, [
              P("cylinder", [0.26, 0.52, 0.5, 10], "#b9a8f5", { position: [0, 0.22, 0] }),
              G({ ref: c3, position: [0, 0.44, 0], "rotation-z": -0.55 }, [
                P("cylinder", [0.02, 0.26, 0.46, 10], "#b9a8f5", { position: [0, 0.2, 0] }),
                P("sphere", [0.16, 10, 8], "#ffe9a0", { position: [0, 0.46, 0] }, E("#ffc46b", 0.9))
              ])
            ])
          ]),
          // bantal putih dipeluk
          P("sphere", [0.55, 10, 8], "#ffffff", { position: [0, -0.4, 0.82], scale: [1.15, 0.8, 0.5] }),
          P("sphere", [0.16, 8, 6], "#9a86e8", { position: [-0.66, -0.3, 0.8] }),
          P("sphere", [0.16, 8, 6], "#9a86e8", { position: [0.66, -0.3, 0.8] }),
          // punggung: selimut lilac + sandaran kayu
          P("sphere", [1.04, 18, 8, PI, PI, PI * 0.52, PI * 0.3], "#b9a8f5"),
          P("cylinder", [0.5, 0.5, 0.12, 14], "#8a5a3a", { position: [0, 0.1, -1.0], "rotation-x": PI / 2, scale: [1, 1, 1.2] })
        ])
      ]),
      // lampu tidur kerucut melayang (sumber cahaya hangat)
      G({ ref: lamp, position: [-1.75, 0.9, 0.1] }, [
        P("cylinder", [0.04, 0.05, 0.5, 6], "#a06b44", { key: "p" }),
        P("cone", [0.26, 0.34, 10], "#ffd89a", { key: "s", position: [0, 0.38, 0] }, E("#ffc46b", 1.2)),
        N.jsx("pointLight", { key: "l", ref: lampL, position: [0, 0.4, 0.3], color: "#ffb870", intensity: 5, distance: 6 })
      ]),
      ...[0, 1, 2].map(zLetter)
    ]);
  }

  // --------------------------------------------------------------------------
  // 3. SUARA HATI — "Guardian Angel Ball"  (menggantikan AngelModel)
  //  Idle : melayang naik-turun, sayap mengepak pelan, halo goyang, bintang tongkat berkelip
  //  Klik : TERBANG BERPUTAR ke atas, sayap ngebut, tongkat diayun & memercikkan bintang kecil
  // --------------------------------------------------------------------------
  function AngelBall() {
    const body = K.useRef(), wL = K.useRef(), wR = K.useRef(), halo = K.useRef();
    const wand = K.useRef(), star = K.useRef(), sparks = K.useRef([]), eyes = K.useRef();
    const pet = usePet(1.7, (t, k) => {
      const on = k >= 0;
      body.current.position.y = 1.95 + Math.sin(t * 1.5) * 0.1 + (on ? pulse(k) * 1.0 : 0);
      body.current.rotation.y = Math.sin(t * 0.6) * 0.1 + (on ? TAU * sm(k * 1.15) : 0);
      const th = 0.55 + Math.sin(t * (on ? 15 : 3.2)) * (on ? 0.45 : 0.22);
      wL.current.rotation.y = -th; wR.current.rotation.y = th;
      halo.current.rotation.set(Math.sin(t * 1.8) * 0.12, 0, Math.cos(t * 1.8) * 0.12);
      halo.current.scale.setScalar(1 + (on ? pulse(k) * 0.3 : 0));
      wand.current.rotation.z = Math.sin(t * 2) * 0.08 + (on ? Math.sin(k * 30) * 0.35 * pulse(k) : 0);
      star.current.rotation.z = t * 0.8;
      star.current.scale.setScalar(1 + Math.sin(t * 5) * 0.12 + (on ? 0.5 * pulse(k) : 0));
      sparks.current.forEach((s, i) => {
        if (!on) { s.scale.setScalar(0.001); return; }
        const a = (i / 6) * TAU + k * 2, r = k * 1.1;
        s.position.set(1.2 + Math.cos(a) * r, 0.65 + Math.sin(a) * r, 0.55);
        s.scale.setScalar(Math.max(0.001, pulse(k)));
        s.rotation.y = t * 6;
      });
      blink(eyes, t, 1);
    });
    const wing = (s, ref) => G({ ref, position: [s * 0.25, 0.1, -0.82] }, [
      P("sphere", [0.5, 8, 6], "#ffffff", { key: 0, position: [s * 0.55, 0.38, 0], scale: [1, 0.46, 0.22] }, E("#d9d0ff", 0.3)),
      P("sphere", [0.5, 8, 6], "#ffffff", { key: 1, position: [s * 0.8, 0.02, 0], scale: [0.95, 0.42, 0.22] }, E("#d9d0ff", 0.3)),
      P("sphere", [0.5, 8, 6], "#ffffff", { key: 2, position: [s * 0.55, -0.32, 0], scale: [0.75, 0.38, 0.22] }, E("#d9d0ff", 0.3))
    ]);
    return G({ ...pet.h }, [
      ...PED([
      // bantalan awan kristal low-poly
      ...[[0, 0.2, 0, 1.25], [1.05, 0.15, 0.2, 0.8], [-1.0, 0.15, 0.1, 0.85], [0.2, 0.12, 0.95, 0.75], [-0.2, 0.12, -0.9, 0.8]].map(([x, y, z, r], i) =>
        P("icosahedron", [r, 1], "#f6f0ff", { key: "c" + i, position: [x, y, z], scale: [1, 0.55, 1] }, { flatShading: true }))
      ]),
      G({ ref: pet.sq }, [
        G({ ref: body, position: [0, 1.95, 0] }, [
          Ball("#ffffff", E("#cfc8ff", 0.18), "ball"),
          N.jsx(Face, { eyes: "open", mouth: "soft", eyesRef: eyes }),
          P("sphere", [0.12, 8, 6], "#ff9db8", { position: [-0.62, -0.1, 0.77], scale: [1, 0.7, 0.3] }),
          P("sphere", [0.12, 8, 6], "#ff9db8", { position: [0.62, -0.1, 0.77], scale: [1, 0.7, 0.3] }),
          G({ ref: halo, position: [0, 1.4, 0] }, [P("torus", [0.42, 0.07, 6, 22], "#ffe27a", { "rotation-x": PI / 2 }, E("#ffd23a", 1.5))]),
          wing(-1, wL), wing(1, wR),
          // tongkat sihir + bintang emas
          G({ ref: wand, position: [1.15, -0.1, 0.5], "rotation-x": 0.44 }, [
            P("sphere", [0.17, 8, 6], "#ffffff", { key: "h" }),
            P("cylinder", [0.028, 0.028, 0.9, 6], "#fff3dc", { key: "s", position: [0, 0.3, 0] }),
            G({ key: "st", ref: star, position: [0, 0.8, 0] }, [
              P("sphere", [0.11, 8, 6], "#ffe27a", { key: "c" }, E("#ffd23a", 1.5)),
              ...Array.from({ length: 5 }, (_, i) => {
                const a = (i / 5) * TAU;
                return P("cone", [0.075, 0.24, 5], "#ffd23a", { key: i, position: [-Math.sin(a) * 0.14, Math.cos(a) * 0.14, 0], "rotation-z": a, scale: [1, 1, 0.6] }, E("#ffd23a", 1.5));
              })
            ])
          ]),
          // percikan bintang kecil (muncul saat klik)
          ...Array.from({ length: 6 }, (_, i) => P("octahedron", [0.08, 0], "#ffe27a", { key: "sp" + i, ref: (s) => (sparks.current[i] = s), scale: 0.001 }, E("#ffd23a", 1.5)))
        ])
      ]),
      N.jsx("pointLight", { position: [0, 3, 1.4], color: "#fff2b0", intensity: 5, distance: 8 })
    ]);
  }

  // --------------------------------------------------------------------------
  // 4. MAKAN SEHAT — "Nutri-Chef Ball"  (menggantikan FoodModel)
  //  Idle : mengunyah pelan, apel & gelas smoothie mengorbit sambil naik-turun
  //  Klik : MUNCH! pipi menggembung cepat, bola membal 3x, buah & gelas berputar kencang
  // --------------------------------------------------------------------------
  function FoodBall() {
    const body = K.useRef(), orbit = K.useRef(), eyes = K.useRef(), mouth = K.useRef(), tacos = K.useRef([]);
    const cheekL = K.useRef(), cheekR = K.useRef(), crown = K.useRef(), appleG = K.useRef(), glassG = K.useRef();
    const pet = usePet(1.4, (t, k, dt, S) => {
      const on = k >= 0;
      S.orb = (S.orb || 0) + dt * (0.5 + (on ? pulse(k) * 7 : 0));
      orbit.current.rotation.y = S.orb;
      appleG.current.position.y = Math.sin(t * 1.8) * 0.08;
      glassG.current.position.y = Math.sin(t * 1.8 + 2) * 0.08;
      const amt = on ? 1 : 0.35, ch = Math.sin(t * (on ? 16 : 5));
      mouth.current.scale.set(1 - 0.15 * amt * ch, 1 + 0.45 * amt * ch, 1);
      const puff = 1 + 0.12 * amt * Math.sin(t * (on ? 16 : 5) + PI / 2);
      cheekL.current.scale.setScalar(puff); cheekR.current.scale.setScalar(puff);
      body.current.position.y = 1.15 + (on ? Math.abs(Math.sin(k * 3 * PI)) * 0.28 : Math.abs(Math.sin(t * 2.2)) * 0.04);
      body.current.rotation.z = Math.sin(t * 1.1) * 0.04 + (on ? Math.sin(k * 3 * TAU) * 0.1 : 0);
      crown.current.scale.setScalar(1 + (on ? 0.15 * Math.abs(Math.sin(k * 3 * PI)) : Math.sin(t * 3) * 0.02));
      // ===== EASTER EGG (Pulau Awan): HUJAN TACO saat diklik =====
      if (S.rainOn) {
        S.rain += dt;
        let any = false;
        tacos.current.forEach((g, i) => {
          const c = S.tk[i], u = S.rain - c.d;
          if (u < 0) { g.scale.setScalar(0.001); any = true; return; }
          const f = u / c.dur;
          if (f < 1) {                                   // jatuh sambil berputar
            g.position.set(c.x, 0.3 + 8 * (1 - f * f), c.z);
            g.rotation.set(u * c.sp * 0.5, u * c.sp, 0.4 * Math.sin(u * 4 + i));
            g.scale.setScalar(Math.min(1, u * 6) * c.s); any = true;
          } else {                                       // mendarat, memantul, lalu menghilang
            const l = u - c.dur;
            g.rotation.set(0, c.sp * c.dur, 0);
            if (l < 2.0) { g.position.set(c.x, 0.3 + Math.abs(Math.sin(l * 8)) * 0.55 * Math.exp(-l * 3.2), c.z); g.scale.setScalar(c.s); any = true; }
            else if (l < 2.5) { g.position.set(c.x, 0.3, c.z); g.scale.setScalar(Math.max(0.001, c.s * (1 - (l - 2.0) / 0.5))); any = true; }
            else g.scale.setScalar(0.001);
          }
        });
        if (!any) S.rainOn = false;
      }
      blink(eyes, t, 2);
    }, (S) => {
      if (LAND) return;
      S.rain = 0; S.rainOn = true;
      S.tk = Array.from({ length: TACO_N }, (_, i) => ({
        d: i * 0.12 + Math.random() * 0.25, dur: 0.75 + Math.random() * 0.4,
        x: (Math.random() - 0.5) * 7, z: (Math.random() - 0.5) * 6 + 0.6,
        sp: (Math.random() < 0.5 ? -1 : 1) * (3 + Math.random() * 4), s: 0.9 + Math.random() * 0.5
      }));
    });
    // taco low-poly: cangkang U + isian selada, tomat, keju
    const taco = (i) => G({ key: "tc" + i, ref: (g) => (tacos.current[i] = g), scale: 0.001 }, [
      P("cylinder", [0.3, 0.3, 0.78, 10, 1, true, 0, PI], "#f2c46d", { key: "s", "rotation-z": -PI / 2, scale: [1, 1, 0.8] }, { side: 2 }),
      P("sphere", [0.2, 7, 5], "#7ed36a", { key: "l", position: [0, 0.02, 0], scale: [2.0, 0.5, 0.9] }),
      P("sphere", [0.09, 6, 5], "#ff4d4d", { key: "t1", position: [-0.2, 0.1, 0] }),
      P("sphere", [0.09, 6, 5], "#ff4d4d", { key: "t2", position: [0.17, 0.1, 0.04] }),
      P("box", [0.2, 0.04, 0.2], "#ffd84a", { key: "c", position: [0, 0.11, -0.04], "rotation-y": 0.5 })
    ]);
    return G({ ...pet.h }, [
      ...PED([
      // nampan kayu bundar
      P("cylinder", [1.55, 1.6, 0.1, 26], "#f1d9b5", { position: [0, 0.05, 0] }),
      P("torus", [1.58, 0.06, 6, 30], "#c79a6a", { position: [0, 0.1, 0], "rotation-x": PI / 2 })
      ]),
      G({ ref: pet.sq }, [
        G({ ref: body, position: [0, 1.15, 0] }, [
          Ball("#7ed36a", {}, "ball"),
          N.jsx(Face, { eyes: "open", mouth: "chew", eyesRef: eyes, mouthRef: mouth }),
          P("sphere", [0.22, 8, 6], "#8fe07a", { position: [-0.66, -0.02, 0.72], ref: cheekL }),
          P("sphere", [0.22, 8, 6], "#8fe07a", { position: [0.66, -0.02, 0.72], ref: cheekR }),
          // mahkota: selada keriting + 3 tomat ceri + 3 irisan timun
          G({ ref: crown, position: [0, 0.95, 0] }, [
            ...[0, 1, 2, 3].map((i) => {
              const a = (i / 4) * TAU + 0.4;
              return P("icosahedron", [0.3, 0], "#a8d86a", { key: "l" + i, position: [Math.cos(a) * 0.36, 0, Math.sin(a) * 0.36], scale: [1.3, 0.35, 0.8], "rotation-y": -a });
            }),
            ...[0, 1, 2].map((i) => {
              const a = (i / 3) * TAU + 0.5;
              return P("sphere", [0.15, 8, 6], "#ff4d4d", { key: "t" + i, position: [Math.cos(a) * 0.3, 0.13, Math.sin(a) * 0.3] }, { roughness: 0.35 });
            }),
            ...[0, 1, 2].map((i) => {
              const a = (i / 3) * TAU + 2.6;
              return P("cylinder", [0.19, 0.19, 0.05, 10], "#b9f0a8", { key: "c" + i, position: [Math.cos(a) * 0.32, 0.06, Math.sin(a) * 0.32], "rotation-x": 0.3 });
            })
          ]),
          // kubah mangkuk keramik putih di punggung + pisang & jeruk di puncaknya
          P("sphere", [0.6, 14, 8, 0, TAU, 0, PI / 2], "#ffffff", { position: [0, -0.1, -0.8], "rotation-x": -PI / 2 }, { roughness: 0.4 }),
          P("torus", [0.4, 0.09, 6, 12, PI * 0.7], "#ffd84a", { position: [0, 0.12, -1.4], "rotation-z": PI * 0.15 }),
          P("sphere", [0.22, 10, 8], "#ffa63d", { position: [0.28, -0.32, -1.4] }, { roughness: 0.4 })
        ]),
        // apel (kanan) & gelas smoothie (kiri) mengorbit
        G({ ref: orbit, position: [0, 1.75, 0] }, [
          G({ ref: appleG, position: [1.45, 0, 0] }, [
            P("sphere", [0.27, 10, 8], "#ff5a6e", { key: "a" }, { roughness: 0.35 }),
            P("box", [0.04, 0.12, 0.04], "#6b4a2b", { key: "s", position: [0, 0.28, 0] }),
            P("sphere", [0.1, 6, 5], "#4fbf5f", { key: "l", position: [0.09, 0.3, 0], scale: [1, 0.3, 0.6] })
          ]),
          G({ ref: glassG, position: [-1.45, 0, 0] }, [
            P("cylinder", [0.22, 0.17, 0.5, 10], "#bff7c9", { key: "g" }, E("#7ee08a", 0.25)),
            P("box", [0.04, 0.5, 0.04], "#ff9db8", { key: "s", position: [0.06, 0.3, 0], "rotation-z": -0.2 })
          ])
        ])
      ]),
      ...Array.from({ length: TACO_N }, (_, i) => taco(i)),
      N.jsx("pointLight", { position: [0, 3, 0.5], color: "#d8ffd0", intensity: 4, distance: 6 })
    ]);
  }

  // --------------------------------------------------------------------------
  // 5. BELAJAR — "Scholar Book Ball"  (menggantikan BookModel)
  //  Idle : melayang pelan sambil menoleh membaca, halaman buku berbalik berkala, kubus cahaya naik
  //  Klik : KILAT PENGETAHUAN! halaman dibalik cepat, kubus berhamburan, bola mengangguk, kacamata naik
  // --------------------------------------------------------------------------
  function BookBall() {
    const body = K.useRef(), page = K.useRef(), cubes = K.useRef([]);
    const eyes = K.useRef(), mouth = K.useRef();
    const pet = usePet(1.5, (t, k, dt, S) => {
      const on = k >= 0;
      body.current.position.y = 1.7 + Math.sin(t * 1.3) * 0.05 + (on ? Math.abs(Math.sin(k * 2 * PI)) * 0.3 : 0);
      body.current.rotation.y = Math.sin(t * 0.9) * 0.1;
      body.current.rotation.x = on ? Math.sin(k * TAU * 2) * 0.14 : 0;
      S.p = (S.p || 0) + dt * (0.45 + (on ? 2.4 : 0));
      const s = S.p % 1, o = s < 0.15 ? 0 : s > 0.85 ? 1 : (s - 0.15) / 0.7;
      page.current.rotation.z = 0.22 + sm(o) * (PI - 0.44);
      S.c = (S.c || 0) + dt * (0.25 + (on ? 1.2 : 0));
      const r = 0.7 + (on ? pulse(k) * 0.7 : 0);
      cubes.current.forEach((c, i) => {
        const h = (S.c + i / 6) % 1, a = (i / 6) * TAU + t * 0.8;
        c.position.set(Math.cos(a) * r, 2.85 + h * 0.9, Math.sin(a) * r);
        c.scale.setScalar(Math.max(0.001, Math.sin(h * PI)) * (on ? 1.4 : 1));
        c.rotation.set(t + i, t * 1.3 + i, 0);
      });
      blink(eyes, t, 0.7);
    });
    const ring = (x) => P("torus", [0.15, 0.025, 6, 16], "#ffd166", { key: "r" + x, position: [x, 0.1, 0.95], "rotation-y": Math.atan2(x, 0.935) }, { roughness: 0.4 });
    const cover = (s) => G({ key: "cv" + s, "rotation-z": -s * 0.22 }, [
      P("box", [0.8, 0.06, 0.9], "#7a5ac8", { key: "c", position: [s * 0.4, -0.04, 0] }),
      P("box", [0.74, 0.07, 0.82], "#fffaf0", { key: "p", position: [s * 0.4, 0.04, 0] }, E("#fff3c8", 0.4))
    ]);
    return G({ ...pet.h }, [
      ...PED([
      // tumpukan buku datar sebagai alas
      P("box", [2.0, 0.22, 1.5], "#e0527a", { position: [0, 0.11, 0] }),
      P("box", [1.8, 0.22, 1.35], "#4fb3d9", { position: [0, 0.33, 0], "rotation-y": 0.15 }),
      P("box", [1.6, 0.22, 1.2], "#ffd166", { position: [0, 0.55, 0], "rotation-y": -0.1 })
      ]),
      G({ ref: pet.sq }, [
        G({ ref: body, position: [0, 1.7, 0] }, [
          Ball("#7a5ac8", {}, "ball"),
          N.jsx(Face, { eyes: "open", mouth: "smile", eyesRef: eyes, mouthRef: mouth }),
          // buku terbuka di depan dada (satu halaman berputar di jilid tengah)
          G({ position: [0, -0.55, 0.92], "rotation-x": 0.85 }, [
            cover(-1), cover(1),
            G({ ref: page, position: [0, 0.08, 0], "rotation-z": 0.22 }, [
              P("box", [0.7, 0.02, 0.8], "#fffaf0", { position: [0.36, 0, 0] }, E("#fff3c8", 0.4))
            ])
          ]),
          P("sphere", [0.16, 8, 6], "#7a5ac8", { position: [-0.85, -0.6, 0.9] }),
          P("sphere", [0.16, 8, 6], "#7a5ac8", { position: [0.85, -0.6, 0.9] }),
          // 3 punggung buku di belakang
          P("box", [0.95, 0.24, 0.36], "#ffd166", { position: [0, -0.35, -0.9], "rotation-y": 0.08 }),
          P("box", [0.9, 0.24, 0.36], "#4fb3d9", { position: [0, -0.08, -0.92], "rotation-y": -0.06 }),
          P("box", [0.85, 0.24, 0.36], "#e0527a", { position: [0, 0.19, -0.9], "rotation-y": 0.05 })
        ])
      ]),
      // 6 kubus cahaya pengetahuan
      ...Array.from({ length: 6 }, (_, i) => P("box", [0.13, 0.13, 0.13], "#fff3b0", { key: "q" + i, ref: (c) => (cubes.current[i] = c) }, E("#ffe27a", 1.2))),
      N.jsx("pointLight", { position: [0, 3, 1.2], color: "#fff3c8", intensity: 5, distance: 7 })
    ]);
  }

  // --------------------------------------------------------------------------
  // 6. ORANG SEKITAR — "Community Hub Ball"  (menggantikan PeopleModel)
  //  Idle : bola utama melambai, 6 bola mini mengorbit pelan sambil melompat kecil, 3 gelembung chat berdenyut
  //  Klik : GELOMBANG MELOMPAT! 6 sahabat melompat + berputar bergiliran, bola utama berputar, gelembung mekar
  // --------------------------------------------------------------------------
  function PeopleBall() {
    const DUR = 1.8;
    const body = K.useRef(), hand = K.useRef(), eyes = K.useRef(), minis = K.useRef([]), bubbles = K.useRef([]);
    const minisColor = ["#8ecae6", "#ffd166", "#95d5b2", "#cdb4db", "#ffafcc", "#a0c4ff"];
    const pet = usePet(DUR, (t, k, dt, S) => {
      const on = k >= 0;
      S.o = (S.o || 0) + dt * 0.25;
      minis.current.forEach((g, i) => {
        const a = S.o + (i / 6) * TAU;
        let hop = Math.abs(Math.sin(t * 2.2 + i * 1.1)) * 0.15, spin = 0;
        if (on) {
          const u = (k * DUR - i * 0.17) / 0.55;
          if (u > 0 && u < 1) { hop += Math.sin(u * PI) * 0.95; spin = TAU * u; }
        }
        g.position.set(Math.cos(a) * 2.0, 0.52 + hop, Math.sin(a) * 2.0);
        g.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a)) + spin;
      });
      body.current.position.y = 1.12 + Math.abs(Math.sin(t * 2)) * 0.05 + (on ? pulse(k * 1.6) * 0.5 : 0);
      body.current.rotation.y = on ? TAU * sm(k * 1.2) : 0;
      const wt = t * (on ? 14 : 5);
      hand.current.position.set(1.1 + Math.cos(wt) * 0.05, 0.3 + Math.sin(wt) * 0.18, 0.35);
      bubbles.current.forEach((b, i) =>
        b.scale.setScalar((0.6 + 0.4 * Math.max(0, Math.sin(t * 4 - i * 0.8))) * (on ? 1 + 0.6 * pulse(k) : 1)));
      blink(eyes, t, 1.3);
    });
    const mini = (i) => G({ key: i, ref: (g) => (minis.current[i] = g) }, [
      P("sphere", [0.4, 10, 7], minisColor[i], { key: "b" }),
      P("sphere", [0.045, 6, 5], INK, { key: "e1", position: [-0.14, 0.07, 0.365] }),
      P("sphere", [0.045, 6, 5], INK, { key: "e2", position: [0.14, 0.07, 0.365] }),
      P("torus", [0.08, 0.016, 4, 8, 2.4], INK, { key: "m", position: [0, 0.02, 0.38], "rotation-z": -PI / 2 - 1.2 })
    ]);
    return G({ ...pet.h }, [
      ...PED([
      // piringan ganda pink muda
      P("cylinder", [2.55, 2.55, 0.1, 24], "#ffb3c6", { position: [0, 0.05, 0] }),
      P("cylinder", [1.95, 1.95, 0.08, 22], "#ffd6e0", { position: [0, 0.12, 0] })
      ]),
      G({ ref: pet.sq }, [
        G({ ref: body, position: [0, 1.12, 0] }, [
          Ball("#ff8fab", {}, "ball"),
          N.jsx(Face, { eyes: "open", mouth: "grin", eyesRef: eyes }),
          P("torus", [0.87, 0.16, 5, 18], "#ffd166", { position: [0, -0.5, 0], "rotation-x": PI / 2 }),   // syal/kerah hangat
          G({ ref: hand, position: [1.1, 0.3, 0.35] }, [P("sphere", [0.2, 8, 6], "#ff8fab")]),
          P("sphere", [0.2, 8, 6], "#ff8fab", { position: [-1.1, -0.25, 0.3] }),
          ...[0, 1, 2].map((i) => P("sphere", [0.13, 8, 6], "#ffffff", { key: "ch" + i, ref: (b) => (bubbles.current[i] = b), position: [-0.4 + i * 0.4, i === 1 ? 1.8 : 1.55, 0] }, E("#ffffff", 0.9)))
        ])
      ]),
      ...[0, 1, 2, 3, 4, 5].map(mini),
      N.jsx("pointLight", { position: [0, 3, 0], color: "#ffd6e8", intensity: 6, distance: 8 })
    ]);
  }

  // --------------------------------------------------------------------------
  // 7. BANGUN PAGI — "Twin-Bell Alarm Ball"  (menggantikan ClockModel)
  //  Idle : goyang tik-tok tiap detik, jarum jam mengikuti jam perangkat, mata spiral berputar, lonceng sesekali berdering
  //  Klik : ALARM BERBUNYI! badan bergetar, lonceng bergoyang hebat, jarum berputar cepat, mata spiral ngebut
  //  Opsi : { deviceTime: false } -> jarum diam di 10:09, { ringRate } -> kecepatan dering idle
  // --------------------------------------------------------------------------
  function makeClockFace() {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const x = c.getContext("2d"), m = 256, T = Math.PI * 2;
    const g = x.createRadialGradient(m, m, 20, m, m, m);
    g.addColorStop(0, "#f6f0d6"); g.addColorStop(0.85, "#ece4c2"); g.addColorStop(1, "#cfc7a6");
    x.fillStyle = g; x.fillRect(0, 0, 512, 512);
    x.strokeStyle = "#1a1a1a"; x.fillStyle = "#1a1a1a"; x.lineCap = "round";
    x.lineWidth = 3;
    [238, 214].forEach((r) => { x.beginPath(); x.arc(m, m, r, 0, T); x.stroke(); });
    for (let i = 0; i < 60; i++) {            // garis menit
      const a = (i / 60) * T, big = i % 5 === 0, r2 = big ? 238 : 226;
      x.lineWidth = big ? 3 : 1.5;
      x.beginPath(); x.moveTo(m + Math.sin(a) * 214, m - Math.cos(a) * 214); x.lineTo(m + Math.sin(a) * r2, m - Math.cos(a) * r2); x.stroke();
    }
    x.font = "bold 64px Georgia, 'Times New Roman', serif"; x.textAlign = "center"; x.textBaseline = "middle";
    for (let i = 1; i <= 12; i++) {           // angka 1-12
      const a = (i / 12) * T;
      x.fillText(String(i), m + Math.sin(a) * 168, m - Math.cos(a) * 168 + 4);
    }
    return c;
  }

  function ClockBall({ deviceTime = true, ringRate = 1.1 }) {
    const DUR = 1.6;
    const body = K.useRef(), hourH = K.useRef(), minH = K.useRef(), bellL = K.useRef(), bellR = K.useRef();
    const eyes = K.useRef(), mouth = K.useRef();
    const face = K.useMemo(() => makeClockFace(), []);
    const pet = usePet(DUR, (t, k, dt, S) => {
      const on = k >= 0, d = new Date();
      const cr = on ? (k < 0.8 ? 1 : 1 - (k - 0.8) / 0.2) : 0;               // kekuatan dering saat klik
      const mm = deviceTime ? d.getMinutes() + d.getSeconds() / 60 : 9.5;
      const hh = deviceTime ? (d.getHours() % 12) + mm / 60 : 10 + mm / 60;
      S.hs = (S.hs || 0) + dt * 18 * cr;
      minH.current.rotation.z = -(mm / 60) * TAU - S.hs;
      hourH.current.rotation.z = -(hh / 12) * TAU - S.hs / 12;
      const q = Math.max(0, Math.sin(t * ringRate - 1.2)), idle = q * q * q;  // dering idle berkala
      const w = Math.sin(t * 45) * Math.max(idle * 0.6, cr);
      const tickT = (Math.floor(t) % 2 ? 1 : -1) * 0.035;                      // tik-tok
      S.tick = (S.tick || 0) + (tickT - (S.tick || 0)) * Math.min(1, dt * 18);
      body.current.rotation.z = S.tick + w * 0.05;
      body.current.rotation.x = on ? Math.sin(t * 38) * 0.03 * cr : 0;
      body.current.position.y = 1.2 + cr * Math.abs(Math.sin(t * 30)) * 0.05;
      bellL.current.rotation.z = 0.25 + w * 0.2;
      bellR.current.rotation.z = -0.25 - w * 0.2;
      S.es = (S.es || 0) + dt * (2.5 + cr * 16);
      eyes.current.children.forEach((c, i) => (c.rotation.z = (i ? 1 : -1) * S.es));
    }, () => { window.dispatchEvent(new Event("kaih-alarm-ring")); });
    const hand = (L, w) => [
      P("box", [w, L * 0.7, 0.015], "#141414", { key: "a", position: [0, L * 0.3, 0] }),
      P("cone", [w * 0.9, L * 0.35, 3], "#141414", { key: "b", position: [0, L * 0.78, 0] })
    ];
    const bell = (s, ref) => G({ key: "bell" + s, position: [s * 0.58, 0.85, 0] }, [
      G({ ref, "rotation-z": s < 0 ? 0.25 : -0.25 }, [
        P("sphere", [0.38, 14, 8, 0, TAU, 0, PI / 2], "#f4f4f0", { key: "d", scale: [1, 0.75, 1] }, { side: 2, roughness: 0.32, metalness: 0.2 }),
        P("torus", [0.38, 0.025, 6, 20], "#dfe3ee", { key: "r", "rotation-x": PI / 2 }, SILVER),
        P("cylinder", [0.05, 0.06, 0.14, 8], "#dfe3ee", { key: "k", position: [0, 0.3, 0] }, SILVER)
      ])
    ]);
    return G({ ...pet.h }, [
      G({ ref: pet.sq }, [
        // 3 kaki kerucut perak (2 depan, 1 belakang)
        P("cone", [0.1, 0.45, 8], "#dfe3ee", { position: [-0.5, 0.225, 0.35], "rotation-x": PI }, SILVER),
        P("cone", [0.1, 0.45, 8], "#dfe3ee", { position: [0.5, 0.225, 0.35], "rotation-x": PI }, SILVER),
        P("cone", [0.1, 0.45, 8], "#dfe3ee", { position: [0, 0.3, -0.5], "rotation-x": PI }, SILVER),
        G({ ref: body, position: [0, 1.2, 0] }, [
          Ball("#f4f4f0", {}, "ball"),
          // muka jam krem timbul dengan bezel membulat
          P("cylinder", [0.62, 0.62, 0.3, 24, 1, true], "#f4f4f0", { position: [0, 0, 0.9], "rotation-x": PI / 2 }, { side: 2 }),
          P("torus", [0.62, 0.06, 6, 22], "#f4f4f0", { position: [0, 0, 1.03] }),
          N.jsxs("mesh", {
            position: [0, 0, 1.03],
            children: [
              N.jsx("circleGeometry", { args: [0.6, 40] }),
              N.jsx("meshStandardMaterial", { roughness: 0.7, emissive: "#ffffff", emissiveIntensity: 0.12, children: N.jsx("canvasTexture", { attach: "map", args: [face] }) })
            ]
          }),
          N.jsx(Face, { eyes: "dizzy", mouth: "none", flat: 1.06, ey: 0.1, ex: 0.2, my: -0.26, eyesRef: eyes, mouthRef: mouth }),
          // jarum jam + poros perak
          G({ position: [0, 0, 1.065] }, [
            G({ key: "h", ref: hourH }, hand(0.32, 0.05)),
            G({ key: "m", ref: minH, position: [0, 0, 0.012] }, hand(0.48, 0.04)),
            P("cylinder", [0.045, 0.045, 0.04, 12], "#dfe3ee", { key: "p", position: [0, 0, 0.03], "rotation-x": PI / 2 }, SILVER)
          ]),
          // dua lonceng kembar + gagang melengkung + palu
          bell(-1, bellL), bell(1, bellR),
          P("torus", [0.58, 0.04, 6, 24, PI], "#dfe3ee", { position: [0, 1.15, 0] }, SILVER),
          P("cylinder", [0.015, 0.015, 0.45, 6], "#dfe3ee", { position: [0, 1.1, -0.04] }, SILVER),
          P("sphere", [0.06, 8, 6], "#dfe3ee", { position: [0, 1.36, -0.04] }, SILVER),
          // punggung hitam + 2 kenop pemutar pegas
          P("sphere", [1.025, 16, 5, 0, TAU, 0, 0.62], "#141414", { "rotation-x": -PI / 2 }),
          ...[-0.25, 0.25].flatMap((x) => [
            P("cylinder", [0.04, 0.04, 0.22, 6], "#dfe3ee", { key: "ks" + x, position: [x, 0.1, -1.13], "rotation-x": PI / 2 }, SILVER),
            P("box", [0.2, 0.07, 0.05], "#dfe3ee", { key: "kh" + x, position: [x, 0.1, -1.25] }, SILVER)
          ])
        ])
      ])
    ]);
  }

  // --------------------------------------------------------------------------
  // DAFTAR KONFIGURASI OBJEK DI PULAU AWAN (Posisi, Teks Pop-up, Statistik)
  // Model sekarang lebih kecil & bulat, jadi anchor (titik bubble), focus (kamera), dan ring
  // (lingkaran di tanah) ikut diperkecil. Posisi di pulau & teks info TIDAK diubah.
  // --------------------------------------------------------------------------
  const zm = [
    {
      id: "treadmill", type: "treadmill", position: [-8, 1.4, 3], rotation: 0.8, props: {},
      anchor: [0, 3.4, 0], focus: { offset: [0, 1.3, 0], distance: 12 }, ring: { r: 2.0, offset: [0, 0] },
      info: { icon: "🏃", title: "Olahraga", desc: "Tubuh yang bergerak biasanya membuat pikiran lebih ringan. Ganti teks ini sesukamu.", stats: [["Kebiasaan", "30 menit/hari"], ["Rasanya", "Segar"]] }
    },
    {
      id: "bed", type: "bed", position: [-7, 1.4, -6], rotation: 0.5, props: {},
      anchor: [0, 4.4, 0], focus: { offset: [0, 1.8, 0], distance: 13 }, ring: { r: 2.0, offset: [0, 0] },
      info: { icon: "🛌", title: "Tidur", desc: "Waktu istirahat: semua pikiran ditaruh dulu, besok dilanjutkan lagi.", stats: [["Jam tidur", "7–8 jam"], ["Mimpi", "Kadang aneh"]] }
    },
    {
      id: "angel", type: "angel", position: [0, 1.4, -1.5], rotation: 0.4, props: {},
      anchor: [0, 4.3, 0], focus: { offset: [0, 2.2, 0], distance: 12 }, ring: { r: 1.9, offset: [0, 0] },
      info: { icon: "😇", title: "Suara Hati", desc: "Si malaikat kecil yang mengingatkan untuk bersikap baik, termasuk pada diri sendiri.", stats: [["Pesan hari ini", "Tidak apa-apa"], ["Sifat", "Lembut"]] }
    },
    {
      id: "food", type: "food", position: [7.5, 1.4, -6.5], rotation: -0.6, props: {},
      anchor: [0, 3.5, 0], focus: { offset: [0, 1.5, 0], distance: 12 }, ring: { r: 2.1, offset: [0, 0] },
      info: { icon: "🥗", title: "Makan Sehat", desc: "Sayur, buah, dan air putih. Pikiran juga butuh bahan bakar yang baik.", stats: [["Porsi sayur", "5 per hari"], ["Air", "8 gelas"]] }
    },
    {
      id: "book", type: "book", position: [9.5, 1.4, 3], rotation: -0.8, props: {},
      anchor: [0, 4.5, 0], focus: { offset: [0, 2.0, 0], distance: 12 }, ring: { r: 1.9, offset: [0, 0] },
      info: { icon: "📖", title: "Belajar", desc: "Satu halaman setiap hari. Rasa ingin tahu adalah bahan bakar yang tidak habis.", stats: [["Target", "10 halaman"], ["Topik", "Bebas"]] }
    },
    {
      id: "people", type: "people", position: [1, 1.4, 8], rotation: 0, props: {},
      anchor: [0, 3.4, 0], focus: { offset: [0, 1.2, 0], distance: 14 }, ring: { r: 2.9, offset: [0, 0] },
      info: { icon: "👥", title: "Orang Sekitar", desc: "Keluarga, teman, dan tetangga. Obrolan kecil yang membuat hari terasa hangat.", stats: [["Obrolan", "Setiap hari"], ["Suasana", "Hangat"]] }
    },
    {
      id: "clock", type: "clock", position: [-3, 1.4, -10], rotation: 0.35, props: {},
      anchor: [0, 3.5, 0], focus: { offset: [0, 1.6, 0], distance: 12 }, ring: { r: 1.8, offset: [0, 0] },
      info: { icon: "⏰", title: "Bangun Pagi", desc: "Mulai hari dengan bangun lebih awal. Badan segar, hati senang, dan semua terasa lebih mudah.", stats: [["Alarm", "05.30"], ["Rasanya", "Segar"]] }
    }
  ];

  const xj = {
    treadmill: SportBall,
    bed: SleepBall,
    angel: AngelBall,
    food: FoodBall,
    book: BookBall,
    people: PeopleBall,
    clock: ClockBall
  };

  return { zm, xj };
}

// --- ditambahkan agar bisa dimuat dengan <script> biasa (tanpa server) ---
window.KAIH_createModels = createKaihModels;
