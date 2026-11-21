// KEDATANGAN di Ladang Langit (Fase 3.6) — menggantikan layar "Ketuk untuk lanjut", portal galaksi, dan dashboard (versi lama: _old/intro_v35_old.js, portal_v35_old.js).
// Alur (Fase 3.9):
//   1. Layar putih dari Pulau Awan memudar ke Ladang Langit (bidikan pemandangan dibekukan jadi gambar)
//   2. Langit BERGEMURUH & menggelap, lalu PETIR dahsyat menyambar tanah (kilatan menyilaukan, getar)
//   3. Dari titik sambaran, RETAKAN DIMENSI menjalar ke atas & bawah layar
//   4. DUNIA PECAH: dua belahan dunia bergeser menjauh, cahaya emas (dimensi lain) membanjir, berkas sinar berputar, kilatan putih
//   5. Guide TURUN lebih dulu (guide.js memulai saat event 'kaih-ladang-arrive')
//   6. Guide memanggil teman-temannya -> event 'kaih-ladang-balls' -> 7 bola komponen JATUH dari langit (physics.begin)
// API: K.arrival = { state(), skip(), balls(), onEnd }.   Waktu diatur lewat konstanta T_* di bawah.
(function(){var K=window.KAIH,X=K.ctx,cam=X.cam,R=X.R,phys=X.phys,cvs=X.canvas,home=K.camHome;
var T_STRIKE=1.3,      // detik: petir menyambar tanah
    T_COVER=1.7,       // detik: retakan mulai menjalar dari titik sambaran
    T_CRACK=1.7,       // lama retakan menjalar
    T_SPLIT=2.2,       // lama langit terbelah
    T_FADE=1.3,        // lama cahaya mereda setelah belahan keluar layar
    T_TILT0=3.5,T_TILT=.001,   // (kamera tidak lagi menengadah; nilai ini hanya jeda minimum sebelum intro dianggap selesai)
    T_AUTO_BALLS=15;   // cadangan: bola jatuh otomatis bila Guide tidak memicunya
var sm5=function(x){x=Math.min(1,Math.max(0,x));return x*x*x*(x*(x*6-15)+10)},cl=function(x){return Math.min(1,Math.max(0,x))},
    smt=function(x){x=cl(x);return x*x*(3-2*x)},eo=function(x){x=cl(x);return 1-Math.pow(1-x,3)};
var p0=home.pos.clone(),q0=home.quat.clone();
cam.position.copy(p0);cam.quaternion.copy(q0);
var state='wait',t=0,frames=0,snapReq=false,snapOk=false,snap=null,sctx=null,ov=null,oc=null,W=0,H=0,seam=[],branches=[],sparks=[],
    bolt=[],sx=0,sy=0,midI=8,struck=false,thund=false,ballsStarted=false,ended=false,arrived=false,rumbled=false,boomed=false,ballT=0,fast=!!window.__kaihFast;
window.__kaihFast=false;
if(!fast&&window.KaihSeen)KaihSeen.mark('ladang');   // kedatangan benar-benar diputar -> jangan putar lagi di sesi ini
if(window.KaihSkip)KaihSkip.hide();   // landscape baru dimuat: tombol skip cutscene sebelumnya sudah tidak diperlukan
if(window.KaihSettings)KaihSettings.apply();   // terapkan grafik (bayangan, resolusi) & kelas device pada Ladang Langit
function sfx(k){try{if(window.kxSfx)window.kxSfx(k)}catch(e){}}
function rng(s){return function(){s|=0;s=s+0x6D2B79F5|0;var a=Math.imul(s^s>>>15,1|s);a=a+Math.imul(a^a>>>7,61|a)^a;return((a^a>>>14)>>>0)/4294967296}}

// ---------- ambil gambar langit tepat setelah sebuah frame dirender (buffer WebGL belum dibuang) ----------
var r0=R.render;R.render=function(a,b){r0.call(R,a,b);if(snapReq){snapReq=false;try{snap=document.createElement('canvas');snap.width=cvs.width;snap.height=cvs.height;sctx=snap.getContext('2d');sctx.drawImage(cvs,0,0);snapOk=true}catch(e){snapOk=false;snap=null;console.warn('[7 KAIH] snapshot langit gagal',e)}}};

// ---------- celah: garis bergerigi dari atas ke bawah layar + cabang-cabang kecil ----------
function buildSeam(){var r=rng(7),n=16,cx=W*.5,sl=W*.1*(r()<.5?-1:1);seam=[];sx=cx;sy=H*.64;midI=(sy+H*.06)/(H*1.12)*n;
  for(var i=0;i<=n;i++){var y=-H*.06+(H*1.12)*i/n,j=(i===0||i===n)?0:(r()-.5)*W*.05*(i%2?1:-1);seam.push([cx+(i/n-.5)*sl+j,y])}
  branches=[];for(var k=1;k<n;k++){if(r()<.5)continue;var p=seam[k],d=r()<.5?-1:1,pts=[p],x=p[0],y=p[1],L=2+(r()*3|0);
    for(var m=0;m<L;m++){x+=d*W*(.02+r()*.035);y+=(r()-.3)*H*.04;pts.push([x,y])}branches.push({k:k,pts:pts})}
  bolt=[];var bx=sx+(r()-.5)*W*.14,by=-H*.05,N=11;   // petir: dari atas langit ke titik sambaran
  for(var q=0;q<=N;q++){var f=q/N,jx=q===N?0:(r()-.5)*W*.07*(1-f*.4);bolt.push([bx+(sx-bx)*f+jx,by+(sy-by)*f])}
  bolt.br=[];for(var b2=2;b2<N-1;b2++){if(r()<.5)continue;var p2=bolt[b2],d2=r()<.5?-1:1,pp=[p2],xx=p2[0],yy=p2[1];for(var m2=0;m2<3;m2++){xx+=d2*W*(.02+r()*.03);yy+=H*(.03+r()*.04);pp.push([xx,yy])}bolt.br.push(pp)}
  sparks=[];for(var s=0;s<70;s++)sparks.push({x:cx+(r()-.5)*W*.1,y:r()*H,vx:(r()-.5)*W*.12,vy:-H*(.05+r()*.18),sz:(1.5+r()*3.5)*(W/900),ph:r()*6.28})}
function build(){
  W=snap.width;H=snap.height;ov=document.createElement('canvas');ov.id='kx-split';ov.width=W;ov.height=H;
  ov.style.cssText='position:fixed;left:0;top:0;width:100%;height:100%;z-index:2147481400;pointer-events:none';
  document.documentElement.appendChild(ov);oc=ov.getContext('2d');buildSeam()}

// ---------- gambar ----------
function seamPath(c,off,upto){c.beginPath();var n=seam.length;c.moveTo(seam[0][0]+off,seam[0][1]);for(var i=1;i<n&&i<=upto;i++)c.lineTo(seam[i][0]+off,seam[i][1])}
function halfPath(c,side){c.beginPath();var e=side<0?-W*.3:W*1.3;c.moveTo(e,-H*.2);for(var i=0;i<seam.length;i++)c.lineTo(seam[i][0],seam[i][1]);c.lineTo(e,H*1.2);c.closePath()}
function rim(c,w){c.lineJoin='round';c.lineCap='round';
  c.save();c.strokeStyle='rgba(255,222,130,.55)';c.lineWidth=w*7;c.shadowColor='rgba(255,210,100,.9)';c.shadowBlur=w*10;seamPath(c,0,99);c.stroke();c.restore();
  c.save();c.strokeStyle='rgba(255,248,215,.95)';c.lineWidth=w*2.2;c.shadowColor='#fff3c4';c.shadowBlur=w*6;seamPath(c,0,99);c.stroke();c.restore()}
function lightLayer(c,a,tt){
  if(a<=0)return;c.save();c.globalAlpha=a;
  var g=c.createRadialGradient(W*.5,H*.5,0,W*.5,H*.5,Math.max(W,H)*.75);g.addColorStop(0,'#fffdf2');g.addColorStop(.35,'#ffeeb4');g.addColorStop(.75,'#ffd27a');g.addColorStop(1,'#f4b24e');
  c.fillStyle=g;c.fillRect(0,0,W,H);
  c.globalCompositeOperation='lighter';var n=22,cx=W*.5,cy=H*.5,L=Math.hypot(W,H),gr=c.createRadialGradient(cx,cy,0,cx,cy,L*.6);
  gr.addColorStop(0,'rgba(255,255,235,.55)');gr.addColorStop(1,'rgba(255,230,150,0)');c.fillStyle=gr;
  for(var i=0;i<n;i++){var an=i/n*6.2832+tt*.18,hw=.035+.025*(i%3);c.beginPath();c.moveTo(cx,cy);
    c.lineTo(cx+Math.cos(an-hw)*L*.6,cy+Math.sin(an-hw)*L*.6);c.lineTo(cx+Math.cos(an+hw)*L*.6,cy+Math.sin(an+hw)*L*.6);c.closePath();c.fill()}
  for(var s=0;s<sparks.length;s++){var p=sparks[s],k=(tt*.35+s*.137)%1,x=p.x+p.vx*k,y=p.y+p.vy*k*3;y=((y%H)+H)%H;var tw=.5+.5*Math.sin(tt*6+p.ph);
    c.fillStyle='rgba(255,252,230,'+(.55*tw).toFixed(3)+')';c.beginPath();c.arc(x,y,p.sz,0,6.2832);c.fill()}
  c.restore()}
function dark(c,a){if(a>0){c.save();c.fillStyle='rgba(8,12,34,'+a.toFixed(3)+')';c.fillRect(0,0,W,H);c.restore()}}
function strokeBolt(c,dpr,a){c.save();c.lineJoin='round';c.lineCap='round';c.globalCompositeOperation='lighter';
  [['rgba(150,165,255,.55)',14,26],['rgba(225,232,255,.9)',5,14],['#ffffff',2.2,6]].forEach(function(P){c.strokeStyle=P[0];c.globalAlpha=a;c.lineWidth=P[1]*dpr;c.shadowColor='#9aa8ff';c.shadowBlur=P[2]*dpr;
    c.beginPath();bolt.forEach(function(p,i){i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1])});c.stroke();
    bolt.br.forEach(function(b){c.beginPath();b.forEach(function(p,i){i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1])});c.stroke()})});c.restore()}
