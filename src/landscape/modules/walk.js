// ===========================================================================================================
// v13: perbaikan arah putar (angd asli = b-a, kode baru salah mengira a-b -> bola berputar liar & kart menjauhi jalur/mundur). Versi lama: walk_v12_old.js
// v12: Y = arah tubuh bola permanen; X/Z ikut saat diseret; selesai edit -> berguling lalu lompat berdiri (recover). Versi lama: walk_v11_old.js
// v11: putar-klik-cepat DIHAPUS; diganti mode Edit Bola (tombol kiri bawah, ball-edit.js). Versi lama: walk_v10_old.js
// v10: kart dibuat di dunia (bukan di dalam model) & jalur elips tetap di lantai rata; klik cepat = putar XYZ. Versi lama: walk_v9_old.js
// v9: bubble ucapan aktif lagi; jalur kart di lantai rata; bola tidak memilih tempat di belakang bukit (K.vis). Versi lama: walk_v8_old.js
// v8: semua easter egg tahan 6 dtk; Buku = membuat mobil kart & berkeliling dunia; Makanan = pusaran angin menyedot makanan; tanpa teks penjelas. Versi lama: walk_v7_old.js
// v6: easter egg diganti dari klik cepat menjadi TAHAN bola X detik tanpa menggeser kursor (hitungan ada di drag.js, lama tahan di K.holdNeed). Versi lama: walk_old.js
// LADANG LANGIT — bola berjalan, saling menyapa, dan easter egg tahan-lama.
//  - Tiap bola yang sudah mendarat berkeliling di lembah (menghindari bukit lewat K.walkOK).
//  - Dua bola yang bertemu berhenti, saling menghadap, tos sundulan + gelembung emoji + percikan bintang,
//    lalu tiap jenis bola menutup dengan gaya sapaannya sendiri.
//  - TAHAN tanpa menggeser kursor: Olahraga 5 dtk = lari kencang · Orang Sekitar 10 dtk = teriak + shockwave ·
//    Malaikat 15 dtk = terbang + lightbeam + langit putih · Jam weker 20 dtk = jam dinding raksasa + waktu melambat ·
//    Tidur 25 dtk = cutscene 10 dtk: semua bola terbang & landscape berubah jadi awan, lalu kembali normal.
// ===========================================================================================================
(function(){var K=window.KAIH,X=K.ctx,scene=X.scene,cam=X.cam,phys=X.phys,items=phys.items,home=K.camHome;
var TAU=Math.PI*2,PI=Math.PI,rnd=Math.random,YA=new THREE.Vector3(0,1,0);
var clamp=function(x,a,b){return Math.max(a,Math.min(b,x))},sm=function(x){x=clamp(x,0,1);return x*x*(3-2*x)},pulse=function(x){return Math.sin(clamp(x,0,1)*PI)};
var angd=function(a,b){var d=(b-a)%TAU;if(d>PI)d-=TAU;if(d<-PI)d+=TAU;return d};
var ZMIN=-47,ZMAX=-10;
K.timeScale=1;
function hw(z){var asp=innerWidth/innerHeight,hf=2*Math.atan(Math.tan(cam.fov*Math.PI/360)*asp);return Math.min(40,Math.tan(hf/2)*(8-z)*.8)}
function pathOK(x0,z0,x1,z1){for(var i=1;i<=8;i++){var u=i/8;if(!K.walkOK(x0+(x1-x0)*u,z0+(z1-z0)*u))return false}return true}
function pickTarget(it,far){var b=it.body.position;for(var n=0;n<40;n++){var z=ZMIN+rnd()*(ZMAX-ZMIN),w=hw(z),x=(rnd()*2-1)*w;
  if(Math.hypot(x-b.x,z-b.z)<(far?14:6))continue;if(K.walkOK(x,z)&&K.vis(x,z)&&pathOK(b.x,b.z,x,z))return[x,z]}return null}   // v9: K.vis = tidak di belakang bukit

// ---------- partikel, cincin, sprite ----------
var PART=[],i;for(i=0;i<60;i++){var pm=new THREE.Mesh(new THREE.OctahedronGeometry(.16,0),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));pm.visible=false;scene.add(pm);PART.push({m:pm,l:0,d:1,v:new THREE.Vector3(),g:0})}
function burst(x,y,z,col,n,sp,up,life,g){for(var k=0,c=0;k<PART.length&&c<n;k++){var p=PART[k];if(p.l>0)continue;c++;p.l=p.d=(life||.9)*(.7+rnd()*.6);p.g=g==null?6:g;
  var a=rnd()*TAU,s=sp*(.4+rnd()*.8);p.v.set(Math.cos(a)*s,up*(.3+rnd()),Math.sin(a)*s);p.m.position.set(x,y,z);p.m.material.color.set(col);p.m.visible=true;p.m.scale.setScalar(.6+rnd()*.9)}}
var RINGS=[];
function shock(x,z,col,maxR,dur,delay){var m=new THREE.Mesh(new THREE.RingGeometry(.9,1,56),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
  m.rotation.x=-PI/2;m.position.set(x,.35,z);m.visible=false;scene.add(m);RINGS.push({m:m,t:-(delay||0),dur:dur,R:maxR})}
var TEX={};
function bubble(text,fg,bg){var key=text+fg+bg;if(TEX[key])return TEX[key];var c=document.createElement('canvas');c.width=256;c.height=160;var x=c.getContext('2d');
  x.fillStyle=bg||'#ffffff';x.strokeStyle=fg||'#7a5ac8';x.lineWidth=7;x.beginPath();x.moveTo(44,8);x.lineTo(212,8);x.quadraticCurveTo(246,8,246,42);x.lineTo(246,86);x.quadraticCurveTo(246,120,212,120);
  x.lineTo(150,120);x.lineTo(128,152);x.lineTo(108,120);x.lineTo(44,120);x.quadraticCurveTo(10,120,10,86);x.lineTo(10,42);x.quadraticCurveTo(10,8,44,8);x.closePath();x.fill();x.stroke();
  x.fillStyle=fg||'#7a5ac8';x.textAlign='center';x.textBaseline='middle';var big=text.length>3;x.font=(big?'bold 52px':'66px')+' "Genshin","Plus Jakarta Sans",system-ui,"Apple Color Emoji","Segoe UI Emoji",sans-serif';x.fillText(text,128,66);
  var t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;TEX[key]=t;return t}
var SPR=[];
function say(x,y,z,text,life,size,fg,bg,follow){   // v9: bubble ucapan di atas bola AKTIF lagi (hanya banner teks cutscene yang dimatikan)
  var m=new THREE.SpriteMaterial({map:bubble(text,fg,bg),transparent:true,depthTest:false,depthWrite:false});var s=new THREE.Sprite(m);s.renderOrder=40;s.position.set(x,y,z);s.scale.set(.01,.01,1);scene.add(s);
  SPR.push({s:s,t:0,life:life,size:size||3.4,follow:follow})}

// ---------- kamera goyang ----------
var shake={t:0,d:0,a:0};
function shakeCam(a,d){shake.t=0;shake.d=d;shake.a=a;shake.base=cam.position.clone()}

// ---------- langit putih (malaikat) ----------
var whiteDome=new THREE.Mesh(new THREE.SphereGeometry(972,24,12),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,side:THREE.BackSide,depthWrite:false,fog:false}));
whiteDome.renderOrder=-7;whiteDome.frustumCulled=false;whiteDome.visible=false;scene.add(whiteDome);
// ---------- lightbeam ----------
var beam=new THREE.Group(),bOut=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.2,260,20,1,true),new THREE.MeshBasicMaterial({color:0xfff2b8,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
var bIn=new THREE.Mesh(new THREE.CylinderGeometry(.9,.9,260,16,1,true),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
bOut.position.y=130;bIn.position.y=130;bOut.renderOrder=22;bIn.renderOrder=23;beam.add(bOut,bIn);beam.visible=false;scene.add(beam);
var gl=new THREE.Sprite(new THREE.SpriteMaterial({map:(function(){var c=document.createElement('canvas');c.width=c.height=128;var x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,236,170,.55)');g.addColorStop(1,'rgba(255,220,120,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)})(),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0}));
gl.renderOrder=24;gl.visible=false;scene.add(gl);

// ---------- jam dinding raksasa (overlay) ----------
var gc=null;
function buildClock(){if(gc)return gc;var st=document.createElement('style');
  st.textContent='#kx-gclock{position:fixed;left:50%;top:50%;width:min(88vmin,680px);height:min(88vmin,680px);margin:calc(min(88vmin,680px)/-2) 0 0 calc(min(88vmin,680px)/-2);z-index:9000;pointer-events:none;opacity:0;transform:scale(.55) rotate(-8deg);transition:opacity .7s ease,transform .9s cubic-bezier(.2,1.2,.3,1);filter:drop-shadow(0 0 40px rgba(255,214,120,.55))}'+
  '#kx-gclock.on{opacity:.92;transform:scale(1) rotate(0)}#kx-gclock svg{width:100%;height:100%;overflow:visible}#kx-gveil{position:fixed;inset:0;z-index:8999;pointer-events:none;opacity:0;transition:opacity .6s;background:radial-gradient(ellipse at 50% 50%,rgba(60,40,110,0) 35%,rgba(30,18,70,.55) 100%)}#kx-gveil.on{opacity:1}';
  document.head.appendChild(st);
  var d=document.createElement('div');d.id='kx-gclock';var s='<svg viewBox="-110 -110 220 220"><defs><radialGradient id="kxf" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#f1e2b8"/></radialGradient></defs>'+
   '<circle r="104" fill="#c99a3b"/><circle r="99" fill="#ffe08a"/><circle r="92" fill="url(#kxf)"/><circle r="92" fill="none" stroke="#8a5a1e" stroke-width="1.2"/>';
  for(var k=0;k<60;k++){var a=k/60*TAU,big=k%5===0,r1=big?78:84,r2=88;s+='<line x1="'+(Math.sin(a)*r1).toFixed(2)+'" y1="'+(-Math.cos(a)*r1).toFixed(2)+'" x2="'+(Math.sin(a)*r2).toFixed(2)+'" y2="'+(-Math.cos(a)*r2).toFixed(2)+'" stroke="#2b2b2b" stroke-width="'+(big?2.4:1)+'" stroke-linecap="round"/>'}
  for(k=1;k<=12;k++){var b=k/12*TAU;s+='<text x="'+(Math.sin(b)*66).toFixed(2)+'" y="'+(-Math.cos(b)*66+5).toFixed(2)+'" font-family="Georgia,serif" font-weight="700" font-size="16" text-anchor="middle" fill="#2b2b2b">'+k+'</text>'}
  s+='<g id="kx-h"><rect x="-2.6" y="-46" width="5.2" height="52" rx="2.6" fill="#1c1c1c"/></g><g id="kx-m"><rect x="-1.9" y="-70" width="3.8" height="78" rx="1.9" fill="#1c1c1c"/></g>'+
   '<g id="kx-s"><rect x="-.8" y="-80" width="1.6" height="96" rx=".8" fill="#e0527a"/><circle cy="-22" r="3.4" fill="#e0527a"/></g><circle r="5" fill="#d9a940" stroke="#1c1c1c" stroke-width="1.2"/></svg>';
  d.innerHTML=s;var v=document.createElement('div');v.id='kx-gveil';document.body.appendChild(v);document.body.appendChild(d);gc={el:d,veil:v,h:d.querySelector('#kx-h'),m:d.querySelector('#kx-m'),s:d.querySelector('#kx-s')};return gc}

// ---------- status tiap bola ----------
var EMO={treadmill:'💪',bed:'😴',angel:'✨',food:'🍎',book:'📖',people:'👋',clock:'⏰'};
var NEED=K.holdNeed={treadmill:6,people:6,angel:6,clock:6,bed:6,book:6,food:6};   // v8: semua easter egg = tahan 6 detik   // detik TAHAN tanpa gerak (dibaca drag.js)
var ids=0;
function W(it){if(it.W)return it.W;var q=it.body.quaternion;return it.W=(function(){return{mode:'idle',t:0,wait:1+rnd()*3,tx:0,tz:0,sp:1.7+rnd()*1.0,ph:rnd()*6,yaw:2*Math.atan2(q.y,q.w),vv:{hy:0,ax:0,az:0,ay:0,sx:1,sy:1},gcd:4+rnd()*6,clicks:0,last:0,p:null,gt:0,fired:false,id:++ids,dust:0}})()}
function ready(it){return it.spawned&&it.settled&&it.age>3}
function setYaw(it,w,yaw){w.yaw=yaw;it.body.quaternion.setFromAxisAngle(YA,yaw);it.body.aabbNeedsUpdate=true}
function halt(it,dt){var b=it.body,f=Math.max(0,1-dt*9);b.velocity.x*=f;b.velocity.z*=f}
// jalan menuju (tx,tz). return true bila sampai.
function go(it,w,tx,tz,sp,dt,turn){var b=it.body,dx=tx-b.position.x,dz=tz-b.position.z,d=Math.hypot(dx,dz);if(d<.7){halt(it,dt);return true}
  var ux=dx/d,uz=dz/d,f=Math.min(1,dt*5);
  if(!K.walkOK(b.position.x+ux*.8,b.position.z+uz*.8)&&sp<8){return 'blocked'}   // v6: lihat ke depan 0.8 (dulu 1.8) -> bola berhenti dekat tepi bukit, bukan jauh sebelumnya
  b.velocity.x+=(ux*sp-b.velocity.x)*f;b.velocity.z+=(uz*sp-b.velocity.z)*f;
  setYaw(it,w,w.yaw+angd(w.yaw,Math.atan2(dx,dz))*Math.min(1,dt*(turn||7)));return false}
function gait(w,sp,dt,run){var v=w.vv,am=clamp(sp/2.4,0,1.6);w.ph+=dt*(2.4+sp*(run?1.5:1.1));var a=Math.abs(Math.sin(w.ph));
  v.hy+=a*(run?.34:.2)*am;v.ax+=(run?.34:.1)*am;v.az+=Math.sin(w.ph)*.09*am;v.sy*=1-.05*(1-a)*am;v.sx*=1+.03*(1-a)*am}
function endMode(it,w,wait){w.mode='idle';w.t=0;w.wait=wait==null?1+rnd()*3:wait;w.p=null}

// ---------- gaya sapaan unik tiap bola ----------
function flourish(type,v,g,w){var t=g;
  if(type==='treadmill'){v.hy+=Math.abs(Math.sin(t*11))*.4;v.ax+=.14;}                                         // jogging di tempat
  else if(type==='bed'){v.ax+=Math.sin(t*3)*.3*pulse(t/1.8);v.az+=Math.sin(t*1.6)*.1;}                        // membungkuk ngantuk
  else if(type==='angel'){v.ay+=TAU*sm(t/1.6);v.hy+=pulse(t/1.6)*.9;}                                          // berputar melayang
  else if(type==='food'){v.sy*=1+Math.sin(t*14)*.1;v.sx*=1-Math.sin(t*14)*.06;v.hy+=Math.abs(Math.sin(t*6))*.16;}  // kunyah-bounce
  else if(type==='book'){v.ax+=Math.sin(t*5)*.2;v.hy+=Math.max(0,Math.sin(t*5))*.08;}                          // mengangguk-angguk
  else if(type==='people'){v.az+=Math.sin(t*9)*.22;v.ay+=TAU*2*sm(t/1.6);}                                     // melambai sambil muter
  else if(type==='clock'){v.az+=(Math.floor(t*6)%2?1:-1)*.16;v.hy+=Math.abs(Math.sin(t*12))*.06;}}               // tik-tok
function greetStep(it,w,dt){var p=w.p,pw=p&&p.W;
  if(!p||!pw||pw.mode!=='greet'||pw.p!==it||it.dragging||p.dragging){endMode(it,w,1);w.gcd=8;return}
  var b=it.body.position,pb=p.body.position,dx=pb.x-b.x,dz=pb.z-b.z,d=Math.hypot(dx,dz),v=w.vv;w.t+=dt;
  var face=Math.atan2(dx,dz);setYaw(it,w,w.yaw+angd(w.yaw,face)*Math.min(1,dt*9));
  if(w.gt===0&&d>3.5&&w.t<2.6){var r=go(it,w,b.x+dx*.5,b.z+dz*.5,2.2,dt,9);if(r==='blocked')halt(it,dt);gait(w,2.2,dt);return}
  halt(it,dt);w.gt+=dt;var g=w.gt;
  // tos sundulan: condong ke lawan dua kali + loncat berselang-seling
  if(g<.9){var s=pulse((g%.45)/.45);v.ax+=.34*s;v.hy+=.35*s*(it.W.id%2?1:.6)}
  if(g>=.55&&!w.fired){w.fired=true;say(b.x,b.y+4.4,b.z,EMO[it.type]||'👋',2.6,3.2,'#7a5ac8','#ffffff',it);
    if(it.W.id<pw.id){burst((b.x+pb.x)/2,b.y+1.6,(b.z+pb.z)/2,0xffe08a,16,5,5,.9);shock((b.x+pb.x)/2,(b.z+pb.z)/2,0xfff1b0,3.6,.9);if(K.sfx&&K.sfx.pop)K.sfx.pop()}}
  if(g>=.9)flourish(it.type,v,g-.9,w);
  if(g>2.7){endMode(it,w,1.5+rnd()*2);w.gcd=16+rnd()*8}}

// ---------- easter egg ----------
function egg(it){var w=W(it);
  if(it.type==='treadmill'){w.mode='run';w.t=0;w.dur=5.2;w.tg=null;say(it.body.position.x,it.body.position.y+4.2,it.body.position.z,'💨',1.6,3.2,'#e94f7a','#ffffff',it)}
  else if(it.type==='people'){w.mode='shout';w.t=0;w.fired=false}
  else if(it.type==='angel'){w.mode='beacon';w.t=0;w.fired=false}
  else if(it.type==='clock'){w.mode='timewarp';w.t=0;w.fired=false}
  else if(it.type==='bed'){sleepEgg(it)}
  else if(it.type==='book'){bookEgg(it)}
  else if(it.type==='food'){foodEgg(it)}}
var beaconOwner=null,clockOn=false;
function runStep(it,w,dt){var v=w.vv,b=it.body;w.t+=dt;
  if(w.t<w.dur){if(!w.tg){w.tg=pickTarget(it,true)}else{var gr=go(it,w,w.tg[0],w.tg[1],11.5,dt,12);if(gr===true||gr==='blocked')w.tg=pickTarget(it,true)}
    gait(w,11,dt,true);v.ax+=.12;w.dust-=dt;if(w.dust<=0){w.dust=.07;burst(b.position.x,.3,b.position.z,0xffffff,3,2.2,1.6,.6,-1)}}
  else if(w.t<w.dur+2.2){halt(it,dt);var u=w.t-w.dur;v.sy*=1+Math.sin(u*16)*.05*(1-u/2.2);v.sx*=1-Math.sin(u*16)*.03;v.ax+=-.12*(1-u/2.2);if(!w.p2){w.p2=1;say(b.position.x,b.position.y+4.2,b.position.z,'😮‍💨',1.8,3.2,'#7a5ac8','#ffffff',it)}}
  else{w.p2=0;endMode(it,w,1)}}
function shoutStep(it,w,dt){var v=w.vv,b=it.body,p=b.position;w.t+=dt;
  halt(it,dt);
  if(w.t<1.1){var u=w.t/1.1;v.sx*=1+.4*sm(u);v.sy*=1+.45*sm(u);v.az+=Math.sin(w.t*60)*.09*u;v.hy+=sm(u)*.4}
  else{var u2=w.t-1.1;if(!w.fired){w.fired=true;
      say(p.x,p.y+5,p.z,'AAAAAA!!',2.2,5.2,'#e0224a','#fff7cf',it);
      shock(p.x,p.z,0xffffff,30,1.5,0);shock(p.x,p.z,0xffd1e0,30,1.7,.15);shock(p.x,p.z,0xa0e8ff,30,1.9,.3);burst(p.x,1.5,p.z,0xffffff,28,14,5,1.1);shakeCam(.55,.8);
      if(K.sfx){if(K.sfx.impact)K.sfx.impact(9,14,'people');if(K.sfx.boom)try{K.sfx.boom()}catch(e){}}
      items.forEach(function(o){if(o===it||!o.spawned||!o.settled)return;var q=o.body.position,dx=q.x-p.x,dz=q.z-p.z,d=Math.max(1,Math.hypot(dx,dz)),f=Math.max(0,1-d/30);if(f<=0)return;
        var ow=W(o);o.body.wakeUp();o.body.velocity.x+=dx/d*28*f;o.body.velocity.z+=dz/d*28*f;ow.mode='stun';ow.t=0;ow.stun=.9+f*.9;ow.p=null})}
    v.sx*=1+.4*(1-sm(u2/.7));v.sy*=1+.45*(1-sm(u2/.7));v.hy+=pulse(u2/.6)*.5;
    if(u2>1.2)endMode(it,w,1)}}
function stunStep(it,w,dt){w.t+=dt;var v=w.vv;halt(it,dt*.4);v.ay+=w.t*9;v.az+=Math.sin(w.t*30)*.12*Math.max(0,1-w.t/w.stun);v.hy+=pulse(w.t/.5)*.4*(w.t<.5?1:0);if(w.t>w.stun)endMode(it,w,.8+rnd())}
function beaconStep(it,w,dt){var v=w.vv,b=it.body,p=b.position,T=10,t;w.t+=dt;t=w.t;halt(it,dt);
  if(!w.fired){w.fired=true;beaconOwner=it;beam.visible=true;gl.visible=true;whiteDome.visible=true;if(K.sfx&&K.sfx.spawn)K.sfx.spawn(5)}
  var up=t<1.8?sm(t/1.8):t<8?1:1-sm((t-8)/1.8);          // naik / tahan / turun
  v.hy+=up*10.5;v.ay+=(t<1.8?TAU*2*sm(t/1.8):0)+Math.sin(t*1.2)*.15*up;v.ax+=Math.sin(t*2)*.05*up;
  beam.position.set(p.x,0,p.z);gl.position.set(p.x,p.y+v.hy+1.3,p.z);gl.scale.setScalar(9+Math.sin(t*6)*1.2);
  var bi=t<1.5?0:t<2.4?sm((t-1.5)/.9):t<8.2?1:Math.max(0,1-(t-8.2)/1.4),pulseB=1+Math.sin(t*9)*.05;
  bOut.material.opacity=.5*bi;bIn.material.opacity=.85*bi;beam.scale.set(pulseB*(.3+.7*sm(t/2.4)),1,pulseB*(.3+.7*sm(t/2.4)));gl.material.opacity=Math.min(1,up*1.2)*(t>9?Math.max(0,1-(t-9)/1):1);
  var wd=t<1.7?0:t<3.1?sm((t-1.7)/1.4):t<7.2?1:Math.max(0,1-sm((t-7.2)/2.4));whiteDome.material.opacity=wd;
  if(bi>.2&&rnd()<.5)burst(p.x+(rnd()-.5)*3,.4,p.z+(rnd()-.5)*3,0xfff2b8,1,.6,9,1.4,-1);
  if(t>2.2&&t<2.35&&!w.p2){w.p2=1;shock(p.x,p.z,0xfff1b0,14,1.6,0);shock(p.x,p.z,0xffffff,14,1.9,.2);shakeCam(.18,.5)}
  if(t>T){beaconOwner=null;beam.visible=false;gl.visible=false;whiteDome.visible=false;whiteDome.material.opacity=0;w.p2=0;endMode(it,w,1);burst(p.x,1,p.z,0xfff2b8,14,5,4,.9);}}
var twT=0;
function timewarpStep(it,w,dt,R){var v=w.vv,b=it.body,t;w.t+=R;t=w.t;halt(it,dt);
  var c=buildClock();
  if(!w.fired){w.fired=true;clockOn=true;c.el.classList.add('on');c.veil.classList.add('on');if(K.sfx&&K.sfx.pop)K.sfx.pop();shock(b.position.x,b.position.z,0xffe08a,16,1.4,0)}
  var D=6.2,sl=t<.6?sm(t/.6):t<D-1?1:1-sm((t-(D-1))/1);K.timeScale=1-.82*sl;
  v.az+=(Math.floor(t*5)%2?1:-1)*.1*sl;v.hy+=pulse((t%1)/1)*.12*sl;
  // jarum jam raksasa: menit berputar 1 putaran penuh, jam 1/12, detik ngebut lalu melambat
  c.m.setAttribute('transform','rotate('+(t/D*360).toFixed(2)+')');c.h.setAttribute('transform','rotate('+(t/D*30+300).toFixed(2)+')');
  c.s.setAttribute('transform','rotate('+(((t*t*40)%360)).toFixed(2)+')');
  if(t>D-.9&&c.el.classList.contains('on')){c.el.classList.remove('on');c.veil.classList.remove('on')}
  if(t>D){K.timeScale=1;clockOn=false;endMode(it,w,1)}}


// ---------- v6: EASTER EGG TIDUR (tahan 25 dtk) — semua bola terbang 10 dtk, landscape berubah jadi awan, lalu normal lagi ----------
// Garis waktu (detik): 0 bola tidur menguap + 💤 · 0.6-3.4 awan meluas dari bola tidur (cloud-dream.js) · 0.5-1.5 bola lain mulai naik satu per satu
// · 2-7 melayang berputar di langit · 7.2-9.9 awan menyusut ke titik asal & bola turun pelan · 10 selesai.
var SL={on:false,t:0,D:10,owner:null,cap:null,fired:{}},RMAX=380;
function buildCap(){if(SL.cap)return SL.cap;var st=document.createElement('style');
  st.textContent='#kx-dream{position:fixed;left:50%;top:max(18px,env(safe-area-inset-top));transform:translate(-50%,-14px);z-index:9000;pointer-events:none;opacity:0;padding:10px 20px;border-radius:999px;white-space:nowrap;max-width:92vw;overflow:hidden;text-overflow:ellipsis;font:700 15px ui-rounded,"SF Pro Rounded","Nunito",system-ui,sans-serif;color:#fff;text-shadow:0 1px 8px rgba(80,60,160,.6);background:rgba(120,110,210,.34);border:1px solid rgba(255,255,255,.5);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);transition:opacity .8s ease,transform .8s ease}#kx-dream.on{opacity:1;transform:translate(-50%,0)}'+
  '#kx-dveil{position:fixed;inset:0;z-index:8998;pointer-events:none;opacity:0;transition:opacity 1.2s;background:radial-gradient(ellipse at 50% 55%,rgba(255,255,255,0) 40%,rgba(190,170,255,.32) 100%)}#kx-dveil.on{opacity:1}';
  document.head.appendChild(st);var d=document.createElement('div');d.id='kx-dream';d.textContent='💤 Mimpi indah… semua bola ikut melayang ☁️';var v=document.createElement('div');v.id='kx-dveil';document.body.appendChild(v);document.body.appendChild(d);return SL.cap={el:d,veil:v}}
function abortSpecials(){   // batalkan efek spesial lain yang sedang berjalan supaya tidak bertabrakan dengan cutscene
  if(beaconOwner){beaconOwner=null;beam.visible=false;gl.visible=false;whiteDome.visible=false;whiteDome.material.opacity=0}
  if(clockOn){K.timeScale=1;clockOn=false;if(gc){gc.el.classList.remove('on');gc.veil.classList.remove('on')}}}
function sleepEgg(it){if(SL.on)return;abortSpecials();
  SL.on=true;SL.t=0;SL.owner=it;SL.fired={};K.sleepOn=true;K.noRespawn=true;
  if(K.drag){if(K.drag.cancel)K.drag.cancel();K.drag.enabled=false}
  items.forEach(function(o){if(!ready(o))return;var w=W(o);w.mode='fly';w.t=0;w.p=null;w.p2=0;
    w.fl={d:o===it?.15:.5+rnd()*1.0,alt:6+rnd()*6,ph:rnd()*TAU,sp:.8+rnd()*.7,ds:rnd()<.5?-1:1,pf:0}});
  var c=buildCap(),p=it.body.position;c.veil.classList.add('on');
  say(p.x,p.y+4.4,p.z,'💤',2.4,3.4,'#7a5ac8','#ffffff',it);shock(p.x,p.z,0xcfc2ff,16,1.6,0);shock(p.x,p.z,0xffffff,16,1.9,.25);if(K.sfx&&K.sfx.pop)K.sfx.pop()}
function sleepEnd(){var p=SL.owner&&SL.owner.body.position;SL.on=false;K.sleepOn=false;K.noRespawn=false;
  if(K.cloudDream)K.cloudDream.set(0,0,0);if(K.camFX)K.camFX.set(0,0,0);if(K.drag)K.drag.enabled=true;
  if(SL.cap){SL.cap.el.classList.remove('on');SL.cap.veil.classList.remove('on')}
  items.forEach(function(o){var w=o.W;if(w&&w.mode==='fly'){endMode(o,w,1+rnd()*2);w.gcd=6+rnd()*4}});
  if(p){burst(p.x,1.2,p.z,0xffffff,14,5,4,.9);if(K.sfx&&K.sfx.pop)K.sfx.pop()}SL.owner=null}
// dipanggil sekali per frame dari loop utama
function sleepTick(R){if(!SL.on)return;SL.t+=R;var t=SL.t,D=SL.D;
  var r=t<.6?0:t<3.4?RMAX*sm((t-.6)/2.8):t<7.2?RMAX:t<9.9?RMAX*(1-sm((t-7.2)/2.7)):0,p=SL.owner.body.position;
  if(K.cloudDream)K.cloudDream.set(p.x,p.z,r);
  if(K.camFX){var cp=pulse(t/D);K.camFX.set(0,2.2*cp,2.4*cp)}   // kamera naik & mundur sedikit mengikuti cutscene
  if(t>3.3&&!SL.fired.a){SL.fired.a=1;say(p.x,p.y+4.4,p.z,'☁️✨',2.6,3.4,'#7a5ac8','#ffffff',SL.owner)}
  if(t>8.6&&SL.cap)SL.cap.el.classList.remove('on');
  if(t>=D)sleepEnd()}
function flyStep(it,w,dt){var v=w.vv,b=it.body,f=w.fl,T=SL.t,D=SL.D;if(!f){endMode(it,w,1);return}
  var up=sm((T-f.d)/1.9),dn=sm((T-(D-2.3))/2.1),L=up*(1-dn),p=b.position;
  v.hy+=f.alt*L+Math.sin(T*f.sp*2.2+f.ph)*.7*L;
  v.ay+=f.ds*(L*TAU*2+Math.sin(T*1.3+f.ph)*.35*L);
  v.az+=Math.sin(T*2.1*f.sp+f.ph)*.22*L;v.ax+=Math.sin(T*1.7+f.ph)*.12*L-.08*L;
  var tk=T-f.d;if(tk>0&&tk<.5){v.sy*=1+.22*pulse(tk/.5);v.sx*=1-.1*pulse(tk/.5)}   // pegas sebelum lepas landas
  var k=Math.min(1,dt*2),vx=Math.cos(T*.8*f.sp+f.ph)*1.6*L,vz=Math.sin(T*.7*f.sp+f.ph)*1.1*L;   // melayang pelan memutar
  b.velocity.x+=(vx-b.velocity.x)*k;b.velocity.z+=(vz-b.velocity.z)*k;
  f.pf-=dt;if(L>.05&&f.pf<=0){f.pf=.14+rnd()*.12;burst(p.x+(rnd()-.5)*2,p.y+v.hy*.8,p.z+(rnd()-.5)*2,0xffffff,1,.6,.7,1.1,-.6)}}   // percikan awan kecil

// ---------- v7: EASTER EGG BUKU (tahan 15 dtk) & MAKANAN (tahan 25 dtk) ----------
// v13: JANGAN pakai angd() untuk kode baru: angd asli (baris 14) = (b-a), tertimpa definisi lama. adiff(target,current) = target-current (dinormalkan)
function adiff(t,c){var d=(t-c)%TAU;if(d>PI)d-=TAU;if(d<-PI)d+=TAU;return d}
function mkMesh(g,col,em){return new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:col,emissive:em||0x000000}))}
function toast(){}   // v8: banner teks dimatikan
var FRG=[],PGS=[],pgTex=null;

