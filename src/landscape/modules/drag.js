// v6: batas depan seret dilonggarkan; TAHAN tanpa menggeser kursor = trigger easter egg (cincin hitung mundur). Versi lama: drag_old.js
// Seret benda dengan kursor / jari. Benda diangkat sedikit, mengikuti gerak kursor di atas tanah, lalu dijatuhkan lagi
// dan berdiri tegak di tempat barunya. Gerakannya lewat fisika (kecepatan), jadi tetap tertahan dinding & tidak menembus benda lain.
// Kamera rendah, jadi gerak kursor dipetakan ke tanah lewat selisih posisi layar (bukan titik yang diklik) supaya terasa wajar.
(function(){var K=window.KAIH,X=K.ctx,cam=X.cam,cv=X.canvas,phys=X.phys,A=K.ARENA;
var ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),v3=new THREE.Vector3(),drag=null,LIFT=1.1,
  D=K.drag={enabled:false};   // enabled diaktifkan intro.js saat cutscene portal dimulai
// setengah lebar landscape yang terlihat di kedalaman z (batas seret mengikuti layar, tanpa dinding)
function hw(z){var asp=innerWidth/innerHeight,hf=2*Math.atan(Math.tan(cam.fov*Math.PI/360)*asp),yw=Math.abs(K.camYaw||0);return Math.min(42,Math.tan(Math.min(1.3,hf/2+yw))*(8-z)*.9)}   // Fase 3.6: ikut melebar saat kamera digeser (K.camYaw)
function aim(x,y){var r=cv.getBoundingClientRect();ndc.set((x-r.left)/r.width*2-1,-((y-r.top)/r.height)*2+1);ray.setFromCamera(ndc,cam)}
function pick(){var list=[];phys.items.forEach(function(it){if(it.settled)list.push(it.w)});if(!list.length)return null;
  var h=ray.intersectObjects(list,true)[0];if(!h)return null;var o=h.object;while(o&&!(o.userData&&o.userData.item))o=o.parent;return o?o.userData.item:null}
// titik di tanah (y=0) yang dilihat lewat titik layar (nx,ny); jika menunjuk di atas cakrawala -> ujung terjauh arena
function ground(nx,ny){ray.setFromCamera(v3.set(nx,ny,.5),cam);var o=ray.ray.origin,d=ray.ray.direction;
  if(d.y<-.002){var s=-o.y/d.y;return[o.x+d.x*s,o.z+d.z*s]}
  var s2=(o.z-(-58))/Math.max(1e-4,-d.z);return[o.x+d.x*s2,-58]}
function down(e){if(!D.enabled||drag||(e.pointerType==='mouse'&&e.button!==0))return;aim(e.clientX,e.clientY);var it=pick();if(!it||it.noGrab)return;   // v7: noGrab = sedang menjalankan easter egg
  var b=it.body,r=cv.getBoundingClientRect(),s=new THREE.Vector3(b.position.x,0,b.position.z).project(cam);   // posisi dasar benda di layar
  drag={t0:performance.now(),px:e.clientX,py:e.clientY,lx:e.clientX,ly:e.clientY,it:it,id:e.pointerId,sx:s.x,sy:s.y,cx:(e.clientX-r.left)/r.width*2-1,cy:-((e.clientY-r.top)/r.height)*2+1,ty:Math.min(b.position.y+LIFT,12),tx:b.position.x,tz:b.position.z,hx:e.clientX,hy:e.clientY,ht:0,ptype:e.pointerType};   // hx,hy,ht = titik & lama TAHAN tanpa gerak
  it.dragging=true;if(K.onItemDown)K.onItemDown(it);if(K.sfx)K.sfx.grab();b.allowSleep=false;b.wakeUp();try{cv.setPointerCapture(e.pointerId)}catch(_){}cv.style.cursor='grabbing';e.preventDefault()}
function move(e){var r=cv.getBoundingClientRect();
  if(!drag){if(e.pointerType==='mouse'&&D.enabled){aim(e.clientX,e.clientY);cv.style.cursor=pick()?'grab':''}return}
  if(e.pointerId!==drag.id)return;drag.lx=e.clientX;drag.ly=e.clientY;
  if(Math.hypot(e.clientX-drag.hx,e.clientY-drag.hy)>(e.pointerType==='mouse'&&!(window.KaihSettings&&KaihSettings.device==='phone')?8:14)){drag.hx=e.clientX;drag.hy=e.clientY;drag.ht=0}   // bergeser -> hitungan TAHAN mulai dari 0 lagi

  var nx=(e.clientX-r.left)/r.width*2-1,ny=-((e.clientY-r.top)/r.height)*2+1,g=ground(drag.sx+nx-drag.cx,drag.sy+ny-drag.cy),lim=hw(g[1]);
  var ntx=Math.max(-lim,Math.min(lim,g[0])),ntz=Math.max(-58,Math.min(1.5,g[1]));   // v9: depan z>2 mulai bergelombang   // v6: batas depan (-4) dilonggarkan
  if(!K.walkOK||K.walkOK(ntx,ntz)){drag.tx=ntx;drag.tz=ntz}}   // v4: benda tidak bisa diseret masuk ke bukit (versi lama: drag_v3_old.js)
function up(e,force){if(!drag||(e&&e.pointerId!==drag.id))return;hideRing();var it=drag.it,b=it.body;it.dragging=false;it.kill=true;b.allowSleep=true;
  b.velocity.x*=.3;b.velocity.z*=.3;b.wakeUp();var clk=!force&&(performance.now()-drag.t0<450&&Math.hypot(drag.lx-drag.px,drag.ly-drag.py)<9);if(K.onItemUp)K.onItemUp(it);if(clk&&K.onItemClick)K.onItemClick(it);try{cv.releasePointerCapture(drag.id)}catch(_){}drag=null;cv.style.cursor=''}
cv.addEventListener('pointerdown',down);cv.addEventListener('pointermove',move);cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
addEventListener('blur',function(){up()});
cv.addEventListener('contextmenu',function(e){e.preventDefault()});   // tahan lama di layar sentuh jangan memunculkan menu
D.cancel=function(){up(null,true)};
D.pickAt=function(x,y){aim(x,y);var it=pick();return it||null};   // v11: dipakai mode Edit Bola untuk memilih bola dengan ketukan   // lepas paksa bola yang sedang dipegang (dipakai cutscene)

// ---------- v6: cincin hitung mundur easter egg (muncul setelah ±0.8 dtk menahan tanpa menggeser kursor) ----------
// Lama tahan tiap bola ada di K.holdNeed (walk.js): v8 = semua 6 detik.
var CIRC=2*Math.PI*24,ring=null,ringP=null,ringT=null,ringOn=false,RCOL={treadmill:'#ff7a9a',people:'#ff6b6b',angel:'#fff2b8',clock:'#ffd36b',bed:'#b9a7ff',book:'#8fd0ff',food:'#ffa94d'};
function buildRing(){if(ring)return;var st=document.createElement('style');
  st.textContent='#kx-hold{position:fixed;left:0;top:0;width:64px;height:64px;margin:-32px 0 0 -32px;z-index:30;pointer-events:none;opacity:0;transition:opacity .25s;filter:drop-shadow(0 3px 10px rgba(0,0,0,.35));will-change:transform}#kx-hold.on{opacity:1}#kx-hold svg{width:100%;height:100%;transform:rotate(-90deg)}#kx-hold .tx{position:absolute;inset:0;display:grid;place-items:center;font:800 16px ui-rounded,"SF Pro Rounded",system-ui,sans-serif;color:#fff;text-shadow:0 1px 5px rgba(0,0,0,.55)}';
  document.head.appendChild(st);ring=document.createElement('div');ring.id='kx-hold';
  ring.innerHTML='<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="rgba(30,40,90,.4)" stroke="rgba(255,255,255,.28)" stroke-width="6"/><circle class="p" cx="32" cy="32" r="24" fill="none" stroke="#ffe08a" stroke-width="6" stroke-linecap="round" stroke-dasharray="'+CIRC.toFixed(1)+'" stroke-dashoffset="'+CIRC.toFixed(1)+'"/></svg><div class="tx"></div>';
  document.body.appendChild(ring);ringP=ring.querySelector('.p');ringT=ring.querySelector('.tx')}
function hideRing(){if(ring&&ringOn){ring.classList.remove('on');ringOn=false}}
K.hooks.push(function(){var R=K.realDt||.016;if(!drag||!D.enabled){hideRing();return}
  var need=K.holdNeed&&K.holdNeed[drag.it.type];if(!need){hideRing();return}
  drag.ht+=R;
  if(drag.ht>=need){var it=drag.it;hideRing();up(null,true);if(K.onItemHold)K.onItemHold(it);return}   // cukup lama -> lepas bola, jalankan easter egg
  if(drag.ht<.8){hideRing();return}
  buildRing();if(!ringOn){ring.classList.add('on');ringOn=true}
  ring.style.transform='translate('+drag.lx+'px,'+(drag.ly-58)+'px)';
  ringP.style.strokeDashoffset=(CIRC*(1-drag.ht/need)).toFixed(1);ringP.setAttribute('stroke',RCOL[drag.it.type]||'#ffe08a');ringT.textContent=Math.ceil(need-drag.ht)});
// sebelum tiap langkah fisika: arahkan kecepatan benda yang dipegang ke target (pegas lembut, kecepatan dibatasi)
phys.beforeStep=function(){if(!drag)return;var b=drag.it.body,dx=drag.tx-b.position.x,dy=drag.ty-b.position.y,dz=drag.tz-b.position.z,k=14,vx=dx*k,vy=dy*k,vz=dz*k,l=Math.sqrt(vx*vx+vy*vy+vz*vz),m=38;
  if(l>m){vx*=m/l;vy*=m/l;vz*=m/l}b.velocity.set(vx,vy,vz);b.wakeUp()};
})();