function draw(){
  var c=oc,dpr=W/innerWidth;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,W,H);
  var ck=cl((t-T_COVER)/T_CRACK),sp=cl((t-T_COVER-T_CRACK)/T_SPLIT),e=sm5(sp),fadeA=1-smt((t-T_COVER-T_CRACK-T_SPLIT)/T_FADE);
  if(sp<=0){   // langit beku utuh + retakan menjalar dari tengah ke atas & bawah
    var ts=t-T_STRIKE,shk=(ck>0?(1+ck*5)*dpr:0)+(ts>=0&&ts<.6?(1-ts/.6)*16*dpr:0);c.save();if(shk)c.translate((Math.random()-.5)*shk,(Math.random()-.5)*shk);
    c.drawImage(snap,0,0);dark(c,.6*smt(t/1.1));
    var pf=Math.max(t>.5?Math.exp(-(t-.5)*16):0,t>.85?Math.exp(-(t-.85)*16):0)*.22;   // kilat samar di kejauhan
    if(pf>0.005){c.fillStyle='rgba(200,210,255,'+pf.toFixed(3)+')';c.fillRect(0,0,W,H)}
    if(ts>=0){   // SAMBARAN PETIR + kilatan menyilaukan + bara di titik hantaman
      var fa=ts<.08?1:ts<.14?.08:ts<.32?.95*(1-(ts-.14)/.18):0;if(fa>0)strokeBolt(c,dpr,fa);
      var gr=c.createRadialGradient(sx,sy,0,sx,sy,W*(.05+.10*Math.min(1,ts*3)));gr.addColorStop(0,'rgba(255,255,255,'+(Math.max(0,1-ts/1.6)).toFixed(3)+')');gr.addColorStop(1,'rgba(255,240,190,0)');
      c.save();c.globalCompositeOperation='lighter';c.fillStyle=gr;c.fillRect(0,0,W,H);c.restore();
      var wf=Math.max(0,1-ts/.55);if(wf>0){c.fillStyle='rgba(255,255,255,'+(wf*wf).toFixed(3)+')';c.fillRect(0,0,W,H)}}
    if(ck>0){var n=seam.length-1,mid=midI,reach=eo(ck)*(Math.max(midI,n-midI)+.5),lo=Math.max(0,Math.floor(mid-reach)),hi=Math.min(n,Math.ceil(mid+reach));
      c.lineJoin='round';c.lineCap='round';
      var pass=[['rgba(255,214,110,.35)',16*dpr,22*dpr,'rgba(255,214,110,.9)'],['rgba(255,244,200,.85)',5.5*dpr,10*dpr,'#fff3c4'],['#ffffff',2*dpr,4*dpr,'#fff']];
      for(var q=0;q<pass.length;q++){c.save();c.strokeStyle=pass[q][0];c.lineWidth=pass[q][1]*(.5+ck*.7);c.shadowColor=pass[q][3];c.shadowBlur=pass[q][2];
        c.beginPath();c.moveTo(seam[lo][0],seam[lo][1]);for(var i=lo+1;i<=hi;i++)c.lineTo(seam[i][0],seam[i][1]);c.stroke();
        for(var b=0;b<branches.length;b++){var br=branches[b];if(br.k<lo||br.k>hi)continue;c.beginPath();c.moveTo(br.pts[0][0],br.pts[0][1]);for(var m=1;m<br.pts.length;m++)c.lineTo(br.pts[m][0],br.pts[m][1]);c.stroke()}
        c.restore()}
      var gl=c.createLinearGradient(0,0,W,0);   // pendar halus di sekitar retakan
      c.save();c.globalCompositeOperation='lighter';c.globalAlpha=.25*ck;gl.addColorStop(0,'rgba(255,220,130,0)');gl.addColorStop(.5,'rgba(255,230,150,1)');gl.addColorStop(1,'rgba(255,220,130,0)');c.fillStyle=gl;c.fillRect(W*.3,0,W*.4,H);c.restore()}
    c.restore();return}
  // langit terbelah: cahaya di belakang, dua belahan di depan
  lightLayer(c,fadeA,t);
  if(fadeA>0&&e<1){
    var dx=e*W*.66,an=e*.16,sh=(1-e)*(1+3*e)*dpr*2;
    [-1,1].forEach(function(sd){var px=sd<0?0:W;c.save();
      c.translate(sd*dx,0);c.translate(px,0);c.rotate(sd*an);c.translate(-px,0);   // geser menjauh + miring di sudut luar atas
      halfPath(c,sd);c.clip();c.globalAlpha=Math.min(1,fadeA*1.2);c.drawImage(snap,0,0);dark(c,.6*(1-e));
      c.globalAlpha=1;rim(c,dpr*(1-e*.6));c.restore()});
  }
  // kilatan putih saat mulai terbelah
  var fl=1-cl((t-T_COVER-T_CRACK)/.55);if(fl>0){c.fillStyle='rgba(255,255,255,'+(fl*.9).toFixed(3)+')';c.fillRect(0,0,W,H)}}

