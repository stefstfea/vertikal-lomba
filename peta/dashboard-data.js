/* ============================================================================
   DATA 7 KAIH (sumber: Dashboard_7_KAIH_Isometrik.html)
   ============================================================================ */
const HABIT_DATA = {
  bangunPagi:{title:'Pulau Bangun Pagi',q:['Q01','Q02'],subtitle:'Bangun sebelum 05.00 dan jadwal bangun yang sama di akhir pekan.'},
  beribadah:{title:'Kuil Beribadah',q:['Q03','Q04'],subtitle:'Ibadah tepat waktu dan kejujuran atas dasar kesadaran beragama.'},
  berolahraga:{title:'Arena Berolahraga',q:['Q05','Q06'],subtitle:'Olahraga terstruktur 30 menit dan aktivitas fisik bersama teman.'},
  makanSehat:{title:'Lembah Makan Sehat',q:['Q07','Q08'],subtitle:'Sarapan bergizi dan menghindari minuman kemasan bergula tinggi.'},
  gemarBelajar:{title:'Menara Gemar Belajar',q:['Q09','Q10'],subtitle:'Membaca buku non-pelajaran dan memanfaatkan teknologi/AI untuk belajar.'},
  bermasyarakat:{title:'Desa Bermasyarakat',q:['Q11','Q12'],subtitle:'Menghargai perbedaan pendapat dan beretika di media sosial.'},
  tidurCepat:{title:'Awan Tidur Cepat',q:['Q13','Q14'],subtitle:'Tidur sebelum 22.00 dan menjauhkan gawai sebelum tidur.'}
};
const FK=['F1','F2','F3','F4'];
const QTEXT={Q01:'Bangun sebelum pukul 05.00 WIB',Q02:'Jadwal bangun sama di hari libur',Q03:'Ibadah wajib tepat waktu',Q04:'Jujur karena kesadaran beragama',Q05:'Olahraga terstruktur min. 30 menit',Q06:'Aktivitas fisik bersama teman vs gawai',Q07:'Sarapan bergizi sebelum sekolah',Q08:'Menghindari minuman kemasan bergula',Q09:'Membaca buku non-pelajaran 15 menit',Q10:'Memanfaatkan teknologi/AI untuk belajar',Q11:'Menghargai perbedaan pendapat',Q12:'Etika dan kesantunan di media sosial',Q13:'Tidur sebelum pukul 22.00 WIB',Q14:'Menjauhkan gawai 30 menit sebelum tidur',Q15:'Konsistensi menyeluruh'};
const pct1=(n,v)=>Math.round(n/v*1000+1e-9)/10;
function kdist(f,qs){const ns=Array(7).fill(0);let v=0;qs.forEach(q=>{KAIH_N[f][q].forEach((x,i)=>ns[i]+=x);v+=KAIH_VALID[f];});return{ns,v,pc:qs.length===1?KAIH_PCT[f][qs[0]]:ns.map(n=>pct1(n,v))};}

/* ============================================================================
   7 INDIKATOR
   - habit   : kunci data di HABIT_DATA (setiap ikon = satu data kebiasaan)
   - left/top: posisi UJUNG PIN (persen terhadap gambar peta)
   - regions : area yang berubah warna, [x, y, radiusX, radiusY] pada kanvas acuan 1288 x 719
   ============================================================================ */
const REF_W = 1288, REF_H = 719;
const LOCATIONS_DATA = [
  { id: 'olahraga', code: 'a', habit: 'berolahraga', name: 'Arena Berolahraga', areaLabel: 'Pinggir Kota Menuju Hutan',
    description: 'Jalur tanah di pinggir kota yang mengarah ke hutan rimbun, tempat yang segar untuk berolahraga dan melatih kebugaran tubuh.',
    image: 'assets/pins/olahraga.png', left: 65.8, top: 65.6, accentColor: '#ea580c',
    regions: [[735, 470, 150, 125]] },
  { id: 'tidur', code: 'b', habit: 'tidurCepat', name: 'Awan Tidur Cepat', areaLabel: 'Rumah Perdesaan',
    description: 'Pondok kayu yang tenang di kawasan perdesaan hijau, tempat beristirahat dan tidur tepat waktu.',
    image: 'assets/pins/tidur.png', left: 41.8, top: 62.6, accentColor: '#4f46e5',
    regions: [[370, 585, 290, 100], [560, 460, 110, 85]] },
  { id: 'malaikat', code: 'c', habit: 'beribadah', name: 'Kuil Beribadah', areaLabel: 'Pulau Mengambang Ajaib',
    description: 'Pulau mengambang ajaib di atas awan, penuh ketenangan, doa, dan kebaikan hati.',
    image: 'assets/pins/malaikat.png', left: 12.4, top: 27.2, accentColor: '#0284c7',
    regions: [[165, 190, 135, 110], [650, 175, 250, 190], [410, 250, 100, 80]] },
  { id: 'makan', code: 'd', habit: 'makanSehat', name: 'Lembah Makan Sehat', areaLabel: 'Lembah Sawah Subur',
    description: 'Hamparan sawah dan kebun hijau penghasil pangan segar dan sehat untuk kebutuhan gizi setiap hari.',
    image: 'assets/pins/makan.png', left: 30.2, top: 54.4, accentColor: '#16a34a',
    regions: [[350, 410, 260, 175]] },
  { id: 'membaca', code: 'e', habit: 'gemarBelajar', name: 'Menara Gemar Belajar', areaLabel: 'Puncak Windmill (Kincir Angin)',
    description: 'Menara kincir angin tempat membaca buku, membuka wawasan baru, dan menjelajahi ilmu pengetahuan.',
    image: 'assets/pins/membaca.png', left: 82.0, top: 57.2, accentColor: '#7c3aed',
    regions: [[1120, 450, 150, 125]] },
  { id: 'senang', code: 'f', habit: 'bermasyarakat', name: 'Desa Bermasyarakat', areaLabel: 'Alun-Alun Tengah Kota',
    description: 'Pusat kota yang hangat di sekitar air mancur, tempat berkumpul, berbagi keceriaan, dan bersosialisasi.',
    image: 'assets/pins/senang.png', left: 79.2, top: 76.2, accentColor: '#db2777',
    regions: [[985, 545, 175, 115], [1180, 560, 80, 90]] },
  { id: 'weker', code: 'g', habit: 'bangunPagi', name: 'Pulau Bangun Pagi', areaLabel: 'Tanah Clockwork',
    description: 'Kawasan mesin waktu dan roda gigi raksasa yang mengingatkan pada disiplin waktu serta bangun pagi.',
    image: 'assets/pins/weker.png', left: 79.9, top: 33.2, accentColor: '#2563eb',
    regions: [[1045, 240, 225, 175]] }
];
const TOTAL = LOCATIONS_DATA.length;
const STORE_KEY = 'kaih-peta-v5-visited';

const $ = (id) => document.getElementById(id);
const viewport = $('map-viewport'), stage = $('map-stage'), markersLayer = $('markers-layer'), popupCard = $('popup-card');
const MAP_W = 1376, MAP_H = 768, MARKER_H_RATIO = 1260 / 1500;
let MARKER_W = 0.113;