// ===== BUKU (v8): baca ngebut -> kertas meledak -> bola MENCIPTAKAN MOBIL KART -> berkeliling dunia (naik-turun bukit) -> kembali ke posisi baca =====
var BKT={exp:3.2,b0:3.5,go:5.5,d0:5.7,d1:15.7,poof:16.3,end:17.6};
function pageTex(){if(pgTex)return pgTex;var c=document.createElement('canvas');c.width=64;c.height=80;var g=c.getContext('2d');g.fillStyle='#fff8e4';g.fillRect(0,0,64,80);
  g.strokeStyle='rgba(120,90,60,.45)';g.lineWidth=2;for(var y=14;y<70;y+=8){g.beginPath();g.moveTo(9,y);g.lineTo(56-(y%3)*8,y);g.stroke()}
  g.strokeStyle='rgba(200,110,110,.5)';g.beginPath();g.moveTo(6,0);g.lineTo(6,80);g.stroke();return pgTex=new THREE.CanvasTexture(c)}
function spawnPages(x,y,z,n){for(var i=0;i<n;i++){var m=new THREE.Mesh(new THREE.PlaneGeometry(1.1,1.4),new THREE.MeshBasicMaterial({map:pageTex(),side:THREE.DoubleSide,transparent:true}));
  m.position.set(x,y,z);m.rotation.set(rnd()*TAU,rnd()*TAU,rnd()*TAU);scene.add(m);var a=rnd()*TAU,sp=5+rnd()*7;
  PGS.push({m:m,v:new THREE.Vector3(Math.cos(a)*sp,6+rnd()*8,Math.sin(a)*sp*.7),w:new THREE.Vector3((rnd()-.5)*9,(rnd()-.5)*9,(rnd()-.5)*9),l:3.8+rnd()*1.6,t:0,ph:rnd()*TAU})}}