// ---------- alur ----------
function fxOverlay(){return document.getElementById('kx-exit-fx')}
function dropExitFx(){var f=fxOverlay();if(!f)return;f.style.transition='opacity .9s ease';f.style.opacity='0';setTimeout(function(){if(f.parentNode)f.parentNode.removeChild(f)},1000)}
function start(){
  if(state!=='wait')return;state='cover';t=0;build();
  if(window.KaihSkip)KaihSkip.show('c3',{run:function(){return K.arrival.skip()}});   // tombol Skip untuk kedatangan
  var f=fxOverlay();if(f){var w=f.querySelector('.wf');if(w){w.style.transition='opacity .9s ease';w.style.opacity='0'}f.querySelectorAll('.sl').forEach(function(x){x.style.transition='opacity .5s';x.style.opacity='0'});setTimeout(dropExitFx,1100)}}
function finish(){
  if(ended)return;ended=true;state='done';cam.position.copy(home.pos);cam.quaternion.copy(home.quat);
  document.body.classList.add('intro-done');K.drag.enabled=true;if(K.camPan)K.camPan.enabled=true;if(K.camEnable)try{K.camEnable()}catch(e){}
  if(window.KaihSkip)KaihSkip.hide('c3');if(K.arrival.onEnd)try{K.arrival.onEnd()}catch(e){}}