const state = { stageWidth: 1600, stageHeight: 900, x: 0, y: 0, scale: 1, minScale: 1, maxScale: 2.6,
  isDragging: false, dragStartX: 0, dragStartY: 0, hasMoved: false, activeId: null, dpad: null };

/* ============================================================================
   PROGRES KUNJUNGAN
   ============================================================================ */
const visited = new Set();
const reveal = {};           // progres warna per lokasi 0..1
let complete = 0;            // progres pewarnaan total 0..1
let pendingReveal = null;
let busy = false;

function loadProgress() {
  try {
    const arr = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    arr.forEach((id) => { if (LOCATIONS_DATA.some((l) => l.id === id)) visited.add(id); });
  } catch (e) {}
}
function saveProgress() { try { localStorage.setItem(STORE_KEY, JSON.stringify([...visited])); } catch (e) {} }

/* ============================================================================
   KERTAS PETA (tepi sobek)
   ============================================================================ */
function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
function buildTornEdge() {
  const r = rng(77), pts = [], A = 0.55, ay = A * (MAP_W / MAP_H);
  const jag = (amp) => { const base = r() * amp; return r() > 0.9 ? base * 1.9 : base; };
  const NX = 90, NY = 52;
  for (let i = 0; i <= NX; i++) pts.push([(i / NX) * 100, jag(ay)]);
  for (let i = 1; i <= NY; i++) pts.push([100 - jag(A), (i / NY) * 100]);
  for (let i = NX - 1; i >= 0; i--) pts.push([(i / NX) * 100, 100 - jag(ay)]);
  for (let i = NY - 1; i >= 1; i--) pts.push([jag(A), (i / NY) * 100]);
  document.documentElement.style.setProperty('--torn', 'polygon(' + pts.map((p) => p[0].toFixed(2) + '% ' + p[1].toFixed(2) + '%').join(',') + ')');
}

/* ============================================================================
   PEWARNAAN PETA (kanvas)
   ============================================================================ */
const landCanvas = $('map-land'), lctx = landCanvas.getContext('2d');
const maskCanvas = document.createElement('canvas'), mctx = maskCanvas.getContext('2d');
const landImg = new Image(); let landReady = false;
const fullEl = $('map-full');
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const easeOut = (p) => 1 - Math.pow(1 - p, 3);

function drawBlob(cx, cy, rx, ry, k) {
  if (rx < 0.5 || ry < 0.5) return;
  mctx.save(); mctx.translate(cx * k, cy * k); mctx.scale(rx * k, ry * k);
  const g = mctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  mctx.fillStyle = g; mctx.beginPath(); mctx.arc(0, 0, 1, 0, Math.PI * 2); mctx.fill(); mctx.restore();
}
function drawLand() {
  if (!landReady) return;
  const mw = maskCanvas.width, mh = maskCanvas.height, k = mw / REF_W;
  mctx.clearRect(0, 0, mw, mh);
  let any = false;
  const cg = easeOut(complete), grow = 1 + cg * 3.2;
  LOCATIONS_DATA.forEach((loc) => {
    const p = reveal[loc.id] || 0; if (p <= 0) return; any = true;
    const e = easeOut(p), tx = (loc.left / 100) * REF_W, ty = (loc.top / 100) * REF_H;
    loc.regions.forEach(([bx, by, rx, ry]) => drawBlob(tx + (bx - tx) * e, ty + (by - ty) * e, rx * e * grow, ry * e * grow, k));
  });
  const fill = smooth(0.7, 1, complete);
  if (fill > 0) { mctx.fillStyle = 'rgba(0,0,0,' + fill + ')'; mctx.fillRect(0, 0, mw, mh); }
  lctx.globalCompositeOperation = 'source-over';
  lctx.clearRect(0, 0, landCanvas.width, landCanvas.height);
  if (!any) return;
  lctx.drawImage(landImg, 0, 0, landCanvas.width, landCanvas.height);
  lctx.globalCompositeOperation = 'destination-in';
  lctx.imageSmoothingEnabled = true; lctx.imageSmoothingQuality = 'high';
  lctx.drawImage(maskCanvas, 0, 0, landCanvas.width, landCanvas.height);
  lctx.globalCompositeOperation = 'source-over';
}
function applyFull() { fullEl.style.opacity = String(smooth(0.5, 1, complete)); }
landImg.onload = () => {
  landCanvas.width = landImg.naturalWidth; landCanvas.height = landImg.naturalHeight;
  maskCanvas.width = Math.round(REF_W / 2); maskCanvas.height = Math.round(REF_H / 2);
  landReady = true; drawLand();
};
landImg.src = 'assets/map-land.webp';

function tween(dur, fn, done) {
  const t0 = performance.now();
  (function step(t) {
    const p = Math.max(0, Math.min(1, (t - t0) / dur)); fn(p);
    if (p < 1) requestAnimationFrame(step); else if (done) done();
  })(t0);
}

/* ============================================================================
   UI: HUD, marker, drawer
   ============================================================================ */
