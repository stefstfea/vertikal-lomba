# The Guide (Fase 3.2)

Maskot/companion sesuai "3D Production Turnaround Blueprint" + gambar turnaround.

## File
- `src/guide/guide-model.js` — model 3D prosedural (bola putih, jas hitam + dasi, fedora miring, tangan/kaki mungil), cel-shaded + rim fresnel. Palet ada di objek `PAL` (pita topi: gambar = hitam; blueprint = putih -> ganti `hatBand`).
- `src/guide/guide.js` — engine: renderer WebGL transparan sendiri di `<html>` (tetap hidup saat `<body>` diganti), animasi, dialog, tombol FAB, dropdown.
- `index.html` — dua `<script>` di akhir body (setelah `cutscene.js`). Versi lama: `_old/index_v13_old.html`.

## Perilaku
- **Pulau Awan**: muncul saat event `kaih-ready`: terbang dari kejauhan (kecil, berputar) secara melengkung, makin dekat, lalu berputar melambat hingga menghadap POV user + stardust. 7 dialog; kamera ikut bercerita (baris 4 'lihat-lihat' = kamera menyapu pulau; baris 5 'teman-temanku' = kamera berpindah dari satu teman ke teman lain memakai pemilihan bawaan Pulau Awan / OrbitControls). Lalu terbang memutar dan 'nod' ke tombol "Lanjutkan ke dashboard" (disorot), lalu terbang ke pojok.
- **Ladang Langit**: meluncur dari atas setelah dashboard pertama ditutup (cadangan: 45 dtk setelah `intro-done`), 3 dialog, lalu jadi FAB.
- **FAB**: mesh 3D diganti Render Texture 2D (WebGLRenderTarget -> canvas), ditaruh di bawah tombol Settings (otomatis menghindari kartu HUD). Klik -> dropdown: Ke Dashboard, Ulangi Tutorial, (di Ladang Langit) Kembali ke Pulau Awan.
- **Klik Guide**: twirl + confetti putih/abu-abu.
- **Cape hitam** (menggantikan trail): kain simulasi (spring-lag + kibaran) yang mengibar sesuai arah gerak Guide; ikut muncul di render texture FAB.
- **Gestur tangan/kaki**: melambai, merentang, bersorak, menunjuk, terbang, mengayuh; tertinggal saat bergerak; mata/wajah mengikuti pointer; melambai saat di-hover (mouse); gestur acak saat diam. Preset ada di fungsi `armTarget` (guide.js).
- **Konfirmasi lewati tutorial**: tombol "Lewati" di bubble atau "Lanjutkan ke dashboard" saat tutorial berjalan menampilkan "Apakah kamu yakin ingin melewati tutorial?" (Ya, lewati / Tidak). Pada "Ya" lewat tombol Lanjutkan, konfirmasi dashboard bawaan terbuka setelah Guide sampai di FAB.
- Tombol "Lewati" di bubble dialog langsung mengirim Guide ke FAB. Guide menyingkir otomatis saat dashboard/dialog konfirmasi/finale tampil.
- "Kembali ke Pulau Awan": reload otomatis (sessionStorage) -> lewati splash/prelude -> PLAY -> Guide masuk versi singkat (tanpa dialog).

## Catatan
- Memakai `window.THREE` (r128 CDN yang sudah dimuat index.html). Jika THREE tidak ada, Guide diam (tanpa error).
- `?noguide` pada URL mematikan Guide sepenuhnya.
- `KaihGuide.play('awan'|'ladang')`, `.replay()`, `.skipDialog()` (tanpa konfirmasi), `.askSkip()`, `.twirl()`, `.state()` tersedia di console. `_debug`/`_set` hanya hook uji.
- Catatan: kartu info bawaan Pulau Awan disembunyikan sementara saat tur kamera (kelas `kxg-tour` pada `<html>`).

## Fase 3.2 — cutscene peta (menggantikan dialog tombol dashboard)
- Dialog "Kamu bisa menekan tombol yang ini!" dihapus (`LINES.awanUI`). Sesudah dialog ke-7, `seqMap()` di `guide.js` berjalan:
  1. Guide mendekat ke POV user (membesar) + spotlight gelap.
  2. Berbalik sedikit, merogoh ke belakang punggung (gestur `reach`), tersentak.
  3. Berputar menghadap user, mengeluarkan peta: antisipasi squash -> meluncur dengan stretch ease-in -> benturan squash -> elastis menenang (ease-out),
     disertai ledakan cahaya prismatik (berkas pelangi, cincin kejut pelangi, bloom aberasi kromatik, kilau bintang, flash putih, kilau holografik pada peta).
  4. Guide mengangkat peta (gestur `lift`), membawanya, dan meletakkannya di pojok kiri bawah (peta menjadi elemen tetap, bisa diklik: event `kaih-map-click`).
- `src/guide/guide-map.js`: elemen peta + FX canvas 2D + spotlight. Gambar: `assets/img/peta.png` (PNG transparan; ganti file untuk mengganti peta, rasio otomatis).
- Menu pilihan 7 komponen di bagian bawah Pulau Awan disembunyikan lewat `css/runtime.css` (`#root .fixed.inset-x-0.bottom-0`). Tombolnya tetap ada di DOM (tersembunyi) karena tur kamera Guide masih memakainya.
  Teks HUD "Ketuk objek atau pilih dari daftar" di bundle diubah menjadi "Ketuk objek untuk berinteraksi".
- Jika tutorial dilewati di tengah cutscene, peta langsung muncul di pojok kiri bawah. Di Ladang Langit peta disembunyikan.
- Debug: `KaihGuide._map()` langsung memutar cutscene peta. Backup versi lama: `_old/guide_v31_old.js`, `_old/index_v31_old.html`.