function pagesTick(R){for(var i=PGS.length-1;i>=0;i--){var p=PGS[i];p.t+=R;p.v.y-=7*R;p.v.x*=1-R*.8;p.v.z*=1-R*.8;if(p.v.y<-2.4)p.v.y=-2.4+(p.v.y+2.4)*.5;   // kertas melayang pelan
  p.m.position.addScaledVector(p.v,R);p.m.position.x+=Math.sin(p.t*3+p.ph)*.6*R;
  var gy=Math.max(0,K.H(p.m.position.x,p.m.position.z))+.05;if(p.m.position.y<gy){p.m.position.y=gy;p.v.set(0,0,0);p.w.multiplyScalar(.9)}
  p.m.rotation.x+=p.w.x*R;p.m.rotation.y+=p.w.y*R;p.m.rotation.z+=p.w.z*R;p.m.material.opacity=p.t>p.l-1?Math.max(0,p.l-p.t):1;
  if(p.t>=p.l){scene.remove(p.m);p.m.geometry.dispose();p.m.material.dispose();PGS.splice(i,1)}}
  for(i=FRG.length-1;i>=0;i--){var f=FRG[i];f.t+=R;f.v.y-=16*R;f.m.position.addScaledVector(f.v,R);var g2=Math.max(0,K.H(f.m.position.x,f.m.position.z))+.15;
    if(f.m.position.y<g2){f.m.position.y=g2;f.v.y*=-.35;f.v.x*=.7;f.v.z*=.7;f.w.multiplyScalar(.6)}
    f.m.rotation.x+=f.w.x*R;f.m.rotation.y+=f.w.y*R;f.m.rotation.z+=f.w.z*R;if(f.t>f.l-.6)f.m.scale.setScalar(Math.max(.001,(f.l-f.t)/.6));
    if(f.t>=f.l){scene.remove(f.m);f.m.geometry.dispose();f.m.material.dispose();FRG.splice(i,1)}}}