function updateUI() {
  const n = visited.size;
  $('progress-text').textContent = n + ' / ' + TOTAL;
  $('pips').innerHTML = LOCATIONS_DATA.map((l, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('');
  LOCATIONS_DATA.forEach((loc) => {
    const el = $('marker-' + loc.id); if (el) el.classList.toggle('visited', visited.has(loc.id));
    const d = $('drawer-' + loc.id);
    if (d) { d.classList.toggle('done', visited.has(loc.id)); d.querySelector('.st').textContent = visited.has(loc.id) ? '✦' : '◇'; }
  });
  if (state.activeId) updatePopupStatus(state.activeId);
  if (typeof syncFull === 'function') syncFull();
}
function updatePopupStatus(id) {
  const v = visited.has(id), chip = $('popup-status');
  chip.className = 'chip ' + (v ? 'visited' : 'unvisited');
  chip.innerHTML = v ? '<i class="dot"></i>Sudah dikunjungi' : '<i class="dot"></i>Belum dikunjungi';
  $('popup-data-btn').textContent = v ? 'Lihat Data Lagi' : 'Lihat Data';
}
const CHECK_SVG = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
function renderMarkers() {
  markersLayer.innerHTML = ''; $('drawer-items').innerHTML = '';
  LOCATIONS_DATA.forEach((loc, idx) => {
    const m = document.createElement('button');
    m.type = 'button'; m.className = 'map-marker'; m.id = 'marker-' + loc.id;
    m.style.left = loc.left + '%'; m.style.top = loc.top + '%';
    m.style.zIndex = String(10 + Math.round(loc.top));
    m.style.setProperty('--marker-color', loc.accentColor);
    m.style.setProperty('--float-delay', (idx * -0.45) + 's'); m.style.setProperty('--i', idx);
    m.setAttribute('aria-label', loc.name + ' - ' + loc.areaLabel);
    m.innerHTML = `
      <div class="marker-ground-shadow"></div>
      <div class="marker-float-wrap"><div class="marker-pop-wrap">
        <div class="marker-pulse-ring"></div>
        <img class="marker-img" src="${loc.image}" alt="${loc.name}" draggable="false" />
        <div class="marker-check">${CHECK_SVG}</div>
      </div></div>
      <div class="marker-mini-badge">${loc.name}</div>`;
    m.addEventListener('click', (e) => { e.stopPropagation(); if (state.hasMoved) return; openLocation(loc.id); });
    markersLayer.appendChild(m);

    const it = document.createElement('button');
    it.type = 'button'; it.className = 'drawer-item'; it.id = 'drawer-' + loc.id; it.style.setProperty('--i', idx);
    it.innerHTML = `
      <div class="thumb"><img src="${loc.image}" alt="" /></div>
      <div class="tx"><div class="t1">${loc.code.toUpperCase()}. ${loc.name}</div><div class="t2">${loc.areaLabel}</div></div>
      <span class="st">◇</span>`;
    it.addEventListener('click', () => { toggleDrawer(false); openLocation(loc.id, true); });
    $('drawer-items').appendChild(it);
  });
}

/* ============================================================================
   ENGINE PETA
   ============================================================================ */
const TOP_RESERVE = 70;
function computeStageDimensions() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const small = vw < 640;
  const sideM = small ? 10 : 28, botM = small ? 20 : 26;
  const u = Math.min((vw - sideM * 2) / MAP_W, (vh - TOP_RESERVE - botM) / MAP_H);
  state.stageWidth = Math.round(MAP_W * u); state.stageHeight = Math.round(MAP_H * u);
  state.maxScale = Math.max(2.6, 1800 / state.stageWidth);
  stage.style.width = state.stageWidth + 'px'; stage.style.height = state.stageHeight + 'px';
  MARKER_W = small ? 0.16 : 0.113;
  document.documentElement.style.setProperty('--marker-w', (MARKER_W * 100) + '%');
}
const markerHeightPx = () => state.stageWidth * MARKER_W * MARKER_H_RATIO;

function clampAxis(pos, view, size, pre, post) {
  if (size + pre + post <= view + 0.5) return pre + (view - pre - post - size) / 2;
  const lo = view - size, hi = 0;
  return lo > hi ? (view - size) / 2 : Math.max(lo, Math.min(hi, pos));
}
function clampPan() {
  state.x = clampAxis(state.x, window.innerWidth, state.stageWidth * state.scale, 0, 0);
  state.y = clampAxis(state.y, window.innerHeight, state.stageHeight * state.scale, TOP_RESERVE, 20);
}
function applyTransform(smoothAnim = false) {
  clampPan();
  stage.style.transition = smoothAnim ? 'transform .8s cubic-bezier(.22,1,.36,1)' : 'none';
  stage.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) scale(${state.scale})`;
  popupCard.style.setProperty('--inv', (1 / state.scale).toFixed(4));
  $('btn-reset-view').textContent = Math.round(state.scale * 100) + '%';
}
function centerMap(smoothAnim = false) { state.scale = 1; state.x = 0; state.y = 0; applyTransform(smoothAnim); }
function panToPercentage(l, t, smoothAnim = true) {
  const want = Math.min(state.maxScale, Math.max(1.5, 900 / state.stageWidth));
  if (state.scale < want) state.scale = want;
  state.x = window.innerWidth / 2 - (l / 100) * state.stageWidth * state.scale;
  state.y = window.innerHeight * 0.55 - (t / 100) * state.stageHeight * state.scale;
  applyTransform(smoothAnim);
}
function zoomAt(cx, cy, next, smoothAnim = false) {
  next = Math.max(state.minScale, Math.min(state.maxScale, next));
  const prev = state.scale; if (next === prev) return;
  state.x = cx - ((cx - state.x) / prev) * next;
  state.y = cy - ((cy - state.y) / prev) * next;
  state.scale = next; applyTransform(smoothAnim);
}

/* ---------- Kartu info ---------- */
function openLocation(id, forcePan = false) {
  const loc = LOCATIONS_DATA.find((l) => l.id === id); if (!loc || busy) return;
  document.querySelectorAll('.map-marker').forEach((el) => el.classList.remove('active', 'pop-burst'));
  const el = $('marker-' + id);
  if (el) { void el.offsetWidth; el.classList.add('active', 'pop-burst'); }
  state.activeId = id;

  $('popup-img').src = loc.image; $('popup-img').alt = loc.name;
  const badge = $('popup-badge'); badge.textContent = loc.areaLabel;
  $('popup-title').textContent = loc.name; $('popup-desc').textContent = loc.description;
  updatePopupStatus(id);

  ensureVisible(loc, forcePan);

  const arrow = $('popup-arrow'), tipY = (loc.top / 100) * state.stageHeight, mh = markerHeightPx();
  const vw = window.innerWidth, half = Math.min(148, vw / 2 - 6);
  const sx = state.x + (loc.left / 100) * state.stageWidth * state.scale;
  const off = Math.max(half, Math.min(vw - half, sx)) - sx;
  popupCard.style.left = `calc(${loc.left}% + ${(off / state.scale).toFixed(2)}px)`;
  arrow.style.left = `calc(50% + ${Math.max(-112, Math.min(112, -off)).toFixed(1)}px)`;
  const G = '2px solid var(--gold)';
  if (loc.top < 32) {
    popupCard.classList.add('flip-below');
    popupCard.style.top = (tipY + 10) + 'px';
    arrow.style.bottom = 'auto'; arrow.style.top = '-8px'; arrow.style.transform = 'translateX(-50%) rotate(45deg)';
    arrow.style.border = '0'; arrow.style.borderLeft = G; arrow.style.borderTop = G;
  } else {
    popupCard.classList.remove('flip-below');
    popupCard.style.top = (tipY - mh * 1.02) + 'px';
    arrow.style.top = 'auto'; arrow.style.bottom = '-8px'; arrow.style.transform = 'translateX(-50%) rotate(45deg)';
    arrow.style.border = '0'; arrow.style.borderRight = G; arrow.style.borderBottom = G;
  }
  popupCard.classList.add('open');
}
function ensureVisible(loc, forceCenter) {
  if (forceCenter) { panToPercentage(loc.left, loc.top, true); return; }
  const vw = window.innerWidth, vh = window.innerHeight, s = state.scale;
  const sx = state.x + (loc.left / 100) * state.stageWidth * s;
  const sy = state.y + (loc.top / 100) * state.stageHeight * s;
  const mh = markerHeightPx() * s, flip = loc.top < 32;
  const padX = Math.min(165, vw * 0.4);
  const topNeed = flip ? mh + 120 : mh + 290;
  const bottomNeed = flip ? 280 : 110;
  let tx = state.x, ty = state.y;
  if (sx < padX) tx += padX - sx;
  if (sx > vw - padX) tx -= sx - (vw - padX);
  if (sy < topNeed) ty += topNeed - sy;
  if (sy > vh - bottomNeed) ty -= sy - (vh - bottomNeed);
  if (tx !== state.x || ty !== state.y) { state.x = tx; state.y = ty; applyTransform(true); }
}
function closePopup() {
  popupCard.classList.remove('open'); state.activeId = null;
  document.querySelectorAll('.map-marker').forEach((el) => el.classList.remove('active', 'pop-burst'));
}

/* ============================================================================
   PANEL DATA (Lihat Data)
   ============================================================================ */
const ui={id:null,f:'F4',tab:'dist'};
const INK='#1e2a6b',SEP='#6b4a2b',GOLD='#c8981e';
const PERIODE={F1:'30 Okt–3 Nov 2026',F2:'4–8 Nov 2026',F3:'9–11 Nov 2026',F4:'12–13 Nov 2026'};
const fmt=(x,d=2)=>Number(x).toFixed(d).replace('.',',');
const sgn=x=>(x>0?'+':x<0?'−':'')+fmt(Math.abs(x));

/* ============================================================================
   KESIMPULAN per KAIH (sumber: KESIMPULAN_7_KAIH_SMA_REFO_Marsudirini_WFH.pdf)
   f1/f4 = rata-rata skor; hi = % skala 6-7 (F4); lo = % skala 1-3 (F4); d = selisih F4-F1
   ============================================================================ */
const KES={
  bangunPagi:{f1:4.57,f4:4.75,d:0.18,hi:39.8,lo:22.6,pos:'Perlu penguatan',lvl:'mid',tgt:50,
    text:'Proporsi jawaban skala 6–7 baru 39,8%, sehingga kebiasaan bangun pagi masih perlu diperkuat agar berfrekuensi tinggi dan lebih luas di kalangan siswa. Rata-rata skor naik +0,18 dari Frekuensi 1 ke Frekuensi 4, tetapi 22,6% jawaban masih berada di skala 1–3.',
    prog:'Wake Up Marsud',act:'Kampanye jadwal bangun konsisten sebelum pukul 05.00 WIB, termasuk akhir pekan.'},
  beribadah:{f1:5.40,f4:5.49,d:0.10,hi:51.1,lo:5.2,pos:'Perlu penguatan',lvl:'mid',tgt:60,
    text:'Beribadah berada di posisi kedua tertinggi setelah Bermasyarakat: rata-rata 5,49 dengan 51,1% jawaban skala 6–7 dan hanya 5,2% di skala 1–3. Skor naik +0,10 dari Frekuensi 1, sehingga ini menjadi salah satu kekuatan utama Marsud yang tetap perlu dijaga dan diperluas.',
    prog:'Faith & Integrity Habit',act:'Penguatan ibadah wajib tepat waktu sesuai agama/kepercayaan dan pembiasaan kejujuran.'},
  berolahraga:{f1:4.23,f4:4.45,d:0.22,hi:25.7,lo:25.7,pos:'Prioritas perbaikan',lvl:'low',tgt:45,
    text:'Berolahraga adalah salah satu dari dua area yang paling membutuhkan penguatan: rata-rata 4,45, dengan 25,7% jawaban skala 6–7 dan 25,7% di skala 1–3. Kenaikan +0,22 menjadi sinyal perbaikan pada tingkat agregat, namun capaiannya masih rendah.',
    prog:'Marsud Active 30',act:'Aktivitas fisik minimal 30 menit, kegiatan olahraga bersama, dan pencatatan partisipasi per kelas.'},
  makanSehat:{f1:4.69,f4:4.78,d:0.09,hi:36.1,lo:21.5,pos:'Perlu penguatan',lvl:'mid',tgt:50,
    text:'Skala 6–7 berada di 36,1% dan 21,5% jawaban masih di skala 1–3, sehingga kebiasaan makan sehat dan bergizi masih memerlukan penguatan. Rata-rata skor naik tipis +0,09 dari Frekuensi 1.',
    prog:'Healthy Breakfast Movement',act:'Edukasi sarapan bergizi dan kampanye menghindari minuman kemasan berkadar gula tinggi.'},
  gemarBelajar:{f1:4.82,f4:4.76,d:-0.06,hi:36.9,lo:22.3,pos:'Perlu penguatan',lvl:'mid',tgt:50,
    text:'Skala 6–7 sebesar 36,9% dan 22,3% jawaban di skala 1–3. Rata-rata skor turun −0,06 dari Frekuensi 1 ke Frekuensi 4; penurunan agregat ini perlu dicermati agar kebiasaan belajar tidak melemah.',
    prog:'15 Minutes Reading',act:'Pembiasaan membaca buku nonpelajaran minimal 15 menit dan refleksi bacaan.'},
  bermasyarakat:{f1:6.19,f4:6.03,d:-0.16,hi:72.9,lo:1.7,pos:'Kekuatan utama',lvl:'hi',tgt:75,
    text:'Bermasyarakat memiliki rata-rata skor tertinggi (6,03) dan proporsi skala 6–7 tertinggi (72,9%) dari tujuh kategori; hanya 1,7% jawaban di skala 1–3. Meski begitu skor turun −0,16 dari Frekuensi 1 — penurunan ini perlu dicermati karena Bermasyarakat tetap menjadi capaian tertinggi.',
    prog:'Respect & Kindness Campaign',act:'Penguatan sikap menghargai perbedaan serta etika dan kesantunan di media sosial.'},
  tidurCepat:{f1:3.62,f4:3.97,d:0.34,hi:20.3,lo:40.0,pos:'Prioritas perbaikan',lvl:'low',tgt:40,
    text:'Tidur Cepat memiliki rata-rata terendah (3,97), hanya 20,3% jawaban skala 6–7, dan 40,0% di skala 1–3 — area yang paling membutuhkan penguatan. Namun kenaikannya +0,34 adalah yang terbesar di antara tujuh kategori, sinyal perbaikan agregat walau capaiannya masih rendah.',
    prog:'22.00 Screen-Off Challenge',act:'Edukasi rutinitas tidur, tantangan menjauhkan gawai 30 menit sebelum tidur, dan jurnal pembiasaan sukarela.'}
};
const KES_CATAT='Perbandingan F1→F4 bersifat agregat (jumlah responden tiap frekuensi berbeda), bukan perubahan individu, dan belum membuktikan sebab-akibat program. Skala 6–7 adalah pengelompokan deskriptif, target adalah usulan internal.';

function chartDist(d){
  const W=320,bh=22,g=8,pl=22,mw=190,mx=Math.max(...d.pc),top=d.pc.indexOf(mx);
  let s='<defs><filter id="ink"><feTurbulence baseFrequency=".9" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="2.2"/></filter><filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
  d.pc.forEach((p,i)=>{const y=6+i*(bh+g),w=Math.max(2,p/mx*mw),dom=i===top;
    s+=`<text x="${pl-8}" y="${y+15}" text-anchor="end" font-size="12" font-weight="800" fill="${SEP}">${i+1}</text>`;
    s+=`<rect x="${pl}" y="${y}" width="${w}" height="${bh}" rx="3" fill="${dom?GOLD:INK}" opacity="${dom?1:.82}" filter="url(#${dom?'glow':'ink'})" class="inkbar" style="animation-delay:${i*.06}s"/>`;
    s+=`<text x="${pl+w+6}" y="${y+15}" font-size="11" font-weight="800" fill="${dom?'#8a6208':INK}">${p.toFixed(1)}% <tspan fill="${SEP}" font-weight="600">(n=${d.ns[i]})</tspan></text>`;});
  return `<svg viewBox="0 0 ${W} ${6+7*(bh+g)}">${s}</svg>`;
}
function chartTrend(qs){
  const W=320,H=190,pl=30,pr=14,pt=14,pb=26,pw=W-pl-pr,ph=H-pt-pb;
  const gr=[['Rendah (1–3)',[0,1,2],'#a0522d'],['Sedang (4–5)',[3,4],INK],['Tinggi (6–7)',[5,6],GOLD]];
  const X=i=>pl+i*pw/3,Y=v=>pt+ph-v/100*ph;let s='';
  [0,25,50,75,100].forEach(v=>s+=`<line x1="${pl}" x2="${W-pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="${SEP}" stroke-opacity=".2"/><text x="${pl-5}" y="${Y(v)+3}" text-anchor="end" font-size="9" fill="${SEP}">${v}</text>`);
  FK.forEach((f,i)=>s+=`<text x="${X(i)}" y="${H-8}" text-anchor="middle" font-size="10" font-weight="800" fill="${SEP}">${f}</text>`);
  gr.forEach(([nm,ix,c])=>{const pts=FK.map((f,i)=>{const d=kdist(f,qs);return[X(i),Y(ix.reduce((a,k)=>a+d.pc[k],0)),ix.reduce((a,k)=>a+d.pc[k],0)];});
    s+=`<polyline points="${pts.map(p=>p[0]+','+p[1]).join(' ')}" fill="none" stroke="${c}" stroke-width="2" stroke-dasharray="${nm[0]=='S'?'5 3':''}"/>`;
    pts.forEach(p=>s+=`<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="${c}"/><text x="${p[0]}" y="${p[1]-7}" text-anchor="middle" font-size="9" font-weight="800" fill="${c}">${p[2].toFixed(1)}</text>`);});
  const lg=gr.map(([n,,c])=>`<span><i style="background:${c}"></i>${n}</span>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}">${s}</svg><div class="lg">${lg}</div>`;
}
function kesHTML(k){
  const dc=k.d>0?'up':'down',arrow=k.d>0?'▲':'▼';
  return `<section class="kes" aria-label="Kesimpulan">
    <div class="kes-h"><h4>Kesimpulan</h4><span class="pos ${k.lvl}">${k.pos}</span></div>
    <div class="kes-stats">
      <div><small>Rata-rata skor F4</small><b>${fmt(k.f4)}</b></div>
      <div><small>Skala 6–7 (F4)</small><b>${fmt(k.hi,1)}%</b></div>
      <div><small>Skala 1–3 (F4)</small><b>${fmt(k.lo,1)}%</b></div>
      <div><small>Selisih F1 → F4</small><b class="${dc}">${arrow} ${sgn(k.d)}</b></div>
    </div>
    <p class="kes-t">${k.text}</p>
    <div class="kes-rec"><small>Gerakan yang disarankan</small><b>${k.prog}</b><p>${k.act}</p></div>
    <div class="tgt-top"><span>Skala 6–7 saat ini <b>${fmt(k.hi,1)}%</b></span><span>Target usulan <b>≥${k.tgt}%</b></span></div>
    <div class="tgt"><i style="width:${Math.min(100,k.hi)}%"></i><em style="left:${k.tgt}%"></em></div>
    <p class="note">${KES_CATAT}</p>
  </section>`;
}
function renderModal(){
  const loc=LOCATIONS_DATA.find(l=>l.id===ui.id),h=HABIT_DATA[loc.habit],k=KES[loc.habit];
  const qs=h.q,d=kdist(ui.f,qs);   // selalu data gabungan (dua indikator)
  let body='';
  if(ui.tab==='dist') body=`<h4>Distribusi Skala 1–7 · ${ui.f}</h4>${chartDist(d)}<p class="note">Emas = skala dominan. Gabungan ${qs.join(' + ')}: ${qs.map(q=>QTEXT[q]).join(' · ')}.</p>`;
  else if(ui.tab==='trend') body=`<h4>Pergeseran Pola Respons F1 → F4</h4>${chartTrend(qs)}<p class="note">Persentase responden per kelompok skala. Ini pergeseran pola populasi tiap periode, bukan perubahan perilaku individu.</p>`;
  else{const mx=Math.max(...d.pc),dm=d.pc.indexOf(mx)+1,m=d.ns.reduce((a,n,i)=>a+n*(i+1),0)/d.v,H=-d.pc.reduce((a,p)=>a+(p>0?p/100*Math.log(p/100):0),0)/Math.log(7);
    body=`<h4>Fingerprint · ${ui.f}</h4><div class="fp"><div><small>Skala dominan</small><b>${dm}</b></div><div><small>Skala 6–7</small><b>${(d.pc[5]+d.pc[6]).toFixed(1)}%</b></div><div><small>Rerata skala</small><b>${m.toFixed(2)}</b></div><div><small>Pemerataan</small><b>${H.toFixed(2)}</b></div></div>
    <p class="note"><span class="tip" tabindex="0" data-tip="Dua pertanyaan digabung: n dijumlahkan dulu, lalu persentase dihitung dari total jawaban (2 × valid). Pemerataan = entropi ternormalisasi: 0 = terpusat di satu skala, 1 = merata.">☁ metode hitung</span> Gabungan ${qs.join(' + ')}, total ${d.v} jawaban.</p>`;}
  const tabs=[['dist','Distribusi'],['trend','Pergeseran'],['fp','Fingerprint']].map(([t,l])=>`<button type="button" class="seg-b${ui.tab===t?' on':''}" data-tab="${t}">${l}</button>`).join('');
  const freq=ui.tab==='trend'?'':`<div class="fsel"><span class="fsel-l">Frekuensi</span><div class="pills">${FK.map(f=>`<button type="button" class="pill${ui.f===f?' on':''}" data-f="${f}">${f}</button>`).join('')}</div><small class="fsel-d">${PERIODE[ui.f]} · ${kdist(ui.f,qs).v/2} responden valid</small></div>`;
  $('dm-body').innerHTML=`<div class="seg" role="tablist">${tabs}</div>${freq}<div class="pcard">${body}</div>${kesHTML(k)}`;
}
$('dm-body').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  ['tab','f'].forEach(k=>{if(b.dataset[k])ui[k]=b.dataset[k];});renderModal();});

