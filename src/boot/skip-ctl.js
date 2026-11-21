try{document.fonts.load('16px Genshin')}catch(e){}
// KaihSkip (v13): tombol "Skip" di pojok kanan atas untuk cutscene utama. Tempel di <html> supaya tetap hidup saat Ladang Langit mengganti <body>.
//  c1  = cutscene pembuka (setelah ketukan pertama): DROPDOWN  → "Skip ke menu" | "Skip ke dashboard"
//  c1b = sesudah PLAY (prolog pulau + kamera masuk): skip biasa → langsung ke pulau yang bisa dikontrol
//  c2  = cutscene keluar Pulau Awan (teman-teman jatuh)        c3 = langit terbelah di Ladang Langit → bola mendarat
// show(id,{run,ready,hold,menu}): menu = [{label,run,ready,hold}] → tombol menjadi dropdown. ready() false → "Mohon tunggu…" lalu jalan otomatis.
(function(){var btn=null,menuEl=null,cur=null,timer=null;
function ensure(){if(btn)return btn;btn=document.createElement('button');btn.id='kx-skip';btn.type='button';btn.setAttribute('aria-label','Lewati cutscene');
  btn.innerHTML='<span class="kxs-d"></span><span class="kxs-t">Skip</span><span class="kxs-a">▸▸</span>';
  btn.addEventListener('click',function(e){e.stopPropagation();if(!cur||btn.classList.contains('wait'))return;if(cur.menu)toggleMenu();else trigger(cur)});
  btn.addEventListener('pointerdown',function(e){e.stopPropagation()});document.documentElement.appendChild(btn);
  menuEl=document.createElement('div');menuEl.id='kx-skip-menu';menuEl.addEventListener('pointerdown',function(e){e.stopPropagation()});document.documentElement.appendChild(menuEl);
  // FIX (Fase 2.2): sebelumnya menu ditutup saat pointerdown di item menu sendiri (capture) → item hilang sebelum 'click' terjadi,
  // dan e.target!==btn salah untuk klik pada <span> di dalam tombol. Sekarang hanya klik di luar tombol & menu yang menutup.
  document.addEventListener('pointerdown',function(e){if(menuEl.classList.contains('on')&&!btn.contains(e.target)&&!menuEl.contains(e.target))closeMenu()},true);return btn}
function css(){if(document.getElementById('kx-skip-menu-css'))return;var s=document.createElement('style');s.id='kx-skip-menu-css';s.textContent=
 '#kx-skip.has-menu .kxs-a{display:none}#kx-skip.has-menu .kxs-c{display:inline;color:#d3bc8e;transition:transform .25s}#kx-skip .kxs-c{display:none}#kx-skip.open .kxs-c{transform:rotate(180deg)}'+
 '#kx-skip-menu{position:fixed;top:calc(max(14px,env(safe-area-inset-top)) + 52px);right:max(14px,env(safe-area-inset-right));z-index:2147483001;min-width:224px;padding:8px;display:none;flex-direction:column;gap:6px;color:#ece5d8;'+
 'background:linear-gradient(180deg,#4a5368,#3b4255);border:1px solid rgba(236,229,216,.2);border-radius:6px;box-shadow:inset 0 0 0 2px #3b4255,inset 0 0 0 3px rgba(211,188,142,.55),0 12px 30px rgba(0,0,0,.5)}'+
 '#kx-skip-menu.on{display:flex}#kx-skip-menu button{display:flex;align-items:center;gap:10px;text-align:left;padding:11px 14px;border-radius:5px;border:1px solid rgba(211,188,142,.4);background:rgba(236,229,216,.07);color:inherit;font-size:14.5px;letter-spacing:.08em;cursor:pointer}'+
 '#kx-skip-menu button.kx-bold{font-weight:800;-webkit-text-stroke:.55px currentColor;letter-spacing:.1em}#kx-skip-menu button:hover{background:rgba(236,229,216,.18)}#kx-skip-menu button::before{content:"";width:8px;height:8px;background:#d3bc8e;transform:rotate(45deg);flex:none;box-shadow:0 0 6px rgba(246,230,180,.7)}';
 document.head.appendChild(s)}
function setWait(on){ensure().classList.toggle('wait',!!on);btn.querySelector('.kxs-t').textContent=on?'Mohon tunggu…':'Skip'}
function closeMenu(){if(menuEl)menuEl.classList.remove('on');if(btn)btn.classList.remove('open')}
function toggleMenu(){var on=!menuEl.classList.contains('on');menuEl.classList.toggle('on',on);btn.classList.toggle('open',on)}
function exec(c){try{c.run()}catch(e){console.warn('[7 KAIH] skip gagal',e)}if(c.hold){if(cur===c)setWait(true)}else if(cur===c)hide(c.id)}
function trigger(c){closeMenu();if(c.ready&&!c.ready()){setWait(true);clearInterval(timer);timer=setInterval(function(){if(cur!==c){clearInterval(timer);return}if(c.ready()){clearInterval(timer);exec(c)}},120);return}exec(c)}
function show(id,o){css();cur={id:id,run:o.run,ready:o.ready,hold:!!o.hold,menu:o.menu||null};ensure();clearInterval(timer);closeMenu();setWait(false);
  btn.classList.toggle('has-menu',!!cur.menu);btn.querySelector('.kxs-a').insertAdjacentHTML('afterend',btn.querySelector('.kxs-c')?'':'<span class="kxs-c">▾</span>');
  menuEl.innerHTML='';if(cur.menu)cur.menu.forEach(function(m){var b=document.createElement('button');b.type='button';b.textContent=m.label;if(m.bold)b.className='kx-bold';b.onclick=function(e){e.stopPropagation();trigger({id:cur.id,run:m.run,ready:m.ready,hold:m.hold,menu:null,_src:cur})};menuEl.appendChild(b)});
  void btn.offsetWidth;btn.classList.add('on')}
function hide(id){if(id&&(!cur||cur.id!==id))return;cur=null;clearInterval(timer);closeMenu();if(btn){btn.classList.remove('on','has-menu');setWait(false)}}
// trigger() dari item menu memakai objek sementara; exec() menyembunyikan lewat cur===c → samakan:
var _exec=exec;exec=function(c){if(c._src){var src=c._src;try{c.run()}catch(e){console.warn('[7 KAIH] skip gagal',e)}if(c.hold){if(cur===src)setWait(true)}else if(cur===src)hide(src.id);return}_exec(c)}   // FIX (Fase 2.3): jangan set "Mohon tunggu…" jika tombol sudah disembunyikan event;

// ---- FIX (Fase 2.3): layar loading untuk skip ke dashboard / skip pulau awan meledak (menempel di <html>, tetap hidup saat <body> diganti) ----
var loadEl=null,loadTimer=null,loadHideT=null;
function ensureLoad(){if(loadEl)return loadEl;
  var s=document.createElement('style');s.id='kx-load-css';s.textContent=
  '#kx-load{position:fixed;inset:0;z-index:2147481900;display:grid;place-items:center;background:#fff;color:#111;font-family:"Genshin","Plus Jakarta Sans",system-ui,sans-serif;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .45s ease,visibility 0s .45s}'+
  '#kx-load.on{opacity:1;visibility:visible;pointer-events:auto;transition:opacity .3s ease}'+
  '#kx-load .kl-box{display:flex;flex-direction:column;align-items:center;gap:14px;padding:0 24px;text-align:center}'+
  '#kx-load .kl-g{width:min(220px,48vw);height:min(220px,48vw);display:block}'+
  '#kx-load .kl-t{font-size:18px;letter-spacing:.2em;color:#111;font-weight:700}'+
  '#kx-load .kl-bar{width:min(260px,70vw);height:4px;border-radius:3px;background:rgba(0,0,0,.12);overflow:hidden}'+
  '#kx-load .kl-bar i{display:block;height:100%;width:0;background:#111;transition:width .25s ease}'+
  '#kx-load .kl-p{font-size:12px;letter-spacing:.2em;color:#222}';
  document.head.appendChild(s);
  loadEl=document.createElement('div');loadEl.id='kx-load';loadEl.setAttribute('role','status');loadEl.setAttribute('aria-live','polite');
  loadEl.innerHTML='<div class="kl-box"><canvas class="kl-g" width="440" height="440"></canvas><div class="kl-t"></div><div class="kl-bar"><i></i></div><div class="kl-p">0%</div></div>';
  loadEl.addEventListener('pointerdown',function(e){e.stopPropagation()});
  document.documentElement.appendChild(loadEl);
  addEventListener('kaih-landscape-progress',function(e){var d=e.detail||{};if(d.total){setPct(Math.round(100*d.done/d.total));if(d.done>=d.total&&loadEl.classList.contains('on'))loadEl.querySelector('.kl-t').textContent='Menyiapkan dunia…'}});
  return loadEl}
// ---- Guide 3D berputar di layar loading (guide-model.js; THREE r128 dimuat dari CDN bila belum ada) ----
var lg=null,lgRaf=0,lgStopT=null;
function lscript(src){return new Promise(function(res,rej){var q=document.createElement('script');q.src=src;q.onload=res;q.onerror=function(){rej(new Error(src))};document.head.appendChild(q)})}
function guideSpin(on){
  clearTimeout(lgStopT);
  if(!on){lgStopT=setTimeout(function(){cancelAnimationFrame(lgRaf);lgRaf=0},700);return}
  if(lgRaf)return; lgRaf=-1;
  (async function(){
    try{ if(!window.THREE)await lscript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'); if(!window.KaihGuideModel)await lscript('src/guide/guide-model.js'); }catch(e){lgRaf=0;return}
    if(!window.THREE||!window.KaihGuideModel||!loadEl||!loadEl.classList.contains('on')){lgRaf=0;return}
    var T=window.THREE,S=440;
    if(!lg){try{var rr=new T.WebGLRenderer({canvas:loadEl.querySelector('.kl-g'),alpha:true,antialias:true});rr.setClearColor(0,0);rr.setSize(S,S,false);
      var sc=new T.Scene(),cam=new T.OrthographicCamera(0,S,S,0,-1000,1000),gm=window.KaihGuideModel.build(T);sc.add(gm.root);sc.add(gm.cape.mesh);lg={rr:rr,sc:sc,cam:cam,gm:gm,init:false,last:performance.now()}}catch(e){lgRaf=0;return}}
    lg.last=performance.now(); var t0=lg.last;
    function tick(now){
      lgRaf=requestAnimationFrame(tick); var dt=Math.min(.05,Math.max(.001,(now-lg.last)/1000)),t=(now-t0)/1000;lg.last=now;
      var m=lg.gm,r=m.root,P=m.parts,bob=Math.sin(t*3)*S*.012;
      r.scale.set(S*.2,S*.2,S*.2); r.position.set(S/2,S*.5+bob,0);
      r.rotation.set(Math.sin(t*1.7)*.05,t*2.4,Math.sin(t*2.1)*.06);                  // berputar mengelilingi sumbu Y
      P.arms.forEach(function(a,i){var sg=i?1:-1;a.rotation.z=sg*(1.45+Math.sin(t*6+i*Math.PI)*.35);a.rotation.x=.05});
      P.legs.forEach(function(l,i){l.rotation.x=Math.sin(t*7+i*Math.PI)*.4});
      P.hat.rotation.x=Math.sin(t*3.2)*.08;
      r.updateMatrixWorld(true); if(!lg.init){m.cape.snap(r.matrixWorld,t);lg.init=true} m.cape.update(dt,t,r.matrixWorld,0,Math.sin(t*5)*60,.25);
      lg.rr.render(lg.sc,lg.cam);
    }
    lgRaf=requestAnimationFrame(tick);
  })();
}
function setPct(p){if(!loadEl)return;loadEl.querySelector('.kl-bar i').style.width=p+'%';loadEl.querySelector('.kl-p').textContent=p+'%'}
function hideLoad(){clearInterval(loadTimer);clearTimeout(loadHideT);if(loadEl)loadEl.classList.remove('on');guideSpin(false)}
function loading(on,o){o=o||{};clearInterval(loadTimer);clearTimeout(loadHideT);if(!on){hideLoad();return}
  ensureLoad();loadEl.querySelector('.kl-t').textContent=o.text||'Memuat…';setPct(0);void loadEl.offsetWidth;loadEl.classList.add('on');guideSpin(true);
  var t0=Date.now();loadTimer=setInterval(function(){var ok=false;try{ok=!!(o.until&&o.until())}catch(e){}
    if(ok){clearInterval(loadTimer);loadHideT=setTimeout(hideLoad,o.grace==null?300:o.grace)}
    else if(Date.now()-t0>(o.max||30000)){console.warn('[7 KAIH] loading terlalu lama, layar loading ditutup');hideLoad()}},100)}
window.KaihSkip={show:show,hide:hide,wait:setWait,loading:loading,current:function(){return cur&&cur.id}};

// ---- FIX #1 (Fase 2.1): bypass modal PILIH DEVICE — default langsung Desktop/Laptop ----
// Modal device tidak ditampilkan; device di-set ke 'laptop' via settings.js sudah cukup.
// __kaihDeviceChosen = true mencegah KaihDevice.ask() pernah terpanggil di sesi ini.
window.__kaihDeviceChosen = true;
function withDevice(fn){fn()}
// ---- c1: cutscene pembuka (dropdown) ----
function toMenu(){if(window.__kaihSkipPrelude)window.__kaihSkipPrelude();hide('c1')}
function toLadang(){withDevice(function(){window.__kaihFast=true;
  // FIX (Fase 2.3): tutup layar dengan loading sampai Ladang Langit siap (tanpa kilatan layar putih "Ketuk untuk lanjut"); musik menu dihentikan
  loading(true,{text:'Memuat Ladang Langit…',until:function(){return document.body.classList.contains('intro-done')},max:45000});
  try{if(window.kaihStopMenuMusic)window.kaihStopMenuMusic()}catch(e){}
  if(window.__kaihSkipPrelude)window.__kaihSkipPrelude();if(window.__loadKaihLandscape)window.__loadKaihLandscape()})}
function toDashboard(){try{if(window.kaihStopMenuMusic)window.kaihStopMenuMusic()}catch(e){}
  window.KaihSkipDash.play(function(){if(window.__kaihSkipPrelude)window.__kaihSkipPrelude();hide('c1')})}
addEventListener('kaih-prelude-start',function(){show('c1',{menu:[
  {label:'Skip ke menu',run:toMenu},
  {label:'Skip ke Ladang Langit',run:toLadang,ready:function(){return typeof window.__loadKaihLandscape==='function'},hold:true},
  {label:'SKIP KE DASHBOARD',bold:true,run:toDashboard,ready:function(){return !!(window.KaihSkipDash&&window.KaihMapDoorway)}}]})});
addEventListener('kaih-prelude-done',function(){hide('c1')});
// ---- c1b: sesudah PLAY ----
function skipIntro(){window.__kaihSkipIntro=true;var pr=document.getElementById('prolog');if(pr)pr.classList.remove('on')}
addEventListener('kaih-play-start',function(){show('c1b',{run:skipIntro,ready:function(){return !!window.__kaihMount},hold:true})});
addEventListener('kaih-ready',function(){hide('c1b')});
// ---- c2: cutscene keluar Pulau Awan ----
function skipFinale(){loading(true,{text:'Memuat Ladang Langit…',until:function(){return !!window.__landscapeLoaded}});if(window.__loadKaihLandscape)window.__loadKaihLandscape()}
addEventListener('kaih-finale',function(){hide('c1');hide('c1b');show('c2',{run:skipFinale,ready:function(){return typeof window.__loadKaihLandscape==='function'},hold:true})});
})();
