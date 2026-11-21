// MODE KAMERA Ladang Langit (v6). Tombol di kanan bawah (di atas tombol waktu) berganti antara:
//   0 = Tampak biasa : kamera asli (K.camHome) menatap landscape luas.
//   1 = Tampak jauh  : (v9) kamera mundur ke depan & naik, menatap lembah luas dari kejauhan.
// Perpindahan halus (±1.6 dtk). Tombol baru muncul setelah kedatangan selesai (K.camEnable, dipanggil intro.js), supaya tidak mengganggu portal.
// K.camFX = offset tambahan posisi kamera (Vector3) untuk efek sinematik (dipakai cutscene tidur di walk.js).
(function(){var K=window.KAIH,X=K.ctx,cam=X.cam,home=K.camHome,PI=Math.PI;
var PITCH=58*PI/180,TZ=-24,DUR=1.6,mode=0,u=0,ready=false,fb=0,
    pTop=new THREE.Vector3(),qTop=new THREE.Quaternion(),tmp=new THREE.PerspectiveCamera(),T=new THREE.Vector3(0,0,TZ);
K.camFX=new THREE.Vector3();K.camMode=0;
var sm5=function(x){x=Math.min(1,Math.max(0,x));return x*x*x*(x*(x*6-15)+10)};
// v9: pose TAMPAK JAUH (menggantikan tampak atas): kamera mundur & naik, menatap lembah luas dari kejauhan (seperti foto referensi): terlihat gundukan di depan, arena, bukit & langit.
var PF=new THREE.Vector3(0,18,44),TF=new THREE.Vector3(0,2,-30);
function solveTop(){pTop.copy(PF);tmp.position.copy(PF);tmp.lookAt(TF);qTop.copy(tmp.quaternion)}

// ---------- tombol ----------
var b=document.createElement('button');b.id='cam-btn';b.type='button';b.className='off';b.setAttribute('aria-label','Ganti sudut kamera');document.body.appendChild(b);
function render(){b.innerHTML=mode?'<span class="ic">🏔️</span><span>Tampak jauh<small>ketuk: tampak biasa</small></span>':'<span class="ic">🏞️</span><span>Tampak biasa<small>ketuk: tampak jauh</small></span>'}
b.onclick=function(){mode=mode?0:1;K.camMode=mode;render();if(K.sfx&&K.sfx.tap)try{K.sfx.tap()}catch(e){}};
render();
function enable(){if(ready)return;ready=true;K.camReady=true;b.classList.remove('off')}
K.camEnable=enable;   // Fase 3.6: dipanggil intro.js (K.arrival) setelah kedatangan di Ladang Langit selesai (sebelumnya lewat K.portal.onEnd)

K.hooks.push(function(dt){var R=K.realDt||dt;
  if(!ready){if(K.drag&&K.drag.enabled){fb+=R;if(fb>60)enable()}return}   // cadangan: bila K.camEnable tidak terpanggil
  var goal=mode?1:0,st=R/DUR;u=goal>u?Math.min(goal,u+st):Math.max(goal,u-st);
  if(u<=0){cam.position.copy(home.pos);cam.quaternion.copy(home.quat)}
  else{solveTop();var e=sm5(u);cam.position.lerpVectors(home.pos,pTop,e);cam.quaternion.copy(home.quat).slerp(qTop,e)}
  cam.position.add(K.camFX)});
})();