// mobil kart merah: sasis, hidung, kursi, sayap belakang, setir, 4 roda (berputar), knalpot. Tiap bagian muncul bergantian (userData.delay)
function makeKart(){var g=new THREE.Group(),ud=g.userData;ud.wh=[];ud.parts=[];ud.ex=[];
  function add(m,delay,x,y,z){m.position.set(x,y,z);m.userData.delay=delay;m.userData.base=m.position.clone();g.add(m);ud.parts.push(m);return m}
  var dark=0x3a3f52;
  add(mkMesh(new THREE.BoxGeometry(1.9,.35,3.1),0xe0364b),0,0,0,0);
  add(mkMesh(new THREE.BoxGeometry(.3,.37,3.12),0xffffff),.12,0,.01,0);
  add(mkMesh(new THREE.BoxGeometry(1.3,.3,1.0),0xc42a3e),.22,0,.05,1.75);
  add(mkMesh(new THREE.BoxGeometry(1.2,.55,.3),dark),.34,0,.42,-.95);
  add(mkMesh(new THREE.BoxGeometry(1.9,.1,.5),0xffd166),.46,0,.95,-1.75);
  add(mkMesh(new THREE.BoxGeometry(.1,.6,.1),dark),.46,-.6,.65,-1.7);add(mkMesh(new THREE.BoxGeometry(.1,.6,.1),dark),.46,.6,.65,-1.7);
  var sw=add(new THREE.Mesh(new THREE.TorusGeometry(.26,.045,6,16),new THREE.MeshLambertMaterial({color:0xffd166})),.58,0,.75,.45);sw.rotation.x=-.9;
  [[-1.05,1.2],[1.05,1.2],[-1.1,-1.2],[1.1,-1.2]].forEach(function(p,i){var h=new THREE.Group(),sp=new THREE.Group();
    var tire=mkMesh(new THREE.CylinderGeometry(.5,.5,.42,16),0x2a2d38);tire.rotation.z=PI/2;sp.add(tire);
    var hub=mkMesh(new THREE.CylinderGeometry(.26,.26,.46,10),0xffd166);hub.rotation.z=PI/2;sp.add(hub);var bolt=mkMesh(new THREE.BoxGeometry(.5,.08,.08),0xe0364b);sp.add(bolt);
    h.add(sp);h.userData.delay=.7+i*.14;h.position.set(p[0],-.05,p[1]);h.userData.base=h.position.clone();g.add(h);ud.parts.push(h);ud.wh.push(sp)});
  [-.5,.5].forEach(function(x){var e=add(mkMesh(new THREE.CylinderGeometry(.09,.12,.45,8),0xb9c2cf),.95,x,.1,-1.75);e.rotation.x=PI/2;var n=new THREE.Object3D();n.position.set(x,.1,-2.05);g.add(n);ud.ex.push(n)});
  return g}
