# Fase 4 — Checklist Uji Browser Visual 1:1

Tujuan: membandingkan build single-file v12 dengan build modular pada kondisi yang setara. Checklist ini adalah uji manual; skrip Node.js tidak dapat membuktikan kesamaan visual maupun perilaku WebGL.

## A. Siapkan lingkungan pembanding

- [ ] Jalankan build v12 asli dan build modular melalui HTTP server, bukan `file://`.
- [ ] Gunakan browser dan versi browser yang sama.
- [ ] Gunakan komputer/GPU yang sama, hardware acceleration aktif, zoom browser 100%, resolusi viewport sama, dan DPR yang sama.
- [ ] Pakai kondisi awal yang identik: storage bersih atau state aplikasi yang sama, konfigurasi scene sama, dan tidak ada tab berat lain.
- [ ] Buka DevTools pada kedua build. Di tab Network aktifkan **Disable cache** selama pengujian.
- [ ] Catat ukuran viewport, DPR, browser, dan GPU. Jangan membandingkan FPS dari dua perangkat berbeda.

**Saran lokasi pengujian:** simpan v12 asli di folder terpisah dan jalankan Live Server terpisah. Jangan memindahkan baseline ke subfolder project modular jika perpindahan itu mengubah resolusi path relatif aset.

## B. Console dan Network — wajib bersih

- [ ] Reload kedua halaman dengan hard reload.
- [ ] Pastikan tidak ada `Uncaught ReferenceError`, `Uncaught TypeError`, `is not defined`, `Cannot read properties of undefined`, atau error terkait `window.KAIH` / `K.hooks`.
- [ ] Pastikan tidak ada `Failed to load resource`, HTTP `404`, `net::ERR_*`, MIME type error, atau file lokal yang gagal dimuat.
- [ ] Pastikan tidak ada error WebGL seperti shader compile/link failure, `GL_INVALID_OPERATION`, atau context lost yang muncul hanya pada build modular.
- [ ] Periksa tab Network: seluruh JS, CSS, font, gambar, model, audio, dan media lokal harus berstatus sukses (`200` atau `304`). CDN eksternal harus berhasil jika memang masih dipakai.
- [ ] Bedakan warning browser/third-party dari error aplikasi. Catat warning yang hanya muncul pada salah satu build.

**Kriteria lulus:** nol error aplikasi yang tidak ada pada v12; nol file lokal gagal dimuat.

## C. Render loop dan FPS

- [ ] Tunggu 10–15 detik setelah scene selesai dimuat agar fase inisialisasi tidak mengacaukan pengukuran.
- [ ] Ukur FPS selama minimal 30 detik pada scene dan kamera yang sama. Gunakan DevTools Performance atau panel FPS/Stats yang sudah tersedia di proyek.
- [ ] Bandingkan FPS rata-rata, penurunan frame, stutter, dan waktu pemulihan setelah interaksi.
- [ ] Periksa apakah animasi tetap bergerak stabil saat kamera diam.
- [ ] Periksa apakah render loop tetap berjalan setelah panel/bubble dibuka dan ditutup.
- [ ] Periksa apakah FPS turun tajam setelah beberapa kali drag atau interaksi berulang.
- [ ] Ulangi setelah reload kedua build dengan cache dinonaktifkan.

**Kriteria lulus:** tidak ada regresi FPS yang konsisten atau stutter baru pada build modular dalam kondisi identik. Jangan menetapkan ambang FPS absolut tanpa mempertimbangkan GPU target; yang utama adalah parity terhadap v12.

## D. WebGL dan interaksi 3D

### Kamera dan input
- [ ] Drag kiri/kanan dan atas/bawah menggerakkan kamera sesuai v12.
- [ ] Batas rotasi, zoom, damping, dan posisi kamera tetap sama.
- [ ] Kamera tidak terkunci, meloncat, bergetar, atau kehilangan kontrol setelah klik objek.
- [ ] Lepas drag di luar canvas; pastikan kontrol tidak tertinggal dalam keadaan aktif.

### Raycasting dan objek
- [ ] Klik setiap bangunan/komponen interaktif yang tersedia.
- [ ] Pastikan raycasting mengenai objek yang benar, bukan objek di belakangnya atau area kosong.
- [ ] Kamera melakukan focus/transition ke objek dengan durasi dan posisi yang sama seperti v12.
- [ ] Bubble/chat HTML muncul pada objek yang benar, dapat dibaca, dan tidak tertutup elemen lain.
- [ ] Tutup bubble, klik objek lain, lalu klik objek yang sama berulang kali. Tidak boleh terjadi listener ganda atau panel bertumpuk.

