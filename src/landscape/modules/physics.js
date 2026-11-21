// v6: barrier depan kamera dihapus, barrier bukit diperkecil (K.HILL_PAD), bola hilang -> respawn dari langit (api.respawn). Versi lama: physics_old.js
// Fisika benda tegar (cannon.js): 7 benda keluar dari portal, jatuh, lalu berdiri tegak (hanya boleh berputar menyamping/yaw) dan bisa diseret.
// SPEC mendefinisikan bentuk tabrakan tiap model (satuan model, lalu dikali SC). Ubah di sini untuk menyetel massa/ukuran.
(function(){var K=window.KAIH=window.KAIH||{};
// letak portal di langit (dipakai portal.js dan physics.js): x,y,z = pusat retakan, h = setengah tinggi retakan
K.PORTAL={x:0,y:19,z:-30,h:6};
var GRAV=12,FIX=1/60,G_GROUND=1,G_AIR=2,G_LAND=4;   // GRAV = gravitasi saat turun; G_* = grup tabrakan (benda di udara tidak saling menabrak)
var wrap=function(a){a%=6.2832;if(a>3.1416)a-=6.2832;if(a<-3.1416)a+=6.2832;return a};
var SC=1.25,B=function(hx,hy,hz,x,y,z){return{t:'b',h:[hx,hy,hz],c:[x,y,z]}},S=function(r,x,y,z){return{t:'s',r:r,c:[x,y,z]}};
var people=[B(2.4,.06,2.4,0,.06,0)];for(var i=0;i<7;i++){var a=i/7*Math.PI*2,k=i%3===2?.75:1;people.push(B(.3*k,.86*k,.3*k,Math.cos(a)*1.7,.86*k,Math.sin(a)*1.7))}
// v5: tanpa pijakan -> tiap bola cukup satu collider bola di pusat badan (BY = tinggi pusat badan di model, LIFT = bola melayang sedikit di atas tanah)
var BY={treadmill:1.3,bed:1.1,angel:1.95,food:1.15,book:1.7,people:1.12,clock:1.2},LIFT={treadmill:.17,bed:.1,angel:.35,food:0,book:0,people:0,clock:.2},MASS={treadmill:6,bed:7,angel:2.5,food:3.5,book:3,people:9,clock:4};
var SPEC={};Object.keys(BY).forEach(function(k){SPEC[k]={m:MASS[k],s:[S(1.02,0,BY[k],0)]}});
// bola tidak boleh masuk ke bukit / jatuh ke lautan awan: titik harus di lantai lembah (cek pusat + 4 titik di tepi bola)
// v6: HILL_PAD = jarak aman dari lereng bukit (dulu 1.5 -> terasa seperti dinding tak terlihat). Sekarang hampir pas dengan tepi bukit; naikkan angkanya kalau bola terlalu menembus bukit.
K.HILL_PAD=.9;K.HILL_H=.32;
K.walkOK=function(x,z){var r=K.HILL_PAD,P=[[0,0],[r,0],[-r,0],[0,r],[0,-r]];for(var i=0;i<5;i++){var h=K.H(x+P[i][0],z+P[i][1]);if(h>K.HILL_H||h<-.35)return false}return true};
K.createPhysics=function(scene){var A=K.ARENA,ZMIN=A.zmin,ZMAX=A.zmax,ZC=A.zc;
  var W=new CANNON.World();W.gravity.set(0,-GRAV,0);W.broadphase=new CANNON.NaiveBroadphase();W.solver.iterations=20;W.allowSleep=true;
  var mo=new CANNON.Material('obj'),mg=new CANNON.Material('ground');
  W.addContactMaterial(new CANNON.ContactMaterial(mo,mg,{friction:.6,restitution:.1}));
  W.addContactMaterial(new CANNON.ContactMaterial(mo,mo,{friction:.5,restitution:.1}));
  function stat(b){b.collisionFilterGroup=G_GROUND;b.collisionFilterMask=0xFFFF;W.addBody(b);return b}
  var gb=new CANNON.Body({mass:0,material:mg});gb.addShape(new CANNON.Plane());gb.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);stat(gb);
  var walls=[];
  function setArena(wx){walls.forEach(function(b){W.removeBody(b)});walls=[];var H=30,hz=(ZMAX-ZMIN)/2+1;
    function add(hx,hy,hz2,x,y,z){var b=new CANNON.Body({mass:0,material:mg});b.addShape(new CANNON.Box(new CANNON.Vec3(hx,hy,hz2)));b.position.set(x,y,z);stat(b);walls.push(b)}
    /* dinding tak terlihat dihapus: landscape terbuka (versi lama: physics_old.js) */
    api.wx=wx;api.rows=wx>=11?2:3;
    }
  var items=[],api={wx:12,rows:2,time:0,started:false,t0:0,gap:.75,items:items,beforeStep:null,setArena:setArena},acc=0;
  var order=['angel','book','people','bed','treadmill','food','clock'].map(function(t){return K.models.zm.filter(function(z){return z.type===t})[0]});
  order.forEach(function(z,idx){var sp=SPEC[z.type],vol=0,com=[0,0,0];
    sp.s.forEach(function(s){s.v=s.t==='b'?8*s.h[0]*s.h[1]*s.h[2]:4/3*Math.PI*Math.pow(s.r,3);vol+=s.v;for(var k=0;k<3;k++)com[k]+=s.c[k]*s.v});com=com.map(function(x){return x/vol});
    var body=new CANNON.Body({mass:sp.m,material:mo,linearDamping:.45,angularDamping:.5,allowSleep:false});
    body.collisionFilterGroup=G_AIR;body.collisionFilterMask=G_GROUND|G_LAND;   // di udara: hanya menabrak tanah/dinding & benda yang sudah mendarat
    sp.s.forEach(function(s){var sh=s.t==='b'?new CANNON.Box(new CANNON.Vec3(s.h[0]*SC,s.h[1]*SC,s.h[2]*SC)):new CANNON.Sphere(s.r*SC);
      body.addShape(sh,new CANNON.Vec3((s.c[0]-com[0])*SC,(s.c[1]-com[1])*SC,(s.c[2]-com[2])*SC))});
    // w = posisi/yaw dari fisika; tilt = goyangan visual saat melayang & miring saat diseret; m = model
    var w=new THREE.Group(),tilt=new THREE.Group(),m=K.r3f.mount(K.models.xj[z.type]);m.scale.setScalar(SC);m.position.set(-com[0]*SC,-com[1]*SC+(LIFT[z.type]||0)*SC,-com[2]*SC);
    tilt.add(m);w.add(tilt);w.visible=false;scene.add(w);
    var it={m:m,my0:m.position.y,hy:0,ax:0,az:0,ay:0,sx:1,sy:1,ox:undefined,oz:undefined,idx:idx,type:z.type,body:body,w:w,tilt:tilt,spawned:false,settled:false,kill:true,dragging:false,age:0,ph:Math.random()*6.28,spin:(Math.random()<.5?-1:1)*(1.6+Math.random()*1.6),
      relT:0,rx:0,ry:0,rz:0,lx:0,lz:0};
    w.userData.item=it;
    // sentuhan pertama (tanah / benda lain): hentikan luncuran mendatar supaya benda mendarat rapi di tempatnya
    body.addEventListener('collide',function(){if(!it.kill)return;it.kill=false;body.velocity.x*=.1;body.velocity.z*=.1;
      if(!it.settled){it.settled=true;it.relT=0;it.rx=wrap(it.tilt.rotation.x);it.ry=wrap(it.tilt.rotation.y);it.rz=wrap(it.tilt.rotation.z);
        body.collisionFilterGroup=G_LAND;body.collisionFilterMask=G_GROUND|G_AIR|G_LAND;body.linearDamping=.35}});
    // suara tumbukan: tiap benda punya bahan suara sendiri (lihat K.sfx.impact di sfx.js)
    body.addEventListener('collide',function(e){if(K.sfx&&e.contact)K.sfx.impact(sp.m,e.contact.getImpactVelocityAlongNormal(),it.type)});
    items.push(it)});
  var slots=[];
  // dipanggil saat portal terbuka: benda ke-i keluar pada waktu delay + i*gap (detik)
  api.begin=function(delay,gap){api.started=true;api.t0=api.time+delay;api.gap=gap||.75;tgs=pick()};
  // (v4: titik pendaratan menghindari bukit lewat K.isFlat dari terrain.js; versi sebelumnya: physics_v3_old.js)
  // jatuh dari langit: tiap benda mendarat di titik acak yang tersebar (saling berjauhan) di seluruh landscape terbuka
  var tgs=[];
  // v9: OKLUSI. true bila titik (x,z) tertutup bukit dari kamera (bola di situ tidak kelihatan). Dipakai agar bola tidak mendarat/berjalan di belakang bukit.
  function occl(from,x,z,y){var ty=(y||0)+1.3,N=28;for(var i=1;i<N;i++){var t=i/N,sx=from.x+(x-from.x)*t,sz=from.z+(z-from.z)*t,sy=from.y+(ty-from.y)*t;if(K.H(sx,sz)>sy+.1)return true}return false}
  K.vis=function(x,z){var h=K.camHome;return h?!occl(h.pos,x,z,0):true};
  function pick(){var c=K.ctx&&K.ctx.cam,asp=innerWidth/innerHeight,hf=c?2*Math.atan(Math.tan(c.fov*Math.PI/360)*asp):1.6,out=[];
    for(var n=0;n<7;n++){var best=[0,-25],bd=-1;for(var k=0;k<40;k++){var z=-8-38*Math.random(),hw=Math.min(40,Math.tan(hf/2)*(8-z)*.8),x=(Math.random()*2-1)*hw,d=1e9;if(!K.walkOK(x,z)||!K.vis(x,z))continue;   // hindari bukit/kubah & area di belakang bukit: hanya mendarat di dasar lembah yang rata
     
      out.forEach(function(o){d=Math.min(d,Math.hypot(o[0]-x,(o[1]-z)*1.2))});if(d>bd){bd=d;best=[x,z]}}out.push(best)}return out}
  function spawn(it){var t=tgs[it.idx]||[0,-25],b=it.body;
    b.position.set(t[0],44+Math.random()*10,t[1]);it.ox=t[0];it.oz=t[1];b.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0),Math.random()*6.28);
    b.velocity.set(0,-4,0);b.angularVelocity.set(0,0,0);
    W.addBody(b);it.spawned=true;it.age=0;it.w.visible=true;it.w.scale.setScalar(.2);it.w.position.copy(b.position);it.w.quaternion.copy(b.quaternion);
    if(K.sfx)K.sfx.spawn(it.idx)}
  // kunci rotasi: benda hanya boleh berputar menyamping (yaw), tidak boleh terguling -> selalu berdiri tegak
  function lock(){items.forEach(function(it){var b=it.body;if(!it.spawned||it.nolock||b.sleepState===CANNON.Body.SLEEPING)return;   // v7: nolock = sedang terbang (easter egg buku)
    b.angularVelocity.x=0;b.angularVelocity.z=0;var q=b.quaternion,l=Math.sqrt(q.y*q.y+q.w*q.w)||1;q.set(0,q.y/l,0,q.w/l);b.aabbNeedsUpdate=true;
    // v5: bola yang sudah mendarat tidak boleh menembus bukit / keluar lembah -> kembalikan ke titik aman terakhir (geser mengikuti sumbu yang masih aman)
    if(it.settled){var p=b.position;
      if(p.z<-52)p.z=-52;   /* v6: batas depan kamera (z>-7) dihapus; bola yang keluar layar ditangani respawn */
      if(K.walkOK(p.x,p.z)){it.ox=p.x;it.oz=p.z}
      else if(it.ox!==undefined){if(K.walkOK(p.x,it.oz))p.z=it.oz;else if(K.walkOK(it.ox,p.z))p.x=it.ox;else{p.x=it.ox;p.z=it.oz}b.velocity.x*=.2;b.velocity.z*=.2}}})}

  // ---------- v6: RESPAWN. Bola yang hilang dari kamera (lewat depan kamera, keluar layar, jatuh) turun lagi dari langit ----------
  // 'hilang' = pusat bola tidak terlihat oleh kamera (pose asli ATAU pose sekarang) selama LOST_AFTER detik, atau jatuh/keluar dunia (langsung).
  var LOST_AFTER=1.6,hcam=null,fr=new THREE.Frustum(),pmx=new THREE.Matrix4(),bs=new THREE.Sphere();
  function seen(c,p){c.updateMatrixWorld(true);pmx.multiplyMatrices(c.projectionMatrix,c.matrixWorldInverse);fr.setFromProjectionMatrix(pmx);bs.center.set(p.x,p.y+1.2,p.z);bs.radius=2.4;return fr.intersectsSphere(bs)}
  function inView(p){var cam=K.ctx&&K.ctx.cam,home=K.camHome;if(!cam||!home)return true;
    if(!hcam)hcam=new THREE.PerspectiveCamera();
    hcam.fov=cam.fov;hcam.aspect=cam.aspect;hcam.near=cam.near;hcam.far=cam.far;hcam.updateProjectionMatrix();hcam.position.copy(home.pos);hcam.quaternion.copy(home.quat);
    return(seen(hcam,p)&&!occl(home.pos,p.x,p.z,p.y-1.3))||(seen(cam,p)&&!occl(cam.position,p.x,p.z,p.y-1.3))}   // v9: kelihatan = di dalam layar DAN tidak tertutup bukit
  function lostState(it){var p=it.body.position;
    if(!isFinite(p.x+p.y+p.z)||p.y<-9||p.y>90||p.z>12||p.z<-75||Math.abs(p.x)>110)return 2;   // pasti hilang
    return inView(p)?0:1}                                                                       // di luar layar: tunggu sebentar
  function pickOne(self){var c=K.ctx&&K.ctx.cam,asp=innerWidth/innerHeight,hf=c?2*Math.atan(Math.tan(c.fov*Math.PI/360)*asp):1.6,best=[0,-25],bd=-1;
    for(var k=0;k<40;k++){var z=-8-38*Math.random(),hw=Math.min(40,Math.tan(hf/2)*(8-z)*.8),x=(Math.random()*2-1)*hw,d=1e9;if(!K.walkOK(x,z)||!K.vis(x,z))continue;
      items.forEach(function(o){if(o===self||!o.spawned)return;d=Math.min(d,Math.hypot(o.body.position.x-x,(o.body.position.z-z)*1.2))});if(d>bd){bd=d;best=[x,z]}}return best}
  api.respawn=function(it){var t=pickOne(it),b=it.body;
    b.position.set(t[0],44+Math.random()*10,t[1]);it.ox=t[0];it.oz=t[1];b.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0),Math.random()*6.28);
    b.velocity.set(0,-4,0);b.angularVelocity.set(0,0,0);
    b.collisionFilterGroup=G_AIR;b.collisionFilterMask=G_GROUND|G_LAND;b.linearDamping=.45;b.allowSleep=false;
    if(W.bodies.indexOf(b)<0)W.addBody(b);b.wakeUp();
    it.settled=false;it.kill=true;it.age=0;it.lost=0;it.dragging=false;it.hy=0;it.ax=0;it.az=0;it.ay=0;it.sx=1;it.sy=1;
    it.w.visible=true;it.w.scale.setScalar(.2);it.w.position.copy(b.position);it.w.quaternion.copy(b.quaternion);
    if(it.W){var w=it.W;w.mode='idle';w.t=0;w.wait=1;w.p=null;w.p2=0;w.fired=false;w.gcd=5}
    if(K.sfx)K.sfx.spawn(it.idx)};
  // v7: lewati cutscene portal -> semua bola langsung muncul & mendarat (dipakai tombol Skip)
  api.skipSpawn=function(){if(!tgs.length)tgs=pick();api.started=true;var sf=K.sfx;K.sfx=null;
    items.forEach(function(it){if(!it.spawned)spawn(it);var b=it.body;b.position.y=3;b.velocity.set(0,-6,0);it.w.position.copy(b.position)});K.sfx=sf};
  function watch(dt){items.forEach(function(it){if(!it.spawned||!it.settled||it.dragging||it.nolock)return;var s=lostState(it);
    if(s===0){it.lost=0;return}
    it.lost=(it.lost||0)+(s===2?99:dt);if(it.lost>LOST_AFTER)api.respawn(it)})}
  var ease=function(x){x=Math.min(1,Math.max(0,x));return x*x*(3-2*x)};
  api.step=function(dt){api.time+=dt;
    if(api.started)items.forEach(function(it){if(!it.spawned&&api.time>=api.t0+it.idx*api.gap)spawn(it)});
    acc=Math.min(acc+dt,FIX*5);while(acc>=FIX){if(api.beforeStep)api.beforeStep();W.step(FIX);lock();acc-=FIX}
    if(K.drag&&K.drag.enabled&&!K.noRespawn)watch(dt);   // v6: pantau bola yang hilang (aktif setelah cutscene pembuka)
    items.forEach(function(it){if(!it.spawned)return;var b=it.body,T=it.tilt;it.age+=dt;
      if(b.sleepState!==CANNON.Body.SLEEPING){it.w.position.copy(b.position);it.w.quaternion.copy(b.quaternion)}
      it.w.scale.setScalar(.2+.8*ease(it.age/.5));   // membesar saat keluar dari portal
      if(!it.settled){T.rotation.set(Math.sin(it.age*2.6+it.ph)*.3,it.spin*it.age,Math.cos(it.age*2.1+it.ph)*.26)}   // berputar pelan saat melayang
      else{it.relT+=dt;var k=Math.max(0,1-it.relT/.6);k=k*k*(3-2*k);
        var tx=0,tz=0;if(it.dragging){tz=-Math.max(-.35,Math.min(.35,b.velocity.x*.03));tx=Math.max(-.3,Math.min(.3,b.velocity.z*.03))}   // miring searah gerakan saat diseret
        var f=Math.min(1,dt*10);it.lx+=(tx-it.lx)*f;it.lz+=(tz-it.lz)*f;
        T.rotation.set(it.rx*k+it.lx+it.ax,it.ry*k+it.ay,it.rz*k+it.lz+it.az);T.scale.set(it.sx,it.sy,it.sx);it.m.position.y=it.my0+it.hy}})};
  setArena(12);return api};
})();