function backOut(x){x=Math.min(1,Math.max(0,x));return 1+2.7*Math.pow(x-1,3)+1.7*Math.pow(x-1,2)}
function kartParts(kart,u){kart.userData.parts.forEach(function(p){var a=(u-p.userData.delay)/.4,s=a<=0?.001:backOut(a);p.scale.setScalar(Math.max(.001,s));p.position.copy(p.userData.base);p.position.y+=(1-Math.min(1,Math.max(0,a)))*5})}
function bookAbort(it,w){var k=w.bk;if(k){if(k.kart&&k.kart.parent)k.kart.parent.remove(k.kart);it.body.collisionFilterMask=k.mask}it.nolock=false;it.noGrab=false;K.eggBusy=false;w.bk=null}
function bookEgg(it){if(K.eggBusy||K.sleepOn)return;K.eggBusy=true;it.noGrab=true;var w=W(it);w.mode='bookegg';w.t=0;w.bk=null;w.p=null}
function flatR(x,z,r){var L=K.HILL_H;return K.H(x,z)<=L&&K.H(x+r,z)<=L&&K.H(x-r,z)<=L&&K.H(x,z+r)<=L&&K.H(x,z-r)<=L&&K.H(x+r*.7,z+r*.7)<=L&&K.H(x-r*.7,z-r*.7)<=L}
// v10: cari elips terbesar yang SELURUHNYA rata (jauh dari bukit), terlihat dari kamera & di dalam layar -> jalur kart tetap, mulus, tanpa lompatan
function findLoop(k){var hf=2*Math.atan(Math.tan(cam.fov*PI/360)*cam.aspect),th2=Math.tan(hf/2),best=null,bs=0,Czs=[-14,-18,-22,-26,-30],Rxs=[38,34,30,26,22,18,14,10],Rzs=[14,11,8,6];
  for(var a=0;a<Czs.length;a++)for(var b=0;b<Rxs.length;b++)for(var c=0;c<Rzs.length;c++){var Cz=Czs[a],Rx=Rxs[b],Rz=Rzs[c];if(Cz+Rz>-8||Cz-Rz<-50)continue;var sc=Rx+Rz*1.3;if(sc<=bs)continue;var ok=true;
    for(var i=0;i<40&&ok;i++){var an=i/40*TAU,x=Rx*Math.cos(an),z=Cz+Rz*Math.sin(an);if(Math.abs(x)>Math.min(40,th2*(8-z)*.82)||!flatR(x,z,2.6)||!K.vis(x,z))ok=false}
    if(ok){bs=sc;best={Cx:0,Cz:Cz,Rx:Rx,Rz:Rz}}}
  return best||{Cx:k.x0,Cz:k.z0,Rx:4,Rz:4}}
function bookStep(it,w,dt){var v=w.vv,b=it.body,T=w.t+=dt,k=w.bk,B=BKT;
  if(!k){var y0=2*Math.atan2(b.quaternion.y,b.quaternion.w);k=w.bk={x0:b.position.x,z0:b.position.z,y0:b.position.y,mask:b.collisionFilterMask,yaw0:y0,yaw:y0,cl:0,ex:false,kart:null,sy1:false,ep:false,drive:false,dir:rnd()<.5?-1:1,px:b.position.x,pz:b.position.z,fl:0,L:null,sp:0};it.nolock=true}
  b.velocity.x=b.velocity.z=0;var bp=b.position;
  if(!k.sy1){k.sy1=true;say(bp.x,bp.y+4.2,bp.z,'📖💨',2.4,3.4,'#2c5a8a','#ffffff',it)}
  // --- fase 1: baca ngebut (halaman dibalik cepat, bola mengangguk-angguk makin liar) lalu kertas meledak ---
  if(T<B.exp+.2){k.cl-=dt;if(k.cl<=0){k.cl=1;call(it,'onClick')}var pr=Math.min(1,T/B.exp);
    v.ax+=Math.sin(T*16)*.16*pr;v.hy+=Math.abs(Math.sin(T*8))*.2*pr;v.sx*=1+Math.sin(T*42)*.03*pr;v.sy*=1+Math.sin(T*42+1)*.03*pr;
    if(Math.random()<.35*pr)burst(bp.x+(rnd()-.5)*2,bp.y+2.6,bp.z+.8,0xfff3b0,1,2,3,.8,-1)}
  if(!k.ex&&T>=B.exp){k.ex=true;spawnPages(bp.x,bp.y+2.4,bp.z+.5,16);burst(bp.x,bp.y+2.4,bp.z,0xfff8e4,18,8,7,1,4);shock(bp.x,bp.z,0xffe49a,13,1.1,0);shakeCam(.3,.4);if(K.sfx&&K.sfx.pop)K.sfx.pop();say(bp.x,bp.y+4.2,bp.z,'💥',1.8,3.4,'#b5532b','#ffffff',it)}
  // --- fase 2: kart dirakit di DUNIA (bukan di dalam model bola) tepat di atas tanah; bola naik ke atas sasis ---
  if(T>=B.b0&&!k.kart){var kt=makeKart();kt.scale.setScalar(1.3);kt.userData.parts.forEach(function(p){p.scale.setScalar(.001)});kt.position.set(bp.x,.72,bp.z);kt.rotation.y=k.yaw;scene.add(kt);k.kart=kt;shock(bp.x,bp.z,0xff8a8a,10,1,0)}
  if(k.kart){kartParts(k.kart,T-B.b0);if(T<B.go&&Math.random()<.4)burst(bp.x+(rnd()-.5)*3,.3,bp.z+(rnd()-.5)*3,0xfff0b0,1,2,3,.7,-2)}
  var seat=sm((T-B.b0)/.6)*(T<B.poof?1:1-sm((T-B.poof)/.7));v.hy+=seat*.95;   // alas model bola menempel di permukaan atas sasis
  if(T>=B.go-.6&&T<B.d0){var q=(T-(B.go-.6))/.8;v.sx*=1+Math.sin(T*60)*.025*q;v.sy*=1-Math.sin(T*60)*.025*q;if(!k.ep&&T>=B.go){k.ep=true;say(bp.x,bp.y+4.2,bp.z,'🏎️',2.4,3.4,'#b5532b','#ffffff',it);shock(bp.x,bp.z,0xffd36b,12,.9,0);shakeCam(.2,.45);if(K.sfx&&K.sfx.pop)K.sfx.pop()}}
  // --- fase 3: berkeliling (10 dtk): masuk ke elips -> satu putaran penuh -> kembali ke posisi baca ---
  if(T>=B.d0&&T<B.d1+.05){var u=Math.min(1,(T-B.d0)/(B.d1-B.d0));
    if(!k.drive){k.drive=true;k.y0=bp.y;b.collisionFilterMask=0;k.L=findLoop(k);k.th0=Math.atan2((k.z0-k.L.Cz)/k.L.Rz,(k.x0-k.L.Cx)/k.L.Rx)}   // y istirahat bola diambil di sini (bukan saat dilepas dari tahanan)
    var L=k.L,nx,nz,E=function(th){return[L.Cx+L.Rx*Math.cos(th),L.Cz+L.Rz*Math.sin(th)]};
    if(u<.12){var q1=sm(u/.12),e0=E(k.th0);nx=k.x0+(e0[0]-k.x0)*q1;nz=k.z0+(e0[1]-k.z0)*q1}
    else if(u<.88){var e=E(k.th0+k.dir*TAU*((u-.12)/.76));nx=e[0];nz=e[1]}
    else{var q2=sm((u-.88)/.12),e1=E(k.th0+k.dir*TAU);nx=e1[0]+(k.x0-e1[0])*q2;nz=e1[1]+(k.z0-e1[1])*q2}
    var dx=nx-k.px,dz=nz-k.pz,ds=Math.sqrt(dx*dx+dz*dz);
    if(ds>1e-3){var da=adiff(Math.atan2(dx,dz),k.yaw),mt=7*dt;k.yaw+=Math.max(-mt,Math.min(mt,da))}   // belok dibatasi 7 rad/dtk supaya tidak berputar liar
    k.px=nx;k.pz=nz;bp.x=nx;bp.z=nz;
    if(k.kart){k.kart.userData.wh.forEach(function(s){s.rotation.x+=ds/.65})}
    k.fl-=dt;if(k.fl<=0&&k.kart){k.fl=.05;k.kart.userData.wh.forEach(function(s,i){if(i<2)return;var p=new THREE.Vector3();s.getWorldPosition(p);burst(p.x,.15,p.z,0xd9c9a0,1,1.4,1.6,.7,3)});
      k.kart.userData.ex.forEach(function(n){var p=new THREE.Vector3();n.getWorldPosition(p);if(Math.random()<.6)burst(p.x,p.y,p.z,0xcfd6e2,1,.8,1,.9,-1)})}}
  if(k.drive&&T<B.end){bp.y=k.y0;b.quaternion.setFromAxisAngle(YA,k.yaw)}
  // kart selalu menempel di tanah di bawah bola
  if(k.kart){var gy=Math.max(0,K.H(bp.x,bp.z));k.kart.position.set(bp.x,.72+gy+(k.drive&&T<B.d1?Math.sin(T*22)*.015:0),bp.z);k.kart.rotation.y=k.yaw+k.sp}
  // --- fase 4: kembali ke posisi baca, kart menghilang dengan kilau ---
  if(T>=B.poof){k.yaw+=adiff(k.yaw0,k.yaw)*Math.min(1,dt*5);
    if(k.kart){var pu=(T-B.poof)/.7;if(pu<1){k.sp+=dt*8*pu;k.kart.userData.parts.forEach(function(p,i){p.scale.setScalar(Math.max(.001,1-sm(pu*1.4-i*.04)))});k.kart.userData.wh.forEach(function(s){s.rotation.x+=14*dt*(1-pu)});if(Math.random()<.7){var q3=k.kart.position;burst(q3.x+(rnd()-.5)*2.5,q3.y+rnd()*1.2,q3.z+(rnd()-.5)*2.5,0xffe49a,2,3,4,.8,-2)}}
      else{var q4=k.kart.position;burst(q4.x,q4.y+.4,q4.z,0xffffff,14,6,5,.9,2);shock(q4.x,q4.z,0xffe49a,9,.7,0);scene.remove(k.kart);k.kart=null;shakeCam(.14,.25)}}
    if(T>=B.poof+.7&&T<B.poof+1.1)v.sy*=1-.22*pulse((T-B.poof-.7)/.4)}
  if(T>=B.end){b.collisionFilterMask=k.mask;it.nolock=false;it.noGrab=false;K.eggBusy=false;b.velocity.set(0,0,0);if(k.drive)bp.y=k.y0;setYaw(it,w,k.yaw0);it.ox=bp.x;it.oz=bp.z;if(k.kart)scene.remove(k.kart);
    w.bk=null;w.gcd=6;call(it,'onClick');say(bp.x,bp.y+4.2,bp.z,'📚',2.2,3.4,'#2c5a8a','#ffffff',it);endMode(it,w,2)}}

