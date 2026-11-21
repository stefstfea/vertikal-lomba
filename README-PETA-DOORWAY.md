# Peta sebagai doorway ke dashboard (Fase 4.0)

## Alur
Pulau Awan: tekan peta di pojok kiri bawah -> zoom ke peta -> kilau -> gulungan membuka -> dashboard peta (folder `peta/`, di iframe).
Kembali: ikon Guide (di bawah tombol ⚙) -> "Kembali ke Pulau Awan" -> animasi yang sama diputar mundur.

## File baru / berubah
- `src/prelude/map-doorway.js`, `css/map-doorway.css`: animasi doorway. Dipasang di `index.html` (1 link CSS + 1 script). Dipicu event `kaih-map-click` yang sudah dikirim `guide-map.js`.
- `peta/`: file kedua (dashboard peta). Tambahan: `kaih-skin.css` (gaya Genshin + animasi halus), `kaih-motion.js` (zoom/geser halus, transisi panel), `kaih-guide.js` (Guide).
- `peta/index.html`: hook kecil (mode embed, urutan masuk, `celebrate()` memanggil Guide).

## Guide di dashboard
Sapaan awal (sekali per sesi; `?guide=1` memaksa tampil), tombol Guide di bawah ⚙, tur komponen, dan perayaan 7/7 yang menjelaskan Mode Lengkap. Semua teks ada di objek `CFG` di `peta/kaih-guide.js`; daftar isi Mode Lengkap dibaca otomatis dari panelnya, jadi cocok dipakai sebagai template file ketiga.

## Menjalankan
Gunakan Live Server dari root folder (iframe memerlukan http, bukan buka file langsung). Dashboard juga bisa dibuka sendiri: `peta/index.html`.

## Fase 4.1 — Guide 3D di dashboard peta + musik peta
**Guide 3D** (`peta/kaih-guide.js`): Guide di peta sekarang memakai model 3D yang SAMA dengan Pulau Awan (`src/guide/guide-model.js`, `KaihGuideModel.build`), digambar lewat Three.js r128 (dimuat dari CDN yang sama dengan file utama). Satu renderer offscreen menggambar ke canvas 2D untuk bubble dialog dan tombol FAB.
- Animasi: melayang, topi memantul, ekor jas & cape berkibar mengikuti gerak, kedip, mulut terbuka saat teks diketik, mata mengikuti pointer, lengan/kaki bergerak (melambai, bersorak + melompat, menunjuk ke elemen yang disorot, dsb.), berputar 3D saat masuk/keluar, melambai saat FAB di-hover.
- Cadangan: bila Three.js / `guide-model.js` / WebGL tidak bisa dimuat, otomatis kembali ke gambar SVG 2D lama (tanpa error).
- Peta memuat model dari `../src/guide/guide-model.js`, jadi folder `peta/` dan `src/` harus tetap bersebelahan.

**Musik dashboard peta** (`src/prelude/map-music.js`, `assets/audio/map-music.mp3`): kategori Musik (ikut slider Musik di Settings). Mulai saat tombol peta ditekan (event `kaih-map-opening`), fade-out saat dashboard ditutup (`kaih-map-closing`). Musik Pulau Awan dijeda selama dashboard terbuka lalu dilanjutkan (`kaihPauseWorldMusic` / `kaihResumeWorldMusic` di `menu-audio.js`). API: `KaihMapMusic.start()/stop()/playing()`.

## Fase 4.2 — Mode Lengkap baru (roulette orbit)
`peta/kaih-full.js` + `peta/kaih-full.css` menggantikan modal Mode Lengkap lama (modal lama tetap ada sebagai cadangan bila 3D gagal dimuat).
- Alur: Guide mendekat ke kamera -> terbang ke langit/awan -> bergeser ke kiri menjadi pusat orbit.
- Orbit: 7 komponen dari `src/landscape/modules/models.js` (dipasang lewat `r3f-lite.js`) + 1 lingkaran panah, mengitari Guide.
- Roulette: geser atas/bawah, scroll, atau tombol panah; komponen di posisi kanan = fokus kajian, datanya muncul di panel kanan.
- Tarik lingkaran panah ke kanan -> lembar kesimpulan penuh (isi dari `renderFull()` di index.html).
- Ketuk layar saat intro untuk melewati animasi. Tempo intro ada di fungsi `frame()` (detik 0 / 1.5 / 3.3 / 4.9).

## Fase 4.3 (diperbarui di 4.4: animasi skip memakai tebasan pedang + Guide membelah layar; musik peta = a_map_of_small_wonders.mp3)
- Mode Lengkap: ornamen bulan dihapus. Guide ditahan 10 detik (tanpa bergeser) -> Perluasan Domain: gelombang kejut, layar hitam berbintang meluas dari Guide; tahan 10 detik lagi untuk menutupnya (`toggleDomain` di `peta/kaih-full.js`).
- Menu Skip (cutscene pembuka): pilihan tebal "SKIP KE DASHBOARD" -> `src/prelude/skip-dashboard.js`: topi fedora terbang, retakan galaksi merobek topi, Guide muncul dalam asap, lalu latar langsung berganti ke dashboard (`KaihMapDoorway.openDirect`). Tempo ada di objek `TL`.

## Finalisasi (Fase 5)
- Halaman awal: `src/prelude/splash-guide.js` merender Guide 3D (guide-model.js) + teks "Ketuk di mana saja"; efek crack & prolog tidak diubah. Gaya di `css/final-polish.css`.
- Dialog konfirmasi (Pulau Awan <-> Ladang Langit): efek gelombang berasal dari `menu-audio.js` yang memecah semua h1/h2 menjadi sprite per huruf. Dialog kini dikecualikan; judul normal & tebal.
- Layar loading (`#kx-load` di `src/boot/skip-ctl.js`): latar putih, teks hitam, Guide 3D berputar (`guideSpin`). Ukuran/posisi Guide: konstanta `S*.2` dan `S*.5` di `guideSpin`.
