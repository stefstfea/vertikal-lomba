# 7 KAIH — FASE 2: modularisasi JavaScript

## Cara memakai di proyek Anda (`7kaih-modular`)
1. Salin 3 file dari folder `tools-saja/` ke `7kaih-modular/tools/`.
2. Di folder proyek: `python tools/phase2_modularize.py`
   (otomatis membuat `index.phase1.backup.html`, mengekstrak, lalu menjalankan verifikasi).
3. Jalankan lewat server lokal: `python tools/serve.py` → http://localhost:8000/
   (`<script type="module" src>` tidak bisa dibuka dengan klik dua kali / `file://`).

`hasil-contoh-dari-v12/` adalah hasil yang sama, dibuat dari file v12 yang Anda unggah
(CSS di `index.html`-nya masih inline karena v12 belum melalui Fase 1). Isi `js/`, `src/`,
`assets/audio/` identik dengan yang akan dibuat alat dari `index.html` Fase 1.

## Struktur
    index.html                 DOM murni + 0 script inline
    js/vendor/pulau-awan-bundle.js   blok module Pulau Awan UTUH (React/R3F/Three r160 + kode 7 KAIH)
    src/main.js                entry ES module (deps-check -> bundel)
    src/core/deps-check.js     peringatan console jika CDN Three/Cannon gagal
    src/boot/                  settings.js (paling awal di <head>), skip-ctl.js
    src/prelude/               fx-canvas, menu-audio, bubble-ripple, dashboard-host, cutscene-sfx, cutscene
    src/landscape/             manifest.js (urutan 32 modul), body.js, css.js, loader.js
    src/modules/               32 modul aktif Ladang Langit, nama asli, byte-identik
    src/modules/_old/          25 modul *_old (tidak pernah dimuat)
    assets/audio/              menu-music.b64.js, world-music.b64.js (data-URI dipisah dari menu-audio.js)
    tools/                     phase2_modularize.py, verify_phase2.py, serve.py, phase2-manifest.json

## Perubahan yang disengaja (selain memindahkan kode)
1. `loader.js`: modul tidak lagi string inline; di-fetch paralel, lalu tetap dijalankan
   berurutan & sinkron saat handoff (textContent, sourceURL sama). Logika lain tak diubah.
2. `menu-audio.js`: dua literal base64 diganti `window.__KAIH_AUDIO__.menu/.world`
   (data dipindah ke assets/audio/). File dari 10,6 MB menjadi 24 KB.
3. Skrip klasik lain tetap `<script src>` berurutan di posisi aslinya (bukan di main.js) agar
   urutan eksekusi, scope global, dan listener DOMContentLoaded tidak berubah.
4. Tambahan: `<link rel="modulepreload">` untuk bundel (hanya petunjuk performa).

## Verifikasi
`python tools/verify_phase2.py` merekonstruksi setiap blok inline asli dari file hasil
ekstraksi dan membandingkan SHA-256-nya dengan aslinya, memeriksa index.html bebas script
inline, dan menjalankan cek sintaks (jika Node ada).
Catatan: skrip hash Fase 1 yang memeriksa `index.html` perlu disesuaikan karena isinya berubah.