/* ============================================================================
   MODE LENGKAP (terbuka setelah ke-7 KAIH dikunjungi)
   ============================================================================ */
function renderFull(){
  const order=Object.keys(KES).sort((a,b)=>KES[b].f4-KES[a].f4);
  const rows=order.map(key=>{const k=KES[key],h=HABIT_DATA[key],dc=k.d>0?'up':'down';
    return `<div class="fl-row"><div class="fl-row-h"><b>${h.title.replace(/^(Pulau|Kuil|Arena|Lembah|Menara|Desa|Awan) /,'')}</b><span class="pos ${k.lvl}">${k.pos}</span></div>
      <div class="fl-bar"><i style="width:${(k.f4-1)/6*100}%"></i><span>${fmt(k.f4)}</span></div>
      <div class="fl-meta"><span>Skala 6–7: ${fmt(k.hi,1)}%</span><span>Skala 1–3: ${fmt(k.lo,1)}%</span><span>F1 ${fmt(k.f1)} → F4 ${fmt(k.f4)}</span><span class="${dc}">${k.d>0?'▲':'▼'} ${sgn(k.d)}</span></div></div>`;}).join('');
  const recs=Object.keys(KES).map(key=>{const k=KES[key],h=HABIT_DATA[key];
    return `<div class="fl-rec"><b>${k.prog}</b><span>${k.act}</span><small>${h.title.replace(/^(Pulau|Kuil|Arena|Lembah|Menara|Desa|Awan) /,'')} · F4 ${fmt(k.hi,1)}% → target ≥${k.tgt}%</small></div>`;}).join('');
  const q15=FK.map(f=>{const ns=KAIH_N[f].Q15,t=ns.reduce((a,b)=>a+b,0),m=ns.reduce((a,n,i)=>a+n*(i+1),0)/t;return `<tr><td>${f}</td><td>${t}</td><td>${fmt(m)}</td><td>${fmt((ns[5]+ns[6])/t*100,1)}%</td></tr>`;}).join('');
  $('full-body').innerHTML=`
  <div class="fl-sec"><h4>Ringkasan Eksekutif</h4>
    <p class="fl-p">Penerapan 7 KAIH sudah terlihat, tetapi belum merata dan belum sepenuhnya konsisten. Data Frekuensi 4 menunjukkan kekuatan paling menonjol pada Bermasyarakat dan Beribadah, sedangkan area yang paling membutuhkan intervensi adalah Tidur Cepat dan Berolahraga.</p>
    <div class="fl-stats"><div><b>${KAIH_VALID.F4}</b><small>responden valid Frekuensi 4</small></div><div><b>7</b><small>kategori kebiasaan</small></div><div><b>14</b><small>indikator inti Q01–Q14</small></div><div><b>4</b><small>gelombang pengukuran</small></div></div></div>
  <div class="fl-sec"><h4>Temuan Kunci</h4>
    <div class="fl-find"><span>🏆</span><div><b>72,9%</b> jawaban skala 6–7 pada Bermasyarakat — nilai tertinggi di antara tujuh kategori.</div></div>
    <div class="fl-find"><span>🌙</span><div><b>20,3%</b> jawaban skala 6–7 pada Tidur Cepat — nilai terendah dan prioritas pembiasaan.</div></div>
    <div class="fl-find"><span>📈</span><div><b>5 dari 7</b> kategori mengalami kenaikan rata-rata skor antara Frekuensi 1 dan Frekuensi 4. Dua kategori lainnya mengalami penurunan.</div></div></div>
  <div class="fl-sec"><h4>Potret Frekuensi 4 &amp; Perkembangan</h4>${rows}
    <p class="fl-src">Urut dari rata-rata skor tertinggi (skala 1–7). Selisih = rata-rata F4 dikurangi F1; perbandingan agregat antargelombang, bukan perubahan individu.</p></div>
  <div class="fl-sec"><h4>Q15 · Konsistensi Menyeluruh</h4>
    <table class="fl-tbl"><thead><tr><th>Frekuensi</th><th>Sampel</th><th>Rata-rata</th><th>Skala 6–7</th></tr></thead><tbody>${q15}</tbody></table>
    <p class="fl-src">Pada Frekuensi 4, rata-rata Q15 adalah 5,06 dan 35,0% jawaban berada pada skala 6–7. Q15 tidak menggantikan pembacaan masing-masing dari tujuh kategori.</p></div>
  <div class="fl-sec"><h4>Rekomendasi &amp; Target</h4>
    <details class="fl-box"><summary>Gerakan tindak lanjut dan target usulan</summary><div><p class="fl-src">Rekomendasi turunan dari area prioritas survei; belum dapat diklaim telah dilaksanakan atau terbukti efektif. Target adalah sasaran internal, bukan standar resmi kompetisi.</p>${recs}</div></details></div>
  <div class="fl-sec"><h4>Kesimpulan Analitis</h4>
    <p class="fl-p">Berdasarkan empat gelombang survei, peserta didik SMA REFO Marsudirini Bekasi telah menunjukkan penerapan 7 Kebiasaan Anak Indonesia Hebat, tetapi tingkat penerapannya belum merata dan belum sepenuhnya konsisten. Pada Frekuensi 4, kekuatan paling menonjol terdapat pada Bermasyarakat dan Beribadah, sedangkan Tidur Cepat dan Berolahraga menjadi dua area yang paling membutuhkan penguatan.</p>
    <p class="fl-p">Perbandingan skor rata-rata Frekuensi 1 dan Frekuensi 4 memperlihatkan kenaikan pada lima kategori dan penurunan pada dua kategori. Temuan ini menunjukkan perubahan agregat yang beragam, bukan peningkatan menyeluruh pada seluruh kebiasaan. Q15 pada Frekuensi 4 memiliki rata-rata 5,06 dengan 35,0% jawaban skala 6–7, sehingga persepsi konsistensi holistik juga masih perlu ditingkatkan.</p>
    <p class="fl-p">Nilai kompetitif laporan akan semakin kuat apabila sekolah menghubungkan temuan tersebut dengan program tindak lanjut, bukti pelaksanaan, partisipasi siswa, dan pengukuran ulang yang konsisten.</p>
    <blockquote class="fl-quote">“Marsud telah memiliki fondasi positif dalam penerapan 7 KAIH, terutama pada kebiasaan Bermasyarakat dan Beribadah. Hasil survei juga menunjukkan bahwa pembiasaan kesehatan dan disiplin diri—khususnya Tidur Cepat dan Berolahraga—masih perlu diperkuat. Karena itu, fokus Marsud selanjutnya bukan sekadar mempertahankan capaian, melainkan mengubah temuan survei menjadi gerakan nyata, terukur, dan berkelanjutan.”</blockquote></div>
  <div class="fl-sec"><details class="fl-box"><summary>Batasan interpretasi</summary><div><ul class="fl-ul">
    <li>Tidak ada data pembanding sekolah peserta lain, sehingga posisi atau peringkat Marsud terhadap sekolah lain tidak dapat ditentukan.</li>
    <li>Data tidak membuktikan hubungan sebab-akibat antara program sekolah dan perubahan skor.</li>
    <li>Jumlah responden berbeda pada setiap frekuensi; perubahan tidak boleh disebut sebagai perubahan individu yang sama.</li>
    <li>Kategori skala 6–7 adalah pengelompokan deskriptif untuk analisis, bukan ambang resmi keberhasilan 7 KAIH.</li>
    <li>Target tindak lanjut adalah usulan internal, bukan ketentuan dari penyelenggara kompetisi.</li></ul></div></details>
    <p class="fl-src">Sumber: rekap survei vertikal SMA REFO Marsudirini Bekasi 2026 (Frekuensi 1–4) dan ringkasan persentase respons survei 7 KAIH. Analisis deskriptif tanpa data eksternal.</p></div>`;
}
function openFullLegacy(){ renderFull(); $('full-box').scrollTop=0; $('full-modal').classList.add('open'); $('full-modal').setAttribute('aria-hidden','false'); }
function openFull(){ closePopup();   // Mode Lengkap baru (kaih-full.js); bila 3D gagal dimuat, pakai tampilan lama
  if(window.KaihFull){ KaihFull.open().then(function(ok){ if(!ok) openFullLegacy(); }); } else openFullLegacy(); }