## Fase 3.3
- Tombol "Lanjutkan ke dashboard" diganti tombol **pintu** (`assets/img/pintu.png`) di pojok kanan bawah. Klik pintu = klik tombol lama (konfirmasi dashboard bawaan). Tombol lama disembunyikan, tetap ada di DOM.
- Pintu hanya muncul setelah tutorial selesai atau dilewati. Saat dilewati: peta & pintu muncul dengan animasi pop up di tempatnya. Saat "Ulangi Tutorial": keduanya meluncur ke bawah lalu hilang, dan muncul lagi setelah tutorial selesai.
- Kartu HUD "Pulau Awan Pikiran" (di bawah tombol Settings) dihapus dari bundle; ruang di bawah Settings kini bebas untuk Guide beristirahat (posisi FAB tidak berubah).
- API: `KaihGuideMap.popIn() / slideOut() / doorPop() / doorOut() / slideOutAll()`.

## Fase 3.6 — Keluar Pulau Awan → Ladang Langit (tanpa dashboard)
- DIHAPUS: animasi bintang meledak, layar "ketuk untuk lanjut ke dashboard", portal Ladang Langit, dan dashboard (`#kaih-dashboard`, `portal.js`, `dashboard.js`, `holy-sky.js`).
- Tombol pintu → dialog "Apakah kamu ingin ke ladang langit?" → Ya = event `kaih-finale`.
- Cutscene keluar (komponen `KXFinale` di `js/vendor/pulau-awan-bundle.js`, waktu di objek `KXT`): 7 teman berkumpul → berbaris ke tepi → Guide terjun duluan (`guide.js: seqExit`) → teman melompat & jatuh; kamera low-angle → tracking → over-the-shoulder → chase cam menukik, letterbox, garis kecepatan, layar memutih → `kaih-ladang-go` (loader memuat Ladang Langit). Event fase: `kaih-exit-phase` {gather|march|dive|jump}.
- Ladang Langit (`modules/intro.js`, `K.arrival`): langit terbelah langsung muncul → `kaih-ladang-arrive` → Guide turun lebih dulu (`seqLadang`) → `kaih-ladang-balls` → 7 bola jatuh dari langit.
- HP: geser kamera kiri/kanan di Ladang Langit (`modules/cam-pan.js`, drag di ruang kosong; ketuk dua kali = kembali ke tengah).
- Belum diuji dengan three.js asli (CDN diblokir di lingkungan build); semua file lolos `node --check`.

## Fase 3.6b — Guide jadi bola, SFX dibuat ulang
- Guide TIDAK berbicara lagi di cutscene keluar. Overlay Guide terbang ke dunia lalu menjelma bola 3D (`KXGuideBall`, grup `kx-b-guide`: kuning pastel + pita biru pastel + halo) dengan flash; ia berbaris di depan teman-temannya, **melompat & jatuh duluan** (kamera menyorot Guide), lalu 7 teman menyusul dan kamera menjauh menampakkan semuanya.
- Di Ladang Langit Guide turun lewat celah langit ke posisi Guide biasa (lalu dialog & tombol bantuan seperti sebelumnya).
- SFX lama (ledakan/bintang jatuh: rumble, boom, resonate, fill) dihapus. `window.kxSfx` dibuat ulang: gather, pop, leap, fall, swell (Pulau Awan) dan crack, split, arrive (langit terbelah).
- Waktu cutscene: objek `KXT` di bundle (enter, reveal, march, gleap, fleap, white, go).

## Fase 3.8 — Cutscene badai (menggantikan Guide-bola)
Urutan (detik, objek `KXT` & `KXLT` di `js/vendor/pulau-awan-bundle.js`): 0 Guide terbang ke tengah → 1.2 Guide **melebur jadi partikel cahaya** (kuning/biru pastel) dan lenyap → 3.0 **langit cerah berubah gelap**, badai sihir datang (shader langit `uStorm` + cahaya diredupkan + petir `uFlash`/kilat bolt) → angin menderu: pulau & pohon bergoyang, garis/partikel angin, awan bergeser cepat → 5.6 angin **meniup 7 bola berpendar** (halo + jejak cahaya warna-warni) keluar tepi pulau → kamera melacak bola yang berputar & jatuh menembus awan badai → 11.8 awan memutih → 13.2 `kaih-ladang-go` → Ladang Langit (langit terbelah).
SFX baru (`window.kxSfx`): dissolve, wind, thunder, gust, fall, swell (+ crack/split/arrive di Ladang). Tombol Skip (c2) tetap bisa melewati.

## Fase 3.9 — Bola polos jatuh + petir → retakan dimensi
- Pulau Awan: efek warna-warni DIHAPUS (halo, jejak cahaya, partikel angin berwarna). Bola 7KAIH kini bola biasa: angin badai mendorongnya menyusuri pulau, lepas dari tepi, lalu jatuh bebas; kamera menyorot jatuhnya menembus awan mendung.
- Ladang Langit (`modules/intro.js`): bidikan pemandangan dibekukan → langit bergemuruh & menggelap → **sambaran petir** menghantam tanah (kilatan menyilaukan, getar, bara di titik hantaman, guntur) → **retakan dimensi** menjalar dari titik sambaran → **dunia pecah** (dua belahan menjauh, cahaya emas) seperti sebelumnya → Guide turun → 7 bola jatuh.
- Waktu: `T_STRIKE`, `T_COVER`, `T_CRACK`, `T_SPLIT`, `T_FADE` di atas `intro.js`.
