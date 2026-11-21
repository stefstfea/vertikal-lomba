# 7KAIH v12 — hasil ekstraksi modular

Source of truth: `7KAIH-Cloud-Island-Cute-Balls-Merged-v12.html`.

## Isi
- `js/vendor/pulau-awan-bundle.js`: inline ES module Pulau Awan dari master, dipindahkan tanpa mengubah isi.
- `src/landscape/modules/`: 32 modul aktif Ladang Langit sesuai urutan manifest asli.
- `src/landscape/manifest.js`: daftar nama dan path modul aktif.
- `src/landscape/body.js` dan `css.js`: payload DOM dan CSS dunia yang sebelumnya ditanam dalam assignment global.
- `assets/audio/*.b64.js`: dua data URI audio Base64 yang dipisahkan dari script audio gabungan.
- `src/prelude/`: script prelude asli yang dipisahkan.

## Kontrak yang dipertahankan
- Shader GLSL / `THREE.ShaderMaterial` tetap berada di modul pemiliknya.
- Tidak ada ekstraksi shader ke folder terpisah.
- Urutan 32 modul tetap sama dengan `window.__LANDSCAPE_SCRIPT_NAMES__` pada v12.
- `window.KAIH` dan `K.hooks[]` tidak diubah dalam source modul.
- Loader tetap memuat modul satu per satu; perubahan hanya dari injeksi inline menjadi pemuatan file fisik berurutan.

## Menjalankan
Jalankan Live Server dari root folder ini. Pastikan browser dapat mengakses CDN Three.js r128 dan Cannon.js 0.6.2 sebagaimana pada master.

Catatan: `js/vendor/pulau-awan-bundle.js` adalah nama packaging untuk inline ES module aplikasi Pulau Awan yang memang tertanam dalam master, bukan file vendor pihak ketiga terpisah. Master tidak menyertakan bundle vendor terpisah dengan nama tersebut.