// ===== MODE EDIT BOLA (v12): Y = arah tubuh bola (di-"bake" ke body, permanen, ikut saat diseret); X/Z = kemiringan yang ikut terbawa saat diseret/berjalan.
// Selesai edit tanpa "Tetap miring": bola yang miring (X/Z) BERGULING lalu LOMPAT berdiri lagi (mode 'recover'). =====
var DEG=PI/180;
function bodyYaw(b){return 2*Math.atan2(b.quaternion.y,b.quaternion.w)}
function edStep(it,w,dt){var e=w.ed;if(!e)return;var v=w.vv,b=it.body,k=Math.min(1,dt*12);
  if(e.yt!=null){var cur=bodyYaw(b),df=adiff(e.yt*DEG,cur);if(Math.abs(df)<.004){cur=e.yt*DEG;e.yt=null}else cur+=df*k;setYaw(it,w,cur)}   // arah tubuh bola berubah sungguhan
  e.cx+=(e.x-e.cx)*k;e.cz+=(e.z-e.cz)*k;
  if(!e.x&&!e.z&&e.yt==null&&Math.abs(e.cx)+Math.abs(e.cz)<.05){w.ed=null;return}
  v.ax+=e.cx*DEG;v.az+=e.cz*DEG;v.hy+=.45*Math.max(Math.abs(Math.sin(e.cx*DEG)),Math.abs(Math.sin(e.cz*DEG)))}   // angkat sedikit supaya alas tidak menembus tanah
function startRecover(it,w,e){w.rc={ax0:e.cx,az0:e.cz,init:false,d:null};w.ed=e.yt!=null?{x:0,z:0,cx:0,cz:0,yt:e.yt}:null;w.mode='recover';w.t=0;w.p=null;w.p2=0}
// berguling 2 putaran (±4.8 unit) -> pusing -> jongkok -> lompat salto -> berdiri tegak
var RC={roll:1.5,dz:2.0,crouch:2.35,jump:3.25,land:3.6};
function recoverStep(it,w,dt){var v=w.vv,b=it.body,r=w.rc,T=w.t+=dt,bp=b.position;if(!r){endMode(it,w,1);return}
  if(!r.init){r.init=true;var yaw=bodyYaw(b),dirs=[[0,1],[0,-1],[1,0],[-1,0]],o=Math.floor(rnd()*4);
    for(var i=0;i<4&&!r.d;i++){var dd=dirs[(o+i)%4],wx=dd[0]*Math.cos(yaw)+dd[1]*Math.sin(yaw),wz=-dd[0]*Math.sin(yaw)+dd[1]*Math.cos(yaw),tx=bp.x+wx*4.8,tz=bp.z+wz*4.8;
      if(K.walkOK(tx,tz)&&K.vis(tx,tz)&&pathOK(bp.x,bp.z,tx,tz))r.d={l:dd,w:[wx,wz]}}
    if(!r.d)r.d={l:[0,1],w:[0,0]};say(bp.x,bp.y+4.2,bp.z,'💫',2,3.4,'#7a5ac8','#ffffff',it)}
  var f0=1,lift=.45*Math.max(Math.abs(Math.sin(r.ax0*DEG)),Math.abs(Math.sin(r.az0*DEG)));
  if(T<RC.roll){var s=T/RC.roll,sp=4.8*2*(1-s)/RC.roll,th=TAU*2*(1-Math.pow(1-s,2));   // melambat saat berguling
    b.velocity.x=r.d.w[0]*sp;b.velocity.z=r.d.w[1]*sp;v.ax+=r.d.l[1]*th;v.az+=-r.d.l[0]*th;v.hy+=lift*(.6+.4*Math.sin(T*14))+.15*Math.abs(Math.sin(T*10))}
  else{halt(it,dt);v.hy+=lift*(T<RC.crouch?1:Math.max(0,1-(T-RC.crouch)/(RC.jump-RC.crouch)))}
  if(T>=RC.roll&&T<RC.crouch){var q=(T-RC.roll)/(RC.crouch-RC.roll);v.az+=Math.sin(T*22)*.14*(1-q)*(T<RC.dz?1:.6);if(T>=RC.dz){var c=pulse((T-RC.dz)/(RC.crouch-RC.dz));v.sy*=1-.28*c;v.sx*=1+.14*c}}
  if(T>=RC.crouch&&T<RC.jump){var u=(T-RC.crouch)/(RC.jump-RC.crouch),sm1=sm(u);v.hy+=Math.sin(PI*u)*3.4;v.sy*=1+.12*Math.sin(PI*u);v.ax+=TAU*sm1;f0=1-sm1}
  if(T<RC.jump){v.ax+=r.ax0*DEG*f0*(T<RC.crouch?1:1);v.az+=r.az0*DEG*f0}
  if(T>=RC.jump&&T<RC.land){var l=pulse((T-RC.jump)/(RC.land-RC.jump));v.sy*=1-.26*l;v.sx*=1+.12*l}
  if(T>=RC.land){w.rc=null;endMode(it,w,2);say(bp.x,bp.y+4.2,bp.z,'😎',2,3.4,'#b5532b','#ffffff',it)}}
K.editApi={get:function(it){var w=W(it);return w.ed||(w.ed={x:0,z:0,cx:0,cz:0,yt:null})},
  yaw:function(it){var d=bodyYaw(it.body)/DEG;d=((d%360)+540)%360-180;return Math.round(d)},
  setYaw:function(it,deg){var e=K.editApi.get(it);e.yt=deg},
  items:function(){return items.filter(function(o){return ready(o)})}};
K.editKeep=false;
K.setEdit=function(on){
  if(on){if(K.eggBusy||K.sleepOn||K.editOn)return false;K.editOn=true;if(K.drag){if(K.drag.cancel)K.drag.cancel();K.drag.enabled=false}
    items.forEach(function(o){var w=o.W;if(!w)return;if(w.mode==='recover'){w.rc=null}w.mode='idle';w.p=null;w.p2=0;w.wait=999});return true}
  if(!K.editOn)return false;K.editOn=false;if(K.drag)K.drag.enabled=true;
  items.forEach(function(o){var w=o.W;if(!w)return;w.wait=1+rnd();var e=w.ed;if(!e||K.editKeep)return;
    if(Math.abs(e.x)>3||Math.abs(e.z)>3||Math.abs(e.cx)>3||Math.abs(e.cz)>3)startRecover(o,w,e);else{e.x=0;e.z=0}});return true};