### Manipulasi bola/objek
- [ ] Pilih bola/objek 3D.
- [ ] Uji drag, edit, perubahan posisi/ukuran, dan kontrol lain yang memang tersedia pada aplikasi.
- [ ] Pastikan objek yang dipilih sama dengan objek yang dimanipulasi.
- [ ] Pastikan perubahan UI dan perubahan objek 3D tetap sinkron.
- [ ] Uji batal/selesai edit dan pindah seleksi. Tidak boleh ada objek yang tetap terseleksi tanpa alasan.

### Sky shader dan visual scene
- [ ] Pastikan sky tampil saat startup tanpa hitam, flicker, atau shader fallback.
- [ ] Jalankan setiap kontrol yang mengubah sky, waktu, warna, awan, atau parameter atmosfer jika kontrol tersebut tersedia.
- [ ] Pastikan uniform shader berubah tanpa error dan tampilan ikut berubah.
- [ ] Periksa horizon, pencahayaan, bayangan, warna air, terrain, pulau, bangunan, dan transisi awan.
- [ ] Pastikan animasi shader tetap berjalan setelah interaksi UI dan perpindahan fokus kamera.

**Kriteria lulus:** tidak ada perubahan perilaku, target raycast, shader, kamera, atau visual utama dibanding v12.

## E. Audio dan aset media

- [ ] Mulai audio melalui tindakan pengguna (klik/tombol), karena browser dapat memblokir autoplay sebelum interaksi.
- [ ] Periksa menu music dan world music; pastikan file/script sumber termuat dan audio terdengar.
- [ ] Uji perpindahan menu ke world; pastikan track yang benar aktif dan tidak bertumpuk.
- [ ] Uji mute, unmute, volume, pause/resume, serta efek suara cutscene/interaksi jika tersedia.
- [ ] Periksa Console untuk `NotAllowedError`, `NotSupportedError`, decode failure, atau kegagalan AudioContext.
- [ ] Periksa semua gambar, font, model, tekstur, video, dan audio. Tidak boleh ada placeholder tak disengaja atau tekstur hilang.

**Kriteria lulus:** seluruh media lokal termuat, audio dapat dimainkan setelah user gesture, dan transisi track sesuai v12.

## F. Perbandingan visual 1:1

- [ ] Ambil screenshot v12 dan modular dari viewport yang sama pada momen/state yang sama.
- [ ] Bandingkan startup, scene idle, kamera setelah drag, satu objek terpilih, bubble terbuka, dan state sky yang berubah.
- [ ] Gunakan overlay 50% opacity atau image-diff tool untuk menemukan pergeseran posisi, ukuran, warna, dan layer.
- [ ] Periksa margin, tipografi, font fallback, z-index, clipping, overflow, ukuran bubble, dan transisi CSS.
- [ ] Jika berbeda, klasifikasikan: perubahan yang disengaja, perbedaan rendering GPU, atau regresi.

Catatan: hasil pixel-diff tidak selalu nol karena antialiasing, font rasterization, GPU, dan timing animasi. Nilai berdasarkan pergeseran visual yang nyata dan konsisten, bukan noise satu-dua piksel.

## G. Regresi akhir dan keputusan

- [ ] Reload build modular sekali lagi dan ulangi smoke test: startup → drag kamera → klik objek → bubble → tutup → audio → refresh.
- [ ] Pastikan tidak ada error baru setelah interaksi berulang.
- [ ] Simpan screenshot, Console log, hasil Network, dan catatan FPS sebagai bukti uji.
- [ ] Isi hasil di tabel berikut.

| Area | Hasil | Bukti/catatan |
|---|---|---|
| Console & Network | PASS / FAIL |  |
| Render loop & FPS | PASS / FAIL |  |
| Kamera & raycasting | PASS / FAIL |  |
| Manipulasi objek | PASS / FAIL |  |
| Sky shader & uniforms | PASS / FAIL |  |
| Audio & media | PASS / FAIL |  |
| Visual 1:1 | PASS / FAIL |  |

**Build dinyatakan lolos hanya jika:** static verifier tidak memiliki FAIL, baseline dan manifest lengkap, seluruh checklist kritis berstatus PASS, dan tidak ada regresi yang belum dijelaskan. `WARN` berarti bukti belum lengkap, bukan otomatis lulus.
