// Waktu -> suasana. Ubah tabel RAW untuk mengganti warna tiap jam. Jam diambil dari perangkat (waktu setempat).
(function(){var K=window.KAIH=window.KAIH||{};
var C=function(h){return new THREE.Color(h).convertSRGBToLinear()};
// [jam, langit atas, langit horizon, cahaya utama, intensitas cahaya, hemi atas, hemi bawah, intensitas hemi, kabut, awan, rumput dasar, rumput ujung, bintang]
var N0=[0,'#071638','#243d79','#b9d9ff',0.82,'#526bb0','#24264f',1.05,'#263b70','#9aaee8','#174538','#6bc9b1',1];
var RAW=[N0,
[5,'#1b2160','#8a5fa8','#ff9a8a',.8,'#5b5fa0','#2a2040',1.0,'#6b5a95','#b08ac8','#2a5a3a','#6a9a7a',.5],
[6.6,'#6b91e8','#b7d8ff','#ffe0b0',1.12,'#b7d7ff','#718b80',.98,'#c7dcf4','#f5f6ff','#4c9a48','#bfe77a',0],
[9,'#4a8fe8','#b9e4ff','#fff0d4',1.25,'#c7e4ff','#829d75',1.02,'#d9eaff','#fffdf9','#45a94c','#c2ed82',0],
[12.5,'#3b85df','#b4e2ff','#fff6e5',1.32,'#d2eaff','#91b86a',1.04,'#dceeff','#fffefa','#45a94c','#c4ef85',0],
[16,'#528ce0','#ffe8c9','#ffe4bd',1.35,'#c8e0ff','#8aa46e',1.04,'#f1e8df','#fff3e5','#48a34a','#c7eb80',0],
[18.2,'#3b4fa8','#ff8a5c','#ff8a50',2.2,'#8f8ad8','#6a4a50',1.2,'#f0a080','#ffb08a','#3a7a3a','#f0d070',0],
[19.5,'#1f2468','#b05a90','#ff7090',.9,'#5a5ab0','#3a2a50',1.05,'#7a5a90','#b87ab8','#2a5a3a','#7a9a8a',.5],
[21.5].concat(N0.slice(1)),[24].concat(N0.slice(1))]
.map(function(r){return{h:r[0],c:[1,2,3,5,6,8,9,10,11].map(function(i){return C(r[i])}),n:[r[4],r[7],r[12]]}});
var ss=function(a,b,x){x=Math.min(1,Math.max(0,(x-a)/(b-a)));return x*x*(3-2*x)};
var S={top:C('#000'),hor:C('#000'),sun:C('#000'),hemiS:C('#000'),hemiG:C('#000'),fog:C('#000'),cloud:C('#000'),base:C('#000'),tip:C('#000'),
  sunI:1,hemiI:1,stars:0,day:1,lum:1,sunDir:new THREE.Vector3(),moonDir:new THREE.Vector3(),lightDir:new THREE.Vector3()};
var KEYS=['top','hor','sun','hemiS','hemiG','fog','cloud','base','tip'];
function compute(h){var i=0;while(i<RAW.length-2&&h>=RAW[i+1].h)i++;var a=RAW[i],b=RAW[i+1],f=ss(0,1,(h-a.h)/(b.h-a.h));
  KEYS.forEach(function(k,j){S[k].copy(a.c[j]).lerp(b.c[j],f)});
  S.sunI=a.n[0]+(b.n[0]-a.n[0])*f;S.hemiI=a.n[1]+(b.n[1]-a.n[1])*f;S.stars=a.n[2]+(b.n[2]-a.n[2])*f;
  S.day=ss(5.4,7.2,h)*(1-ss(18.2,19.8,h));S.lum=.5+.55*S.day;
  var p=Math.PI*(h-6)/12;S.sunDir.set(Math.cos(p)*.9,Math.sin(p)*.6+.03,-.55).normalize();
  S.moonDir.set(-Math.cos(p)*.9,-Math.sin(p)*.6+.03,-.55).normalize();
  var w=ss(.15,.5,S.day);S.lightDir.copy(S.moonDir).lerp(S.sunDir,w).normalize();S.lightDir.y=Math.max(.14,S.lightDir.y);S.lightDir.normalize()}
var nowH=function(){var d=new Date();return d.getHours()+d.getMinutes()/60+d.getSeconds()/3600};
var anim=null,L=[];
var T=K.time={mode:'live',hour:nowH(),target:null,S:S,
  set:function(h,dur){h=((h%24)+24)%24;var to=h;if(to<=T.hour)to+=24;anim={from:T.hour,to:to,t:0,dur:dur||(1.4+(to-T.hour)/24*2.2),live:false};T.mode='preset';T.target=h;emit()},
  live:function(){var to=nowH();if(to<=T.hour)to+=24;anim={from:T.hour,to:to,t:0,dur:1.4+(to-T.hour)/24*2.2,live:true};T.mode='live';emit()},
  onChange:function(f){L.push(f)},
  update:function(dt){if(anim){anim.t+=dt/anim.dur;var e=ss(0,1,anim.t);T.hour=(anim.from+(anim.to-anim.from)*e)%24;
      if(anim.t>=1){T.hour=anim.live?nowH():T.target;anim=null}}
    else if(T.mode==='live')T.hour=nowH();
    compute(T.hour)}};
function emit(){L.forEach(function(f){f(T)})}
compute(T.hour);
})();
