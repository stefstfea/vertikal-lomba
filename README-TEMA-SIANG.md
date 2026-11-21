# Tema "Daylight Fantasy" (Fase 3.2)

Menu awal + Pulau Awan diubah dari "dreamy night" ungu menjadi siang cerah penuh awan (mirip Ladang Langit). Bentuk dan animasi tidak diubah; hanya warna/shading.

## Yang berubah
- **Langit Pulau Awan** (`js/vendor/pulau-awan-bundle.js`, shader `jW`): gradasi biru cerah + awan prosedural di atas cakrawala dan lautan awan di bawahnya (bintang/nebula dihapus).
- **Bulan -> Matahari** (komponen `JW`): cakram + pendar dan sinar; posisi di langit sama seperti bulan (arah dinaikkan sedikit).
- **Malaikat terbang** (`KXAng`): dihapus. (Teman "Suara Hati" tetap ada karena itu salah satu teman/objek kebiasaan.)
- **Pulau**: permukaan hijau cerah, tepi dan sisi bawah awan putih, bukit kecil hijau muda, pohon hijau (3 rona), batang cokelat, awan melayang putih (jumlah ditambah 6 -> 16), islet jauh hijau, burung putih, planet jauh jadi biru muda, lentera lebih redup.
- **Pencahayaan**: hemisphere biru langit + pantulan hijau, matahari hangat, fill biru muda, bounce bawah biru muda. Pecahan pulau pada animasi finale ikut hijau.
- **Menu & prelude** (`css/runtime.css`, `cloud-transition.css`, `world-interactions.css`, `genshin-font.css`, `src/prelude/fx-canvas.js`, `cutscene.js`, `menu-audio.js`): `#bg` gradien biru siang, awan putih lebih banyak, bintang jadi kilau hangat, burung biru tua, retakan prelude biru, efek beat PLAY emas/biru langit, teks prelude dan subjudul diberi bayangan biru agar terbaca.

## Tidak diubah (sengaja)
- Interlude konstelasi pada finale tetap gelap (bagian dari animasi finale).
- Ladang Langit (sudah siang), logo bitmap 7 KAIH (pastel), panel dan tombol bergaya Genshin (krem/emas/slate).

## Mengatur ulang warna
- Langit: warna `zen`/`mid`/`hor` di shader `jW`; matahari: `JW` (`scale`, `direction`).
- Hijau pulau: `#7fd957` (permukaan) dan `nj` (pohon) di bundle. Versi lama semua file: `_old/*_v31_old.*`.

## Fase 3.4 (penyesuaian warna & HUD)
- Retakan prelude (`src/prelude/cutscene.js`): tepi/pendar ungu -> kuning-emas, inti cahaya -> kuning pucat, serpihan kaca -> tint hangat.
- Teks/logo menu (`menu-audio.js`, `index.html`, `css/runtime.css`): bayangan bawah logo ungu -> coklat (#8a5a1c), glow -> kuning, gradien teks logo SVG -> kuning-coklat, subjudul & glow tombol PLAY -> kuning.
- Guide (`guide-model.js`, `guide.js`): bayangan badan/baju/tangan -> biru pastel, rim light -> kuning pastel (badan, kemeja, tangan, topi) dan biru pastel (jas, cape, lapel), outline -> biru; debu kilau ungu -> kuning pastel.
- Kartu "Pulau Awan" dipindah ke kanan tombol ⚙ (`css/world-interactions.css`, `src/boot/settings.js`); ruang di bawah ⚙ kosong untuk Guide.