function closeFull(){ $('full-modal').classList.remove('open'); $('full-modal').setAttribute('aria-hidden','true'); if(window.KaihFull) KaihFull.close(); }
$('full-close').addEventListener('click',closeFull);
$('full-modal').addEventListener('click',e=>{ if(e.target.id==='full-modal') closeFull(); });

/* Tombol Mode Lengkap: terkunci sampai ke-7 KAIH dikunjungi, lalu gembok terbuka dengan animasi */
let fullReady=false;
function syncFull(){
  const b=$('btn-full'),n=visited.size,open=fullReady&&n===TOTAL;
  b.style.setProperty('--p',String(n/TOTAL));
  if(!open){ b.classList.add('locked'); b.classList.remove('unlocked','unlocking'); b.setAttribute('aria-disabled','true'); }
  else if(!b.classList.contains('unlocking')){ b.classList.remove('locked'); b.classList.add('unlocked'); b.setAttribute('aria-disabled','false'); }
  $('fb-sub').textContent=open?'Terbuka · ketuk untuk melihat':(n===TOTAL?'Membuka peta…':'Terkunci · '+n+'/'+TOTAL+' KAIH');
}
function playUnlock(quiet){
  const b=$('btn-full'); fullReady=true; b.classList.remove('locked','unlocked'); b.classList.add('unlocking'); b.setAttribute('aria-disabled','false');
  $('fb-sub').textContent='Terbuka!';
  const ring=document.createElement('span'); ring.className='fb-ring'; b.appendChild(ring); setTimeout(()=>ring.remove(),1400);
  for(let i=0;i<10;i++){const s=document.createElement('span'),a=i/10*Math.PI*2,r=34+Math.random()*26;
    s.className='fb-spark'; s.style.setProperty('--dx',Math.cos(a)*r+'px'); s.style.setProperty('--dy',Math.sin(a)*r+'px'); s.style.animationDelay=(0.45+Math.random()*.15)+'s'; s.style.opacity='0';
    b.appendChild(s); setTimeout(()=>s.remove(),1700);}
  setTimeout(()=>{ b.classList.remove('unlocking'); syncFull(); if(!quiet) showToast('🔓 Mode Lengkap terbuka! Ketuk tombol di pojok kanan bawah.'); },1700);
}
$('btn-full').addEventListener('click',e=>{
  e.stopPropagation(); const b=$('btn-full');
  if(b.classList.contains('locked')){ b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); setTimeout(()=>b.classList.remove('shake'),500);
    showToast('🔒 Kunjungi semua 7 KAIH dulu untuk membuka Mode Lengkap ('+visited.size+'/'+TOTAL+')'); return; }
  if(b.classList.contains('unlocked')) openFull();
});
function openData(id) {
  const loc = LOCATIONS_DATA.find((l) => l.id === id); if (!loc) return;
  const d = HABIT_DATA[loc.habit];
  ui.id=id; ui.f='F4'; ui.tab='dist';
  $('dm-icon').src = loc.image; $('dm-tag').textContent = loc.name + ' · ' + loc.areaLabel;
  $('dm-title').textContent = d.title; $('dm-sub').textContent = d.subtitle;
  renderModal();
  $('data-box').scrollTop = 0;
  $('data-box').classList.remove('first'); void $('data-box').offsetWidth; $('data-box').classList.add('first'); $('dm-body').dataset.loc = '';
  $('data-modal').classList.add('open'); $('data-modal').setAttribute('aria-hidden', 'false');
  closePopup();
  if (!visited.has(id)) {          // data sudah dilihat → status berubah jadi sudah dikunjungi
    visited.add(id); saveProgress(); pendingReveal = id; updateUI();
  }
}
function closeData() {
  if (!$('data-modal').classList.contains('open')) return;
  $('data-modal').classList.remove('open'); $('data-modal').setAttribute('aria-hidden', 'true');
  if (pendingReveal) { const id = pendingReveal; pendingReveal = null; setTimeout(() => playReveal(id), 250); }
}
$('popup-data-btn').addEventListener('click', (e) => { e.stopPropagation(); if (state.activeId) openData(state.activeId); });
$('dm-close').addEventListener('click', closeData);
$('data-modal').addEventListener('click', (e) => { if (e.target.id === 'data-modal') closeData(); });