function removeOv(){if(ov&&ov.parentNode)ov.parentNode.removeChild(ov);ov=null;oc=null;snap=null;sctx=null}
function balls(){if(ballsStarted)return;ballsStarted=true;K.drag.enabled=true;phys.begin(.3,.5);ballT=0}
K.arrival={state:function(){return state},balls:balls,onEnd:null,
  skip:function(){if(ended)return false;
    removeOv();dropExitFx();state='done';cam.position.copy(home.pos);cam.quaternion.copy(home.quat);
    if(!ballsStarted){ballsStarted=true;phys.skipSpawn()}
    if(!arrived){arrived=true;try{dispatchEvent(new CustomEvent('kaih-ladang-skip'))}catch(e){}}
    finish();return true}};
addEventListener('kaih-ladang-balls',balls);
if(fast)setTimeout(function(){K.arrival.skip()},400);
K.hooks.push(function(dt){var rd=K.realDt||dt;
  if(state==='done'){if(ballsStarted&&!ended){ballT+=rd;if(ballT>5.6)finish()}return}
  if(state==='wait'){cam.position.copy(p0);cam.quaternion.copy(q0);frames++;if(frames===4)snapReq=true;if(snapOk)start();return}
  t+=rd;
  var u=sm5((t-T_TILT0)/T_TILT);cam.position.lerpVectors(p0,home.pos,u);cam.quaternion.copy(q0).slerp(home.quat,u);
  var tc=T_COVER+T_CRACK,te=tc+T_SPLIT+T_FADE;
  if(!thund&&t>.3){thund=true;sfx('thunder')}
  if(!struck&&t>T_STRIKE){struck=true;sfx('thunder')}
  if(!rumbled&&t>T_COVER+.1){rumbled=true;sfx('crack')}
  if(!boomed&&t>tc){boomed=true;sfx('split');setTimeout(function(){sfx('arrive')},1400)}
  if(!arrived&&t>tc+.15){arrived=true;try{dispatchEvent(new CustomEvent('kaih-ladang-arrive'))}catch(e){}}   // Guide mulai turun
  if(oc)draw();
  if(t>te&&oc)removeOv();
  if(ballsStarted){ballT+=rd;if(ballT>5.6&&t>T_TILT0+T_TILT)finish()}
  else if(t>T_AUTO_BALLS)balls()});
})();