// ===== MAKANAN (v8): langit oranye -> hujan makanan -> PUSARAN ANGIN menyedot semua makanan berputar ke mulut bola (±13 dtk) =====
var FD=null,softT=null;
function softTex(){if(softT)return softT;var c=document.createElement('canvas');c.width=c.height=64;var g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.4,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return softT=new THREE.CanvasTexture(c)}
function foodMakers(){if(FD)return FD;var P={};
  function sph(r,c,sx,sy,sz){var m=mkMesh(new THREE.SphereGeometry(r,12,10),c,0x2a1200);m.scale.set(sx||1,sy||1,sz||1);return m}
  function leaf(x,y){var l=mkMesh(new THREE.ConeGeometry(.13,.34,6),0x4fbf3a);l.position.set(x,y,0);l.rotation.z=-.7;return l}
  P.apple=function(){var g=new THREE.Group();g.add(sph(.58,0xe8362f));g.add(leaf(.14,.64));return g};
  P.orange=function(){var g=new THREE.Group();g.add(sph(.58,0xff9a1f));g.add(leaf(.1,.62));return g};
  P.banana=function(){var g=new THREE.Group(),m=mkMesh(new THREE.TorusGeometry(.6,.16,8,14,PI*.75),0xffd83a,0x332200);m.rotation.z=PI*.12;g.add(m);return g};
  P.grapes=function(){var g=new THREE.Group();for(var i=0;i<8;i++){var s=sph(.22,0x7a3fc4);s.position.set((i%3-1)*.26+(i>5?.13:0),.4-Math.floor(i/3)*.3,(i%2)*.12-.06);g.add(s)}g.add(leaf(0,.62));return g};
  P.strawberry=function(){var g=new THREE.Group(),c=mkMesh(new THREE.ConeGeometry(.42,.85,10),0xf0344b,0x330008);c.rotation.x=PI;g.add(c);var t=sph(.3,0x4fbf3a,1.2,.35,1.2);t.position.y=.45;g.add(t);return g};
  P.juice=function(){var g=new THREE.Group(),cup=mkMesh(new THREE.CylinderGeometry(.38,.28,.95,14),0xfff3e0);g.add(cup);var j=mkMesh(new THREE.CylinderGeometry(.34,.3,.4,14),0xff9d2e,0x442200);j.position.y=.12;g.add(j);
    var lid=mkMesh(new THREE.CylinderGeometry(.4,.4,.08,14),0xffffff);lid.position.y=.5;g.add(lid);var st=mkMesh(new THREE.CylinderGeometry(.05,.05,.9,6),0xe8362f);st.position.set(.1,.85,0);st.rotation.z=-.25;g.add(st);return g};
  P.burger=function(){var g=new THREE.Group(),bun=0xe9a94a;var b1=sph(.7,bun,1,.34,1);b1.position.y=-.3;g.add(b1);var pt=mkMesh(new THREE.CylinderGeometry(.66,.66,.2,16),0x6b3a1e);pt.position.y=-.08;g.add(pt);
    var ch=mkMesh(new THREE.BoxGeometry(1.1,.05,1.1),0xffd23a);ch.position.y=.06;ch.rotation.y=.8;g.add(ch);var lt=mkMesh(new THREE.TorusGeometry(.62,.07,6,16),0x62c24a);lt.rotation.x=PI/2;lt.position.y=.12;g.add(lt);
    var tm=mkMesh(new THREE.CylinderGeometry(.5,.5,.09,14),0xe8362f);tm.position.y=.18;g.add(tm);var top=mkMesh(new THREE.SphereGeometry(.72,14,8,0,TAU,0,PI/2),bun);top.scale.y=.85;top.position.y=.2;g.add(top);
    for(var i=0;i<6;i++){var sd=sph(.05,0xfff3d0,1,.6,1);var a=i/6*TAU;sd.position.set(Math.cos(a)*.35,.75,Math.sin(a)*.35);g.add(sd)}return g};
  P.taco=function(){var g=new THREE.Group(),sh=mkMesh(new THREE.CylinderGeometry(.62,.62,.5,16,1,true,0,PI),0xf2c46d,0x332200);sh.material.side=THREE.DoubleSide;sh.rotation.set(0,0,PI/2);g.add(sh);
    var lt=sph(.5,0x62c24a,1.1,.3,.6);lt.position.set(0,.12,0);lt.rotation.z=PI/2;g.add(lt);[-.2,.05,.25].forEach(function(z,i){var t=sph(.12,0xe8362f);t.position.set((i-1)*.02,.42-Math.abs(i-1)*.1,z*.6);g.add(t)});return g};
  return FD={P:P,kinds:['apple','orange','banana','grapes','strawberry','juice','burger','taco','apple','juice','burger','taco','orange','banana']}}