/* ============================================================================
   ANIMASI PEWARNAAN
   ============================================================================ */
function showToast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(showToast._t); showToast._t = setTimeout(() => t.classList.remove('show'), 3400);
}
function regionCenter(loc) {
  let sx = 0, sy = 0; loc.regions.forEach(([x, y]) => { sx += x; sy += y; });
  return [(sx / loc.regions.length / REF_W) * 100, (sy / loc.regions.length / REF_H) * 100];
}
function playReveal(id) {
  const loc = LOCATIONS_DATA.find((l) => l.id === id); if (!loc) return;
  busy = true;
  const [cx, cy] = regionCenter(loc);
  state.scale = 1; panToPercentage(cx, cy, true);
  setTimeout(() => {
    const ring = document.createElement('div'); ring.className = 'visit-ring';
    ring.style.left = loc.left + '%'; ring.style.top = loc.top + '%'; markersLayer.appendChild(ring);
    setTimeout(() => ring.remove(), 1500);
    tween(2800, (p) => { reveal[id] = smooth(0, 1, p) * 0.6 + p * 0.4; drawLand(); }, () => {
      reveal[id] = 1; drawLand(); busy = false;
      if (visited.size === TOTAL) setTimeout(playComplete, 900);
      else showToast('✦ ' + loc.areaLabel + ' kini berwarna! (' + visited.size + '/' + TOTAL + ')');
    });
  }, 650);
}
function playComplete() {
  busy = true; centerMap(true);
  setTimeout(() => {
    tween(3600, (p) => { complete = smooth(0, 1, p) * 0.7 + p * 0.3; drawLand(); applyFull(); }, () => {
      complete = 1; drawLand(); applyFull(); busy = false; celebrate();
    });
  }, 700);
}
function celebrate() {
  const ranked = LOCATIONS_DATA.map((l) => ({ n: HABIT_DATA[l.habit].title, v: KES[l.habit].f4 })).sort((a, b) => b.v - a.v);
  if (window.KaihMapGuide && KaihMapGuide.celebrate) {      // Guide merayakan, menjelaskan Mode Lengkap, lalu membuka gemboknya
    KaihMapGuide.celebrate({ top: { n: ranked[0].n, v: fmt(ranked[0].v) }, low: { n: ranked[ranked.length - 1].n, v: fmt(ranked[ranked.length - 1].v) } });
    return;
  }
  $('cc-detail').innerHTML = 'Skor rata-rata tertinggi: <b>' + ranked[0].n + ' (' + fmt(ranked[0].v) + ')</b><br>Paling perlu perhatian: <b>' + ranked[ranked.length - 1].n + ' (' + fmt(ranked[ranked.length - 1].v) + ')</b><br><br>Tombol <b>Mode Lengkap</b> di pojok kanan bawah kini terbuka.';
  setTimeout(playUnlock, 900);
  $('complete-card').classList.add('show');
  const cols = ['#ffd54a', '#8be061', '#7ec8ff', '#ff9ec7', '#c8a6ff', '#ffb066'];
  for (let i = 0; i < 46; i++) {
    const c = document.createElement('i'); c.className = 'confetti';
    c.style.left = (Math.random() * 100) + 'vw'; c.style.setProperty('--c', cols[i % cols.length]);
    c.style.setProperty('--x', ((Math.random() - 0.5) * 160) + 'px'); c.style.setProperty('--r', ((Math.random() - 0.5) * 1080) + 'deg');
    c.style.setProperty('--t', (2.6 + Math.random() * 2) + 's'); c.style.animationDelay = (Math.random() * 0.8) + 's';
    document.body.appendChild(c); setTimeout(() => c.remove(), 5600);
  }
}
$('cc-close').addEventListener('click', () => $('complete-card').classList.remove('show'));
$('cc-reset').addEventListener('click', () => { $('complete-card').classList.remove('show'); resetProgress(true); });

