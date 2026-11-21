// Fase 3.6 — GESER KAMERA KIRI/KANAN (terutama layar sentuh / handphone).
// Seret jari (atau mouse) pada ruang kosong untuk menoleh ke kiri/kanan di Ladang Langit; menyeret BOLA tetap menggeser bola, bukan kamera.
// Memutar kamera (yaw) terhadap posisinya + sedikit bergeser menyamping agar terasa seperti menyapu lanskap. Ada inersia & batas (K.camYaw dalam radian).
// Berjalan SETELAH hook camera-mode.js (urutan manifest), jadi menumpang di atas pose kamera yang sudah dihitung.
(function(){var K=window.KAIH,X=K.ctx,cam=X.cam,cv=X.canvas;
var MAXYAW=.62,   // ±35 derajat
    TRUCK=5.5,    // geser menyamping maksimum (satuan dunia) pada yaw penuh
    st={on:false,id:-1,x0:0,yaw0:0,lx:0,lt:0,v:0,moved:false},tgt=0,cur=0,qy=new THREE.Quaternion(),UP=new THREE.Vector3(0,1,0);
K.camYaw=0;K.camPan={enabled:false};
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function sens(){var w=innerWidth;return (MAXYAW*2.1)/Math.max(280,w)}   // rad per piksel: geser selebar layar ≈ 2.1×MAXYAW
cv.addEventListener('pointerdown',function(e){
  if(!K.camPan.enabled||st.on||(e.pointerType==='mouse'&&e.button!==0))return;
  if(K.drag&&K.drag.enabled&&K.drag.pickAt(e.clientX,e.clientY))return;   // kena bola -> seret bola (drag.js)
  st.on=true;st.id=e.pointerId;st.x0=e.clientX;st.yaw0=tgt;st.lx=e.clientX;st.lt=performance.now();st.v=0;st.moved=false;
  try{cv.setPointerCapture(e.pointerId)}catch(_){}},{passive:true});
cv.addEventListener('pointermove',function(e){
  if(!st.on||e.pointerId!==st.id)return;var now=performance.now(),dx=e.clientX-st.x0;
  if(!st.moved&&Math.abs(dx)<6)return;st.moved=true;
  tgt=clamp(st.yaw0+dx*sens(),-MAXYAW,MAXYAW);   // 'pegang dunia': seret ke kanan -> dunia ikut ke kanan (kamera menoleh ke kiri)
  var dt=Math.max(1,now-st.lt);st.v=.7*st.v+.3*((e.clientX-st.lx)*sens()/dt*1000);st.lx=e.clientX;st.lt=now},{passive:true});
function end(e){if(!st.on||(e&&e.pointerId!==st.id))return;st.on=false;try{cv.releasePointerCapture(st.id)}catch(_){}
  if(st.moved)tgt=clamp(tgt+clamp(st.v,-3,3)*.18,-MAXYAW,MAXYAW)}   // lepas: sedikit meluncur (inersia)
cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);addEventListener('blur',function(){end()});
// ketuk dua kali pada ruang kosong = kembali menghadap tengah
var lastTap=0;cv.addEventListener('pointerup',function(e){if(st.moved||!K.camPan.enabled)return;var n=performance.now();if(n-lastTap<320&&!(K.drag&&K.drag.pickAt(e.clientX,e.clientY)))tgt=0;lastTap=n});
K.camPan.reset=function(){tgt=0};
K.hooks.push(function(dt){var R=K.realDt||dt;
  if(!K.camPan.enabled){cur+=(0-cur)*Math.min(1,R*4);K.camYaw=cur;if(Math.abs(cur)<1e-4){K.camYaw=0;return}}
  else cur+=(tgt-cur)*Math.min(1,R*7);
  K.camYaw=cur;if(Math.abs(cur)<1e-4)return;
  qy.setFromAxisAngle(UP,cur);cam.quaternion.premultiply(qy);
  cam.position.x-=Math.sin(cur)/Math.sin(MAXYAW)*TRUCK*.55})   // sedikit bergeser menyamping searah menoleh
})();