// pusaran angin: corong cincin-busur yang berputar (lebar di atas, sempit di mulut) + ±200 butir angin berputar masuk + debu di tanah
function makeVortex(){var g=new THREE.Group(),rings=[],NR=14,i;
  for(i=0;i<NR;i++){var h=i/(NR-1),r=1.7+h*3+h*h*7.5;
    for(var s=0;s<2;s++){var hold=new THREE.Group();hold.position.y=1.1+h*12.5;var m=new THREE.Mesh(new THREE.TorusGeometry(r,.04+h*.035,6,40,2.3),new THREE.MeshBasicMaterial({color:i%3===0?0xffe08a:0xfff4d8,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
      m.rotation.x=PI/2;m.rotation.z=s*PI;hold.add(m);hold.userData={h:h,sp:(2.2+(1-h)*5)*(i%2?1:1.15),ph:rnd()*TAU,m:m};g.add(hold);rings.push(hold)}}
  var NP=210,pos=new Float32Array(NP*3),pd=[];for(i=0;i<NP;i++)pd.push({th:rnd()*TAU,h:rnd(),sp:.7+rnd()*1.1,ground:i%4===0});
  var geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  var pts=new THREE.Points(geo,new THREE.PointsMaterial({color:0xfff0c0,size:.7,map:softTex(),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true}));pts.frustumCulled=false;g.add(pts);
  g.userData={rings:rings,pts:pts,pd:pd,pos:pos};return g}
function vortexTick(g,dt,T,I){var u=g.userData,i;g.scale.set(1,.25+.75*I,1);
  u.rings.forEach(function(r,j){var d=r.userData;r.rotation.y+=d.sp*dt;d.m.material.opacity=.55*I*(.6+.4*Math.sin(T*6+d.ph));r.position.y=1.1+d.h*12.5*(.25+.75*I)/(.25+.75*I)})
  u.pts.material.opacity=I;
  for(i=0;i<u.pd.length;i++){var p=u.pd[i],h,r,y;p.h-=dt*p.sp*.3;if(p.h<0)p.h=1;h=p.h;
    if(p.ground){r=1.8+h*h*14;y=.25+h*.6}else{r=1.7+h*3+h*h*7.5;y=1.1+h*12.5}
    p.th+=dt*(2.5+(1-h)*11+(p.ground?3:0));u.pos[i*3]=Math.cos(p.th)*r;u.pos[i*3+1]=y;u.pos[i*3+2]=Math.sin(p.th)*r}
  u.pts.geometry.attributes.position.needsUpdate=true}
function feastAbort(it,w){var k=w.fd;if(k){k.foods.forEach(function(f){scene.remove(f.g)});if(k.mouth&&k.mouth.parent)k.mouth.parent.remove(k.mouth);if(k.vx)scene.remove(k.vx)}K.skyTint.a=0;it.nolock=false;it.noGrab=false;K.eggBusy=false;w.fd=null}
function foodEgg(it){if(K.eggBusy||K.sleepOn)return;K.eggBusy=true;it.noGrab=true;var w=W(it);w.mode='feast';w.t=0;w.fd=null;w.p=null}
function makeMouth(){var g=new THREE.Group(),hole=new THREE.Mesh(new THREE.CircleGeometry(.34,24),new THREE.MeshBasicMaterial({color:0x2a0d14}));g.add(hole);
  var lip=new THREE.Mesh(new THREE.TorusGeometry(.34,.05,8,24),new THREE.MeshBasicMaterial({color:0xe0607a}));g.add(lip);
  var tg=new THREE.Mesh(new THREE.SphereGeometry(.2,10,8),new THREE.MeshBasicMaterial({color:0xff8aa0}));tg.scale.set(1.1,.55,.3);tg.position.set(0,-.14,.02);g.add(tg);return g}
function feastStep(it,w,dt){var v=w.vv,b=it.body,T=w.t+=dt,k=w.fd,bp=b.position,N=26;
  if(!k){var yaw0=2*Math.atan2(b.quaternion.y,b.quaternion.w);k=w.fd={yaw0:yaw0,foods:[],spawned:0,eaten:0,last:-9,mouth:makeMouth(),mp:new THREE.Vector3(),ord:[],vx:makeVortex()};
    k.mouth.position.set(0,.95,1.01);k.mouth.scale.set(.2,.1,1);it.m.add(k.mouth);scene.add(k.vx);for(var i=0;i<N;i++)k.ord.push(i);k.ord.sort(function(){return rnd()-.5});it.nolock=true}
  b.velocity.x=b.velocity.z=0;
  if(!k.s1){k.s1=true;say(bp.x,bp.y+4.2,bp.z,'🍔',2.4,3.4,'#b5532b','#ffffff',it)}
  b.quaternion.setFromAxisAngle(YA,k.yaw0*(1-sm(T/.8)));
  K.skyTint.a=T<11.8?sm(T/1.6):1-sm((T-11.8)/1.6);
  var open=T<4.6?.5*sm((T-.4)/.8):T<11.8?.5+.9*sm((T-4.6)/.6):1.4*(1-sm((T-11.8)/.5));k.mouth.scale.set(.2+.8*open,.1+1.5*open,1);
  if(T<4.6){v.hy+=Math.abs(Math.sin(T*7))*.22;v.ax+=Math.sin(T*9)*.05}
  if(T>.6&&T<.7)shock(bp.x,bp.z,0xffb347,18,1.6,0);
  // pusaran: tumbuh 4.6-5.6, berputar penuh, mereda 11.8-13
  var I=sm((T-4.6)/1)*(1-sm((T-11.8)/1.3));k.vx.position.set(bp.x,0,bp.z);vortexTick(k.vx,dt,T,I);
  if(I>.1){v.az+=Math.sin(T*22)*.03*I;v.ax+=.07*I;if(Math.random()<.12)shakeCam(.09,.2)}
  if(T>4.6&&T<4.7){shock(bp.x,bp.z,0xfff0c0,16,1.2,0);shakeCam(.2,.4);if(!k.s2){k.s2=true;say(bp.x,bp.y+4.2,bp.z,'🌪️',2.4,3.4,'#b5532b','#ffffff',it)}}
  // hujan makanan
  while(k.spawned<N&&T>=.5+k.spawned*.17){var kind=foodMakers().kinds[k.spawned%14],g=foodMakers().P[kind](),sc=1.15+rnd()*.35,hf=2*Math.atan(Math.tan(cam.fov*PI/360)*cam.aspect),z=-9-rnd()*37,hw=Math.min(40,Math.tan(hf/2)*(8-z)*.85),x=(rnd()*2-1)*hw;
    g.scale.setScalar(sc);g.position.set(x,26+rnd()*10,z);g.rotation.set(rnd()*TAU,rnd()*TAU,rnd()*TAU);scene.add(g);
    k.foods.push({g:g,vy:-(5+rnd()*4),w:new THREE.Vector3((rnd()-.5)*5,(rnd()-.5)*5,(rnd()-.5)*5),sc:sc,st:0,bn:0,ts:5.2+k.ord[k.spawned]*.16,rest:false});k.spawned++}
  it.m.localToWorld(k.mp.set(0,.95,1.1));
  for(var i2=k.foods.length-1;i2>=0;i2--){var f=k.foods[i2],g2=f.g,p=g2.position;
    if(f.st===0){if(T>=f.ts){f.st=1;f.t1=T;f.rho=Math.max(2.2,Math.hypot(p.x-bp.x,p.z-bp.z));f.th=Math.atan2(p.z-bp.z,p.x-bp.x)}
      else{f.vy-=11*dt;p.y+=f.vy*dt;var gy=Math.max(0,K.H(p.x,p.z))+.7*f.sc;
        if(p.y<gy){p.y=gy;if(f.bn<2){f.vy=-f.vy*.32;f.bn++;if(f.bn===1)burst(p.x,gy,p.z,0xffe08a,3,3,3,.5,8)}else{f.vy=0;f.rest=true}}
        if(!f.rest){g2.rotation.x+=f.w.x*dt;g2.rotation.y+=f.w.y*dt;g2.rotation.z+=f.w.z*dt}}}
    if(f.st===1){   // terangkat angin lalu berputar mengikuti corong, makin dekat makin cepat
      var el=T-f.t1,wsp=1.6+26/(f.rho+2.5);f.th+=wsp*dt;f.rho-=(2.2+el*6.5)*dt*Math.min(1,.35+el);
      var ty=1.1+Math.max(0,f.rho-1.8)*.9+Math.sin(T*5+f.rho)*.3;p.y+=(ty-p.y)*Math.min(1,dt*(2+el*2));
      p.x=bp.x+Math.cos(f.th)*f.rho;p.z=bp.z+Math.sin(f.th)*f.rho;g2.rotation.x+=7*dt;g2.rotation.y+=10*dt;g2.rotation.z+=4*dt;
      if(Math.random()<.2)burst(p.x,p.y,p.z,0xfff0c0,1,.6,.4,.4,0);
      if(f.rho<2.1){f.st=2;f.t2=T}}
    if(f.st===2){var dx=k.mp.x-p.x,dy=k.mp.y-p.y,dz=k.mp.z-p.z,d=Math.sqrt(dx*dx+dy*dy+dz*dz)||.01,sp=6+(T-f.t2)*14,stp=Math.min(d,sp*dt);
      p.x+=dx/d*stp;p.y+=dy/d*stp;p.z+=dz/d*stp;g2.rotation.x+=9*dt;g2.rotation.y+=7*dt;g2.scale.setScalar(f.sc*Math.max(.12,Math.min(1,d/3)));
      if(d<.65||T>12.4){scene.remove(g2);k.foods.splice(i2,1);k.eaten++;k.last=T;burst(k.mp.x,k.mp.y,k.mp.z,0xffd36b,2,2,2,.4,0);if(k.eaten%4===0&&K.sfx&&K.sfx.pop)K.sfx.pop()}}}
  v.sx*=1+k.eaten/N*.14+.08*pulse(Math.min(1,(T-k.last)/.25));v.sy*=1+k.eaten/N*.14+.08*pulse(Math.min(1,(T-k.last)/.25));
  if(T>=13.6){if(k.mouth.parent)k.mouth.parent.remove(k.mouth);scene.remove(k.vx);k.foods.forEach(function(f){scene.remove(f.g)});K.skyTint.a=0;it.nolock=false;it.noGrab=false;K.eggBusy=false;w.fd=null;
    call(it,'onClick');say(bp.x,bp.y+4.2,bp.z,'😋',2.4,3.4,'#b5532b','#ffffff',it);endMode(it,w,2);K.skyTint.a=0}}

// ---------- loop utama ----------
K.hooks.push(function(dt,t){var R=K.realDt||dt,i,j;
  // partikel
  PART.forEach(function(p){if(p.l<=0)return;p.l-=R;if(p.l<=0){p.m.visible=false;return}p.v.y-=p.g*R;p.m.position.addScaledVector(p.v,R);p.m.material.opacity=clamp(p.l/p.d*1.6,0,1);p.m.rotation.y+=R*6;p.m.scale.multiplyScalar(1-R*.5)});
  for(i=RINGS.length-1;i>=0;i--){var r=RINGS[i];r.t+=R;if(r.t<0)continue;var u=r.t/r.dur;if(u>=1){scene.remove(r.m);r.m.geometry.dispose();r.m.material.dispose();RINGS.splice(i,1);continue}
    r.m.visible=true;if(r.inv){r.m.scale.setScalar(.4+r.R*(1-u));r.m.material.opacity=.8*Math.sin(u*PI)}else{r.m.scale.setScalar(.5+r.R*(1-Math.pow(1-u,2.2)));r.m.material.opacity=.9*(1-u)}}
  for(i=SPR.length-1;i>=0;i--){var s=SPR[i];s.t+=R;var u2=s.t/s.life;if(u2>=1){scene.remove(s.s);s.s.material.dispose();SPR.splice(i,1);continue}
    var k=u2<.12?sm(u2/.12)*1.15-(u2>.08?.15*sm((u2-.08)/.04):0):u2>.8?1-sm((u2-.8)/.2):1;s.s.scale.set(s.size*k,s.size*k*.625,1);
    if(s.follow){var fb=s.follow.body.position;s.s.position.set(fb.x,fb.y+s.follow.W.vv.hy+4.2+(s.size>4?.8:0)+Math.sin(s.t*3)*.12,fb.z)}}
  if(shake.d>0){shake.t+=R;var q=1-shake.t/shake.d;
    if(K.camReady){if(q<=0)shake.d=0;else{cam.position.x+=(rnd()-.5)*shake.a*q;cam.position.y+=(rnd()-.5)*shake.a*q}}   // v6: kamera diatur camera-mode.js tiap frame -> goyangan ditambahkan di atas pose
    else if(q<=0){cam.position.copy(shake.base);shake.d=0}else{cam.position.set(shake.base.x+(rnd()-.5)*shake.a*q,shake.base.y+(rnd()-.5)*shake.a*q,shake.base.z)}}
  sleepTick(R);   // v6: cutscene tidur
  pagesTick(R);   // v7: kertas & pecahan jetpack
  // semua bola
  var act=items.filter(function(o){return ready(o)});
  act.forEach(function(it){var w=W(it),v=w.vv,b=it.body;v.hy=0;v.ax=0;v.az=0;v.ay=0;v.sx=1;v.sy=1;b.allowSleep=false;b.wakeUp();
    if(K.editOn&&!it.dragging){halt(it,dt);edStep(it,w,dt);return}   // v11: mode Edit Bola -> bola diam, hanya menerapkan putaran
    if(it.dragging){if(w.mode==='beacon'){beaconOwner=null;beam.visible=false;gl.visible=false;whiteDome.visible=false;whiteDome.material.opacity=0}if(w.mode==='timewarp'){K.timeScale=1;clockOn=false;if(gc){gc.el.classList.remove('on');gc.veil.classList.remove('on')}}if(w.mode==='bookegg')bookAbort(it,w);if(w.mode==='feast')feastAbort(it,w);if(w.mode==='recover')w.rc=null;w.mode='idle';w.wait=1;w.p=null;w.p2=0}
    else switch(w.mode){
      case'idle':halt(it,dt);w.wait-=dt;w.gcd-=dt;if(w.wait<=0){var tg=pickTarget(it,false);if(tg){w.tx=tg[0];w.tz=tg[1];w.mode='walk';w.sp=1.6+rnd()*1.1}else w.wait=1}break;
      case'walk':{var r=go(it,w,w.tx,w.tz,w.sp,dt);w.gcd-=dt;if(r===true)endMode(it,w);else if(r==='blocked')endMode(it,w,.4);else gait(w,w.sp,dt)}break;
      case'greet':greetStep(it,w,dt);break;
      case'run':runStep(it,w,dt);break;
      case'shout':shoutStep(it,w,dt);break;
      case'stun':stunStep(it,w,dt);break;
      case'beacon':beaconStep(it,w,dt);break;
      case'timewarp':timewarpStep(it,w,dt,R);break;
      case'fly':flyStep(it,w,dt);break;
      case'bookegg':bookStep(it,w,dt);break;
      case'feast':feastStep(it,w,dt);break;
      case'recover':recoverStep(it,w,dt);break}
    edStep(it,w,dt);   // v12: kemiringan X/Z & arah Y tetap diterapkan, juga saat diseret
    });
  // bertemu -> saling menyapa
  if(!K.editOn)for(i=0;i<act.length;i++)for(j=i+1;j<act.length;j++){var a=act[i],c=act[j],aw=a.W,cw=c.W;
    if((aw.mode!=='idle'&&aw.mode!=='walk')||(cw.mode!=='idle'&&cw.mode!=='walk')||aw.gcd>0||cw.gcd>0||a.dragging||c.dragging)continue;
    if(Math.hypot(a.body.position.x-c.body.position.x,a.body.position.z-c.body.position.z)<5.2){aw.mode=cw.mode='greet';aw.p=c;cw.p=a;aw.t=cw.t=0;aw.gt=cw.gt=0;aw.fired=cw.fired=false}}
  // terapkan tampilan
  act.forEach(function(it){var v=it.W.vv;it.hy=v.hy;it.ax=v.ax;it.az=v.az;it.ay=v.ay;it.sx=v.sx;it.sy=v.sy});
});

// ---------- klik & tahan ----------
function call(it,name){var g=it.m&&it.m.children[0];if(g&&g.userData.kh&&g.userData.kh[name])try{g.userData.kh[name]()}catch(e){}}
K.onItemDown=function(it){call(it,'onPointerDown')};
K.onItemUp=function(it){call(it,'onPointerUp')};
K.onItemClick=function(it){call(it,'onClick')};   // v11: putar XYZ dipindah ke mode Edit Bola
// dipanggil drag.js saat sebuah bola ditahan cukup lama (K.holdNeed[type] detik) tanpa menggeser kursor; bola sudah dilepas
K.onItemHold=function(it){if(K.sleepOn||K.eggBusy||!NEED[it.type])return;
  if(it.type==='angel'&&beaconOwner)return;if(it.type==='clock'&&clockOn)return;
  var w=W(it);w.p=null;w.p2=0;egg(it)};
})();
