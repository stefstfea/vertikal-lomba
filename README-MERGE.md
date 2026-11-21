# Gabungan: Menu_v3 (utama) + cutscene & Ladang Langit dari Phase3_9

## Dipertahankan dari file utama (Menu_v3)
- Menu utama v2: `css/menu-v2.css`, `src/prelude/menu-v2.js`, `src/prelude/menu-audio.js`, logo baru, markup `menu-row` di `index.html`, `src/boot/settings.js` (tombol Settings dari menu).
- Pulau Awan versi baru (rumput + bibir + batu, awan cumulus, kolam, air terjun) di `js/vendor/pulau-awan-bundle.js`.

## Diambil dari Phase3_9
- Cutscene keluar Pulau Awan (badai: Guide melebur, langit gelap, petir, angin meniup 7 bola, jatuh menembus awan) -> blok `KXT/KXLT/KXexitFx/KXFinale` + shader langit `uStorm/uFlash` di bundle; SFX baru di `src/prelude/dashboard-host.js`; `seqExit`/`seqLadang` di `src/guide/guide.js`; teks pintu/dialog di `guide-map.js` & `index.html`; tombol Skip (`skip-ctl.js`).
- Ladang Langit: `intro.js` (petir -> retakan dimensi -> dunia terbelah), `cam-pan.js` (geser kamera HP), `camera-mode.js`, `drag.js`, `loader.js`, `manifest.js` (30 modul), `body.js`, `tools/module-manifest.json`.

## Diarsipkan (tidak lagi dipakai Ladang Langit baru)
`_old/ladang-lama-dashboard/`: `portal.js`, `holy-sky.js`, `dashboard.js`, `dashboard-host_lama.js`, `index_menu_v3_asli.html`.

## Catatan
- CSS dashboard/impact/starburst dihapus dari `main.css` & `runtime.css` (elemennya sudah tidak ada di `index.html`).
- Sudah dicek: `node --check` semua JS lolos, semua file yang direferensikan ada. Belum diuji di browser (butuh CDN three.js/cannon.js).
