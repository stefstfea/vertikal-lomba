const $=i=>document.getElementById(i),R=Math.random;
// ===== EFEK 2D: bintang, awan, burung, malaikat, bintang jatuh =====
const fx=$('fx'),c=fx.getContext('2d');let W,H;
// Fase 3: pixel ratio dibatasi 2 (mencegah GPU overdraw di layar HiDPI)
function rs(){const d=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;fx.width=W*d;fx.height=H*d;c.setTransform(d,0,0,d,0,0)}
const stars=Array.from({length:130},()=>({x:R(),y:R()*.8,r:R()*1.4+.4,p:R()*6}));
const clouds=Array.from({length:20},(_,i)=>({x:R()*1.3-.15,y:i<7?.06+R()*.34:.55+R()*.5,s:.7+R()*1.3,v:(.004+R()*.01)*(i<7?.6:1),a:i<7?.5+R()*.2:.65+R()*.3}));   // daylight: awan putih lebih banyak & pekat
const birds=[],shots=[];let nb=1,na=5,ns=1.5;
function cloud(x,y,s,a){c.fillStyle='rgba(255,255,255,'+a+')';
  [[0,0,34],[38,-8,28],[-38,-4,26],[14,-20,26],[70,6,20],[-68,8,20]].forEach(([dx,dy,r])=>{c.beginPath();c.arc(x+dx*s,y+dy*s,r*s,0,6.3);c.fill()})}
function bird(x,y,s,t){const f=Math.sin(t*9)*.6;c.beginPath();c.moveTo(x-s,y-s*.3-f*s);c.quadraticCurveTo(x-s*.4,y-s*.1,x,y);c.quadraticCurveTo(x+s*.4,y-s*.1,x+s,y-s*.3-f*s);c.stroke()}

// --- Fase 3: rafId guard – mencegah double loop & berhenti total saat fxOff ---
let last=0,tm=0,fxOff=false,fxRafId=0;
function fxTick(ms){
  fxRafId=0;
  if(fxOff) return;  // berhenti; fxStart() akan restart saat fxOff=false
  const dt=Math.min((ms-last)/1000,.05);last=ms;tm+=dt;c.clearRect(0,0,W,H);
  const k=Math.min(W,H)/520;
  stars.forEach(s=>{c.fillStyle='rgba(255,252,225,'+(.25+.5*Math.abs(Math.sin(tm*1.5+s.p)))+')';c.beginPath();c.arc(s.x*W,s.y*H,s.r,0,6.3);c.fill()});
  clouds.forEach(o=>{o.x+=o.v*dt;if(o.x>1.25)o.x=-.25;cloud(o.x*W,o.y*H,o.s*k,o.a)});
  if((nb-=dt)<=0){nb=7+R()*6;const d=R()<.5?1:-1;birds.push({x:d>0?-60:W+60,y:H*(.15+R()*.3),v:d*(70+R()*30),n:3+(R()*3|0)})}
  c.strokeStyle='#3a628f';c.lineWidth=2;c.lineCap='round';
  birds.forEach((b,i)=>{b.x+=b.v*dt;for(let j=0;j<b.n;j++)bird(b.x-Math.sign(b.v)*j*22*k,b.y+(j%2?1:-1)*j*8*k,8*k+3,tm+j*.4);if(b.x<-200||b.x>W+200)birds.splice(i,1)});
  if((ns-=dt)<=0){ns=2.5+R()*3;shots.push({x:R()*W*1.1,y:R()*H*.3,vx:-380-R()*200,vy:200+R()*100,l:1})}
  shots.forEach((s,i)=>{s.x+=s.vx*dt;s.y+=s.vy*dt;s.l-=dt*1.1;const n=Math.hypot(s.vx,s.vy),tx=s.x-s.vx/n*130,ty=s.y-s.vy/n*130,g=c.createLinearGradient(s.x,s.y,tx,ty);
    g.addColorStop(0,'rgba(255,250,215,'+s.l+')');g.addColorStop(1,'rgba(255,250,215,0)');c.strokeStyle=g;c.lineWidth=2.5;c.beginPath();c.moveTo(s.x,s.y);c.lineTo(tx,ty);c.stroke();
    c.fillStyle='rgba(255,255,255,'+s.l+')';c.beginPath();c.arc(s.x,s.y,2.5,0,6.3);c.fill();if(s.l<=0)shots.splice(i,1)});
  fxRafId=requestAnimationFrame(fxTick)}
// restart-safe: dipanggil saat fxOff berubah false atau visibility berubah visible
function fxStart(){if(!fxOff&&!fxRafId){last=performance.now();fxRafId=requestAnimationFrame(fxTick)}}
// alias backward-compat (dipanggil oleh rs() di onResize)
function loop(){fxStart()}

const wipe=$('wipe');
for(let i=0;i<16;i++){const d=document.createElement('i'),s=55+R()*45;
  d.style.cssText='width:'+s+'vmax;height:'+s*.7+'vmax;left:'+((i%4)*28-20+R()*12)+'%;top:'+(Math.floor(i/4)*30-15+R()*10)+'%;transition-delay:'+i*45+'ms';wipe.appendChild(d)}
let started=false;
$('play').onclick=()=>{
  if(started)return;
  if(!window.__kaihMount){$('err').textContent='Dunia 3D belum siap. Muat ulang halaman.';return}
  if(!window.__kaihDeviceChosen){window.KaihDevice.ask(()=>$('play').click());return}   // v13: pilih device (laptop / handphone) dulu
  started=true;window.__kaihPlayStarted=true;if(window.KaihSeen){if(KaihSeen.has('intro'))window.__kaihSkipIntro=true;KaihSeen.mark('intro')}   // intro (prolog+kamera) hanya sekali per sesi
  window.dispatchEvent(new Event('kaih-play-start'));$('err').textContent='';$('menu').classList.add('hide');wipe.className='in';
  setTimeout(()=>window.__kaihMount(),300);                       // dunia 3D dimuat di balik awan
  const t0=performance.now(),wt=setInterval(()=>{if((performance.now()-t0>1500||window.__kaihSkipIntro)&&window.__kaihMounted){clearInterval(wt);go()}},100);
  function go(){$('menu').style.display='none';$('bg').style.display='none';
    // Fase 3: matikan loop FX dengan aman – batalkan rAF aktif
    fxOff=true;if(fxRafId){cancelAnimationFrame(fxRafId);fxRafId=0}
    fx.style.display='none';
    dispatchEvent(new Event('kaih-intro'));wipe.className='out';
    setTimeout(()=>{if(!window.__kaihSkipIntro)$('prolog').classList.add('on')},1500);setTimeout(()=>$('prolog').classList.remove('on'),5200)}};

// Fase 3: debounce resize (mencegah resize storm di orientasi flip mobile)
let rsTimer=0;
addEventListener('resize',()=>{clearTimeout(rsTimer);rsTimer=setTimeout(rs,120)});
// Fase 3: resume loop saat tab kembali aktif
document.addEventListener('visibilitychange',()=>{if(!document.hidden)fxStart()});
rs();fxStart();