function resetProgress(skipConfirm) {
  if (!skipConfirm && !confirm('Mulai ulang peta? Semua status kunjungan akan dihapus dan peta kembali ke bentuk tradisional.')) return;
  visited.clear(); saveProgress(); pendingReveal = null; busy = false; complete = 0; fullReady = false; closeFull();
  LOCATIONS_DATA.forEach((l) => { reveal[l.id] = 0; });
  drawLand(); applyFull(); updateUI(); closePopup(); toggleDrawer(false); centerMap(true);
}
$('btn-reset-progress').addEventListener('click', () => resetProgress(false));

/* ============================================================================
   KONTROL: D-pad, keyboard, geser, cubit, zoom
   ============================================================================ */

function stepPan(dir, mult = 1) {
  const d = 11 * mult;
  if (dir === 'up') state.y += d; if (dir === 'down') state.y -= d;
  if (dir === 'left') state.x += d; if (dir === 'right') state.x -= d;
  applyTransform(false);
}
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeData(); closeFull(); closePopup(); toggleDrawer(false); $('complete-card').classList.remove('show'); return; }
  if ($('data-modal').classList.contains('open') || $('full-modal').classList.contains('open')) return;
  const k = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.key];
  if (k) { e.preventDefault(); stepPan(k, 3.5); }
});

