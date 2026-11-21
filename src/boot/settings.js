// KaihSettings (v13): pengaturan global — musik, SFX, grafik, device — + dialog PILIH DEVICE + tombol ⚙ kiri atas.
// Dimuat paling awal di <head> supaya patch audio terpasang SEBELUM skrip lain membuat AudioContext / Audio.
(function(){
var KEY='kaih-settings-v1',doc=document,html=doc.documentElement,
S=window.KaihSettings={music:1,sfx:1,gfx:null,shadows:true,device:null,gfxUser:false};
try{var o=JSON.parse(localStorage.getItem(KEY)||'{}');['music','sfx','shadows'].forEach(function(k){if(o[k]!=null)S[k]=o[k]});if(o.gfx&&['rendah','sedang','tinggi','extreme'].indexOf(o.gfx)>=0){S.gfx=o.gfx;S.gfxUser=true}if(o.device)S.device=o.device}catch(e){}
S.recommended=(matchMedia('(pointer:coarse)').matches||innerWidth<760)?'phone':'laptop';
if(!S.device)S.device=S.recommended;
if(!S.gfx)S.gfx=S.device==='phone'?'sedang':'tinggi';
function save(){try{localStorage.setItem(KEY,JSON.stringify({music:S.music,sfx:S.sfx,gfx:S.gfxUser?S.gfx:null,shadows:S.shadows,device:S.device}))}catch(e){}}
var clamp=function(v){return Math.max(0,Math.min(1,v))};

// ================= AUDIO =================
// SFX: semua WebAudio yang tersambung ke ctx.destination dilewatkan ke gain "SFX". Musik (sumber <audio> via createMediaElementSource) dialihkan ke gain "Musik".
// Musik yang memakai <audio> langsung: properti volume dikalikan nilai Musik (nilai asli yang diset skrip tetap dibaca balik utuh).
var ctxs=[],media=[],Orig=window.AudioContext||window.webkitAudioContext;
if(Orig&&window.AudioNode){
  var oc=AudioNode.prototype.connect;
  // FIX (Fase 2.4): dulu selalu meneruskan 3 argumen (d,a,b) -> connect(AudioParam) ditolak Chrome ("parameter 1 is not of type 'AudioNode'", mis. LFO humStart di Ladang Langit). Sekarang argumen asli diteruskan apa adanya.
  AudioNode.prototype.connect=function(d){if(this.__m&&d){if(d.__sfxMaster)d=d.__music;else if(d.context&&d.connect)d.__m=true}var args=arguments.length>1?[d].concat([].slice.call(arguments,1)):[d];return oc.apply(this,args)};
  var P=function(opt){var c=new Orig(opt),real=c.destination,gs=c.createGain(),gm=c.createGain();gs.gain.value=S.sfx;gm.gain.value=S.music;gs.__sfxMaster=true;gs.__music=gm;
    gs.connect(real);gm.connect(real);c.__kaihSfxDestination=gs;c.__kaihMusicDestination=gm;Object.defineProperty(c,'destination',{get:function(){return gs},configurable:true});ctxs.push({gs:gs,gm:gm});
    var cm=c.createMediaElementSource;c.createMediaElementSource=function(el){var n=cm.call(c,el);n.__m=true;el.__wa=true;return n};return c};
  P.prototype=Orig.prototype;window.AudioContext=P;window.webkitAudioContext=P;
}
var vd=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'volume');
if(vd&&vd.set)Object.defineProperty(HTMLMediaElement.prototype,'volume',{configurable:true,get:function(){return this.__rv!=null?this.__rv:vd.get.call(this)},
  set:function(v){this.__rv=v;if(media.indexOf(this)<0)media.push(this);vd.set.call(this,this.__wa?clamp(v):clamp(v*S.music))}});
S.setMusic=function(v){S.music=clamp(v);ctxs.forEach(function(c){c.gm.gain.value=S.music});media.forEach(function(el){try{vd.set.call(el,el.__wa?clamp(el.__rv):clamp(el.__rv*S.music))}catch(e){}});save()};
S.setSfx=function(v){S.sfx=clamp(v);ctxs.forEach(function(c){c.gs.gain.value=S.sfx});save()};

// ================= GRAFIK & DEVICE =================
// Extreme (Fase 2.3): resolusi render minimal 2x (supersampling, maks 3x) -> tajam/HD, tidak blur. Berat; butuh GPU kuat.
S.pixelRatio=function(){var d=window.devicePixelRatio||1;if(S.gfx==='extreme')return Math.min(2.5,Math.max(2,d));var phone=S.device==='phone',cap={rendah:.85,sedang:phone?1.25:1.5,tinggi:phone?1.75:2}[S.gfx]||1;return Math.max(.75,Math.min(d,cap))};
function shadowsOn(){return !!S.shadows&&S.gfx!=='rendah'}
function setShadows(R,scene,on){if(!R||R.shadowMap.enabled===on)return;R.shadowMap.enabled=on;scene.traverse(function(o){if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(function(m){m.needsUpdate=true})})}
// Extreme: peta bayangan tajam (>=2048) pada semua lampu; ukuran asli disimpan agar bisa dikembalikan saat turun dari Extreme.
function shadowRes(scene,big){if(!scene||!scene.traverse)return;scene.traverse(function(o){if(!o.isLight||!o.shadow||!o.shadow.mapSize)return;var u=o.userData||(o.userData={});if(u.__ms0==null)u.__ms0=o.shadow.mapSize.x;
  var want=big?Math.max(2048,u.__ms0):u.__ms0;if(o.shadow.mapSize.x!==want){o.shadow.mapSize.set(want,want);if(o.shadow.map){o.shadow.map.dispose();o.shadow.map=null}}})}
S.apply=function(){
  html.classList.toggle('dev-phone',S.device==='phone');html.classList.toggle('dev-laptop',S.device!=='phone');
  var on=shadowsOn();
  try{var K=window.KAIH;if(K&&K.ctx&&K.ctx.R){setShadows(K.ctx.R,K.ctx.scene,on);if(K.ctx.sun)K.ctx.sun.castShadow=on;shadowRes(K.ctx.scene,on&&S.gfx==='extreme');window.dispatchEvent(new Event('resize'))}}catch(e){}   // Ladang Langit: layout() membaca pixelRatio lagi
  try{var T=window.__kaihThree;if(T&&T.gl){T.setDpr(S.pixelRatio());setShadows(T.gl,T.scene,on);shadowRes(T.scene,on&&S.gfx==='extreme')}}catch(e){}                                         // Pulau Awan
};
S.setGfx=function(q){S.gfx=q;S.gfxUser=true;save();S.apply();sync()};
S.setShadows=function(v){S.shadows=!!v;save();S.apply()};
S.setDevice=function(d){S.device=d;if(!S.gfxUser)S.gfx=d==='phone'?'sedang':'tinggi';save();S.apply();sync()};
S.apply();

// ================= UI =================
var css=document.createElement('style');css.id='kx-settings-css';css.textContent=
'#kx-gear{position:fixed;top:max(14px,env(safe-area-inset-top));left:max(14px,env(safe-area-inset-left));z-index:2147482000;width:44px;height:44px;display:grid;place-items:center;border-radius:8px;cursor:pointer;font-size:22px;color:#d3bc8e;border:1px solid rgba(211,188,142,.6);background:linear-gradient(180deg,#4a5368,#3b4255);box-shadow:inset 0 0 0 2px #3b4255,inset 0 0 0 3px rgba(211,188,142,.4),0 6px 18px rgba(0,0,0,.45);padding:0;transition:transform .25s,filter .2s;-webkit-tap-highlight-color:transparent}'+
'#kx-gear:hover{filter:brightness(1.12)}#kx-gear:active{transform:scale(.94)}#kx-gear.on{background:linear-gradient(180deg,#f6f0e4,#e2d8c2);color:#8a6a2a}'+
'#kx-set{position:fixed;top:calc(max(14px,env(safe-area-inset-top)) + 54px);left:max(14px,env(safe-area-inset-left));z-index:2147482001;width:min(340px,calc(100vw - 28px));max-height:calc(100vh - 90px);overflow:auto;padding:18px 16px 14px;color:#ece5d8;background:linear-gradient(180deg,#4a5368,#3b4255);border:1px solid rgba(236,229,216,.2);border-radius:6px;box-shadow:inset 0 0 0 3px #3b4255,inset 0 0 0 4px rgba(211,188,142,.6),0 12px 34px rgba(0,0,0,.5);opacity:0;transform:translateY(-8px);pointer-events:none;visibility:hidden;transition:opacity .25s,transform .25s,visibility 0s .25s}'+
'#kx-set.on{opacity:1;transform:none;pointer-events:auto;visibility:visible;transition:opacity .25s,transform .25s}'+
'#kx-set h3{margin:0 0 4px;font-weight:400;font-size:17px;letter-spacing:.22em;color:#f6e6b4;text-align:center}'+
'#kx-set .ks-sec{margin:14px 0 6px;font-size:12px;letter-spacing:.3em;color:#d3bc8e;display:flex;align-items:center;gap:8px}#kx-set .ks-sec::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(211,188,142,.6),transparent)}'+
'#kx-set .ks-row{display:grid;grid-template-columns:78px 1fr 42px;align-items:center;gap:8px;margin:8px 0;font-size:14px}#kx-set .ks-row output{text-align:right;font-size:13px}#kx-set input[type=range]{width:100%;accent-color:#d3bc8e;height:26px;margin:0}'+
'#kx-set .ks-hint{display:none;margin-top:8px;font-size:12px;line-height:1.45;color:#d3bc8e}#kx-set .ks-hint.on{display:block}'+
'#kx-set .ks-seg{display:flex;gap:6px}#kx-set .ks-seg button{flex:1;height:38px;border-radius:6px;border:1px solid rgba(211,188,142,.45);background:rgba(236,229,216,.08);color:#ece5d8;font-size:13.5px;letter-spacing:.05em;cursor:pointer;padding:0 4px}'+
'#kx-set .ks-seg button.sel{background:linear-gradient(180deg,#f6f0e4,#e2d8c2);color:#3b4255;border:0;box-shadow:0 0 0 2px #3b4255,0 0 0 3px #d3bc8e}'+
'#kx-set label.ks-chk{display:flex;align-items:center;gap:8px;margin-top:10px;font-size:13.5px;cursor:pointer}#kx-set label.ks-chk input{accent-color:#d3bc8e;width:17px;height:17px}'+
'#kx-set .ks-close{margin-top:14px;width:100%;height:40px;border-radius:7px;border:0;cursor:pointer;font-size:14px;letter-spacing:.14em;color:#3b4255;background:linear-gradient(180deg,#f6f0e4,#e2d8c2);box-shadow:0 0 0 2px #3b4255,0 0 0 3px #d3bc8e}'+
'#kx-set::before{content:"◆";position:absolute;left:50%;top:-10px;transform:translateX(-50%);color:#d3bc8e;font-size:15px;line-height:1;text-shadow:0 0 8px rgba(246,230,180,.8)}'+
/* dialog pilih device */
'#kx-device{position:fixed;inset:0;z-index:2147483100;display:none;place-items:center;background:rgba(10,14,30,.66);padding:18px}#kx-device.on{display:grid}'+
'#kx-device .dc{position:relative;width:min(560px,100%);padding:26px 22px 20px;text-align:center;color:#ece5d8;background:linear-gradient(180deg,#4a5368,#3b4255);border:1px solid rgba(236,229,216,.2);border-radius:6px;box-shadow:inset 0 0 0 3px #3b4255,inset 0 0 0 4px rgba(211,188,142,.6),0 16px 50px rgba(0,0,0,.6)}'+
'#kx-device .dc::before{content:"◆";position:absolute;left:50%;top:-11px;transform:translateX(-50%);color:#d3bc8e;font-size:17px;line-height:1;text-shadow:0 0 10px rgba(246,230,180,.9)}'+
'#kx-device h2{margin:0 0 6px;font-weight:400;font-size:22px;letter-spacing:.2em;color:#f6e6b4}#kx-device p{margin:0 0 18px;font-size:14px;opacity:.85}'+
'#kx-device .opts{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:480px){#kx-device .opts{grid-template-columns:1fr}}'+
'#kx-device .opt{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;padding:18px 10px 14px;border-radius:8px;border:1px solid rgba(211,188,142,.55);background:rgba(236,229,216,.07);color:#ece5d8;cursor:pointer;transition:transform .2s,background .2s}'+
'#kx-device .opt:hover{background:rgba(236,229,216,.16);transform:translateY(-2px)}#kx-device .opt:active{transform:scale(.97)}'+
'#kx-device .opt .ic{font-size:44px;line-height:1}#kx-device .opt b{font-weight:400;font-size:17px;letter-spacing:.14em;color:#f6e6b4}#kx-device .opt small{font-size:12px;opacity:.8;line-height:1.35}'+
'#kx-device .opt .rec{position:absolute;top:8px;right:8px;font-size:10.5px;letter-spacing:.1em;padding:2px 8px;border-radius:10px;background:#d3bc8e;color:#3b4255}'+
/* penyesuaian UI per device */
'html.dev-phone #kx-gear{width:50px;height:50px;font-size:24px}html.dev-phone #kx-skip{padding:12px 20px 12px 16px;font-size:17px}html.dev-phone #kx-skip-menu button{padding:14px 16px;font-size:16px}'+
'html.dev-phone #play{height:64px!important;font-size:22px!important}html.dev-phone #kx-btn{padding:16px 22px!important;font-size:17px!important}'+
'html.dev-phone #edit-btn,html.dev-phone #cam-btn,html.dev-phone #time-btn,html.dev-phone #dash-btn{padding:13px 18px;font-size:15px;min-height:48px}html.dev-phone .ed-chip{width:44px;height:44px}html.dev-phone .ed-row button{height:34px}html.dev-phone .ed-act button{height:44px}'+
'html.dev-phone body button.shrink-0.rounded-full{padding:12px 18px!important;font-size:15px!important}html.dev-phone #kx-set .ks-seg button{height:44px}'+
'html.dev-laptop #kx-card{width:min(460px,92vw)}html.dev-laptop #kx-set{width:360px}'+
/* kartu judul Pulau Awan digeser ke KANAN tombol ⚙ (ruang di bawah ⚙ dikosongkan untuk Guide) */
'.pointer-events-none.fixed.left-4.top-4{top:max(14px,env(safe-area-inset-top))!important;left:calc(max(14px,env(safe-area-inset-left)) + 54px)!important;padding-top:0!important}'+
'html.dev-phone .pointer-events-none.fixed.left-4.top-4{left:calc(max(14px,env(safe-area-inset-left)) + 60px)!important}';
(doc.head||html).appendChild(css);
function el(t,c,h){var e=doc.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}
var gear=el('button','','⚙');gear.id='kx-gear';gear.type='button';gear.setAttribute('aria-label','Pengaturan');html.appendChild(gear);
var set=el('div');set.id='kx-set';html.appendChild(set);
set.innerHTML='<h3>PENGATURAN</h3><div class="ks-sec">AUDIO</div>'+
 '<div class="ks-row"><span>Musik</span><input type="range" id="ks-music" min="0" max="100" step="1"><output id="ks-music-o"></output></div>'+
 '<div class="ks-row"><span>Efek suara</span><input type="range" id="ks-sfx" min="0" max="100" step="1"><output id="ks-sfx-o"></output></div>'+
 '<div class="ks-sec">GRAFIK</div><div class="ks-seg" id="ks-gfx"><button type="button" data-v="rendah">Rendah</button><button type="button" data-v="sedang">Sedang</button><button type="button" data-v="tinggi">Tinggi</button><button type="button" data-v="extreme">Extreme</button></div><div class="ks-hint" id="ks-hint">Resolusi HD penuh (supersampling) dan bayangan tajam, gambar tidak blur. Sangat berat: butuh GPU kuat. Antialias penuh aktif setelah muat ulang halaman.</div>'+
 '<label class="ks-chk"><input type="checkbox" id="ks-shadow"><span>Bayangan</span></label>'+
 '<div class="ks-sec">DEVICE</div><div class="ks-seg" id="ks-dev"><button type="button" data-v="laptop">💻 Laptop</button><button type="button" data-v="phone">📱 Handphone</button></div>'+
 '<button type="button" class="ks-close">TUTUP</button>';
function sync(){set.querySelector('#ks-music').value=Math.round(S.music*100);set.querySelector('#ks-music-o').textContent=Math.round(S.music*100)+'%';
  set.querySelector('#ks-sfx').value=Math.round(S.sfx*100);set.querySelector('#ks-sfx-o').textContent=Math.round(S.sfx*100)+'%';
  [].forEach.call(set.querySelectorAll('#ks-gfx button'),function(b){b.classList.toggle('sel',b.dataset.v===S.gfx)});
  [].forEach.call(set.querySelectorAll('#ks-dev button'),function(b){b.classList.toggle('sel',b.dataset.v===S.device)});
  set.querySelector('#ks-hint').classList.toggle('on',S.gfx==='extreme');set.querySelector('#ks-shadow').checked=!!S.shadows;set.querySelector('#ks-shadow').disabled=S.gfx==='rendah'}
// FIX #2 (Fase 2.1): beepCtx gunakan Orig (unpatched) agar tidak lewat sfx-gain node yang diatur slider.
// Dengan ini slider SFX tetap mengatur volume SFX dunia, beep preview berjalan terpisah.
var beepCtx=null;function beep(){try{
  // Gunakan Orig (AudioContext asli sebelum di-patch) agar preview bip tidak terpengaruh gain SFX
  var AC=Orig||window.AudioContext;beepCtx=beepCtx||new AC();
  if(beepCtx.state==='suspended')beepCtx.resume();
  var o=beepCtx.createOscillator(),g=beepCtx.createGain();
  o.frequency.value=660;g.gain.setValueAtTime(.18,beepCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(.001,beepCtx.currentTime+.14);
  o.connect(g);g.connect(beepCtx.destination);o.start();o.stop(beepCtx.currentTime+.16)
}catch(e){}}
// FIX #2: stopPropagation di tiap elemen input/slider agar drag slider tidak menutup modal
[].forEach.call(set.querySelectorAll('input[type=range]'),function(r){
  r.addEventListener('pointerdown',function(e){e.stopPropagation()});
  r.addEventListener('pointermove',function(e){e.stopPropagation()})});
set.querySelector('#ks-music').oninput=function(){S.setMusic(this.value/100);sync()};
set.querySelector('#ks-sfx').oninput=function(){S.setSfx(this.value/100);sync()};set.querySelector('#ks-sfx').onchange=beep;
[].forEach.call(set.querySelectorAll('#ks-gfx button'),function(b){b.onclick=function(e){e.stopPropagation();S.setGfx(b.dataset.v)}});
[].forEach.call(set.querySelectorAll('#ks-dev button'),function(b){b.onclick=function(e){e.stopPropagation();S.setDevice(b.dataset.v)}});
set.querySelector('#ks-shadow').onchange=function(){S.setShadows(this.checked);sync()};
function toggle(on){var v=on==null?!set.classList.contains('on'):on;set.classList.toggle('on',v);gear.classList.toggle('on',v);if(v)sync()}
S.toggle=toggle;
gear.onclick=function(e){e.stopPropagation();toggle()};set.querySelector('.ks-close').onclick=function(e){e.stopPropagation();toggle(false)};
set.addEventListener('pointerdown',function(e){e.stopPropagation()});
// FIX (Fase 2.2): listener capture ini dulu menutup panel untuk SEMUA pointerdown selain di ⚙ — termasuk di dalam panel sendiri,
// sehingga tombol Rendah/Sedang/Tinggi, Laptop/Handphone, slider, & TUTUP tak pernah menerima klik. Sekarang hanya klik DI LUAR panel & ⚙ yang menutup.
doc.addEventListener('pointerdown',function(e){if(set.classList.contains('on')&&!set.contains(e.target)&&!gear.contains(e.target)&&!(e.target.closest&&e.target.closest('[data-kx-toggle]')))toggle(false)},true);
sync();
// ---- dialog PILIH DEVICE (muncul saat menekan PLAY / skip ke dashboard) ----
var dlg=el('div');dlg.id='kx-device';dlg.setAttribute('role','dialog');dlg.setAttribute('aria-modal','true');html.appendChild(dlg);
function buildDlg(){var rec=S.recommended;dlg.innerHTML='<div class="dc"><h2>PILIH DEVICE</h2><p>Tampilan dan grafik akan disesuaikan dengan pilihanmu.</p><div class="opts">'+
  '<button type="button" class="opt" data-d="laptop">'+(rec==='laptop'?'<span class="rec">DISARANKAN</span>':'')+'<span class="ic">💻</span><b>LAPTOP</b><small>Layar lebar, mouse &amp; keyboard.<br>Grafik tinggi.</small></button>'+
  '<button type="button" class="opt" data-d="phone">'+(rec==='phone'?'<span class="rec">DISARANKAN</span>':'')+'<span class="ic">📱</span><b>HANDPHONE</b><small>Layar sentuh, tombol lebih besar.<br>Grafik lebih ringan.</small></button></div></div>'}
var pending=null;
S.askDevice=function(cb){if(window.__kaihDeviceChosen){cb&&cb();return}pending=cb;buildDlg();dlg.classList.add('on')};
dlg.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.opt');if(!b)return;S.setDevice(b.dataset.d);window.__kaihDeviceChosen=true;dlg.classList.remove('on');var f=pending;pending=null;if(f)f()});
window.KaihDevice={ask:S.askDevice};
})();