const pointers = new Map();
let pinch = null;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
window.addEventListener('pointerdown', () => { state.hasMoved = false; }, true);

function startPinch() {
  const [a, b] = [...pointers.values()];
  pinch = { d: dist(a, b) || 1, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, scale: state.scale, x: state.x, y: state.y };
  state.isDragging = false; state.hasMoved = true; stage.style.transition = 'none';
}
viewport.addEventListener('pointerdown', (e) => {
  if (e.target.closest('#popup-card')) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) { startPinch(); }
  else if (pointers.size === 1) {
    state.isDragging = true;
    state.dragStartX = e.clientX - state.x; state.dragStartY = e.clientY - state.y;
    viewport.classList.add('dragging'); stage.style.transition = 'none';
  }
});
window.addEventListener('pointermove', (e) => {
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch && pointers.size >= 2) {
    const [a, b] = [...pointers.values()];
    const ns = Math.max(state.minScale, Math.min(state.maxScale, pinch.scale * dist(a, b) / pinch.d));
    const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
    state.x = cx - ((pinch.cx - pinch.x) / pinch.scale) * ns;
    state.y = cy - ((pinch.cy - pinch.y) / pinch.scale) * ns;
    state.scale = ns; applyTransform(false); return;
  }
  if (!state.isDragging) return;
  const nx = e.clientX - state.dragStartX, ny = e.clientY - state.dragStartY;
  const thr = e.pointerType === 'touch' ? 8 : 3;
  if (Math.abs(nx - state.x) > thr || Math.abs(ny - state.y) > thr) state.hasMoved = true;
  if (state.hasMoved) { state.x = nx; state.y = ny; applyTransform(false); }
});
function endPointer(e) {
  if (!pointers.delete(e.pointerId)) return;
  if (pinch && pointers.size < 2) {
    pinch = null;
    if (pointers.size === 1) {
      const p = [...pointers.values()][0];
      state.isDragging = true; state.dragStartX = p.x - state.x; state.dragStartY = p.y - state.y;
    }
  }
  if (pointers.size === 0) { state.isDragging = false; viewport.classList.remove('dragging'); }
}
['pointerup', 'pointercancel'].forEach((ev) => window.addEventListener(ev, endPointer));

viewport.addEventListener('scroll', () => { viewport.scrollLeft = 0; viewport.scrollTop = 0; });
viewport.addEventListener('click', (e) => {
  if (state.hasMoved) return;
  if (!e.target.closest('#popup-card') && !e.target.closest('.map-marker')) { closePopup(); toggleDrawer(false); }
});
viewport.addEventListener('dblclick', (e) => { if (!e.target.closest('.map-marker') && !e.target.closest('#popup-card')) centerMap(true); });
$('popup-close').addEventListener('click', (e) => { e.stopPropagation(); closePopup(); });

/* Zoom desktop (tombol & scroll). Tombol zoom untuk HP sudah dihapus; cubit 2 jari tetap bisa. */
const zoomCenter = (f) => zoomAt(window.innerWidth / 2, window.innerHeight / 2, state.scale * f, true);
$('btn-zoom-in').addEventListener('click', () => zoomCenter(1.35));
$('btn-zoom-out').addEventListener('click', () => zoomCenter(1 / 1.35));
$('btn-reset-view').addEventListener('click', () => centerMap(true));
viewport.addEventListener('wheel', (e) => {
  e.preventDefault();
  zoomAt(e.clientX, e.clientY, state.scale * (e.deltaY < 0 ? 1.12 : 1 / 1.12), false);
}, { passive: false });

const drawer = $('location-drawer');
function toggleDrawer(force) { drawer.classList.toggle('open', typeof force === 'boolean' ? force : !drawer.classList.contains('open')); }
$('btn-quick-list').addEventListener('click', (e) => { e.stopPropagation(); toggleDrawer(); });
$('btn-close-drawer').addEventListener('click', () => toggleDrawer(false));

/* ============================================================================
   INIT
   ============================================================================ */
window.addEventListener('resize', () => {
  const prevW = state.stageWidth;
  computeStageDimensions();
  if (Math.abs(state.stageWidth - prevW) > 1) { closePopup(); centerMap(false); } else applyTransform(false);
});
loadProgress();
LOCATIONS_DATA.forEach((l) => { reveal[l.id] = visited.has(l.id) ? 1 : 0; });
complete = visited.size === TOTAL ? 1 : 0; fullReady = complete === 1;
buildTornEdge();
computeStageDimensions(); renderMarkers(); updateUI(); syncFull(); applyFull(); centerMap(false);
