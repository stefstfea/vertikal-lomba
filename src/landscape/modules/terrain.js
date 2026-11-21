// DUNIA BARU bergaya Sky: Children of the Light — lembah padang bunga yang luas, bukit-bukit bulat berlumut, dataran yang
// turun ke lautan awan, dan pulau-pulau bukit di kejauhan. Versi lama (datar): terrain_flat_old.js
//
// Yang dipakai modul lain (API tetap sama):
//   K.ARENA  : area jatuhnya benda (tidak berubah)
//   K.H(x,z) : tinggi tanah. Dasar lembah SENGAJA hampir rata (±0.1) karena lantai fisika benda ada di y=0;
//              bukit-bukit dan tebing ada di tepi lembah & di kejauhan. K.isFlat(x,z) dipakai physics.js/drag.js.
//   K.n2, K.fbm, K.ss : fungsi noise (sky.js, cliffs.js, windmills.js memakainya — jangan diubah)
(function(){var K=window.KAIH=window.KAIH||{};
function h2(x,y){var s=Math.sin(x*127.1+y*311.7)*43758.5453;return s-Math.floor(s)}
function n2(x,y){var i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);
  return(h2(i,j)*(1-fx)+h2(i+1,j)*fx)*(1-fy)+(h2(i,j+1)*(1-fx)+h2(i+1,j+1)*fx)*fy}
function fbm(x,y){var a=.5,s=0;for(var i=0;i<4;i++){s+=a*n2(x,y);x*=2.03;y*=2.03;a*=.5}return s}
var ss=function(a,b,x){x=Math.min(1,Math.max(0,(x-a)/(b-a)));return x*x*(3-2*x)};
K.n2=n2;K.fbm=fbm;K.ss=ss;
// area jatuhnya benda (latar belakang): zmin..zmax = kedalaman, zc = pusat. Dipakai juga oleh physics.js dan rocks.js
K.ARENA={zmin:-42,zmax:-12,zc:-27};
// permukaan lautan awan (y). Tanah yang lebih rendah dari ini tertutup awan (cloudsea.js)
K.CLOUD_Y=-4.5;

// ---------------------------------------------------------------------------------------------------------
// BUKIT. [pusat x, pusat z, radius x, radius z, tinggi dasar, tinggi puncak, bentuk]
// bentuk (q): 0.5 = kubah bulat seperti batu raksasa berlumut di foto referensi; 0.8-1 = bukit landai.
// ---------------------------------------------------------------------------------------------------------
var MOUNDS=[
  // kubah bulat besar di kiri & kanan lembah (setengah terlihat di tepi layar, seperti kubah di foto referensi)
  [-31,-31,12.5,11,0,11.5,.5],[35,-41,14.5,12.5,0,13.5,.5],[-52,-58,19,16,0,19,.55],[58,-64,21,17,0,23,.55],
  // Lembah tengah tetap rendah dan terbuka; bukit tinggi hanya membingkai sisi agar pegunungan jauh terlihat.
  [-84,-104,30,24,0,13,.8],[84,-106,32,26,0,12,.8],
  [-122,-132,34,26,0,17,.85],[124,-138,36,28,0,18,.85]   // v10: dasar 0 (dulu -6/-10) karena belakang dunia sekarang berupa daratan, bukan jurang ke awan
];
// bukit-bukit jauh (pulau bukit di atas awan), disebar dengan seed tetap supaya hasilnya selalu sama.
// Di tengah (|x|<70) hanya yang rendah; yang tinggi ada di sisi kiri/kanan.
(function(){var s=20261102;function r(){s=(s*1664525+1013904223)>>>0;return s/4294967296}
  for(var i=0;i<18;i++){var side=r()<.5?-1:1,z=-150-r()*58,ax=i<5?30+r()*60:90+r()*230,x=side*ax,rx=20+r()*26,tp=ax<90?3+r()*8:4+r()*(8+ax*.08);
    MOUNDS.push([x,z,rx,rx*(.7+r()*.5),0,tp,.7+r()*.3])}})();
// v9: gundukan landai di DEPAN (z>3) dan di SAMPING lembah supaya permukaan tidak rata & banyak gundukan seperti foto referensi.
// Arena bola (z<=1, |x|<~44) tetap rata karena lantai fisika ada di y=0; gundukan dekat tengah dibuat rendah supaya tidak menutupi pemandangan.
(function(){var s=20261104;function r(){s=(s*1664525+1013904223)>>>0;return s/4294967296}
  for(var i=0;i<46;i++){var rz=6+r()*11,rx=9+r()*16,z=3+rz+Math.pow(r(),1.3)*58,x=(r()*2-1)*115,cw=Math.abs(x)<24?.4:1,tp=(1.4+r()*5.6)*cw;MOUNDS.push([x,z,rx,rz,0,tp,.75+r()*.25])}
  for(i=0;i<14;i++){var sd=r()<.5?-1:1,rx2=8+r()*8,x2=sd*(44+rx2+r()*40),z2=-50+r()*70,rz2=8+r()*10;MOUNDS.push([x2,z2,rx2,rz2,0,2.5+r()*4.5,.75+r()*.25])}})();
// v10: belakang dunia DIISI TERRAIN (dulu tanah turun ke -24 lalu habis di z=-235 -> terlihat kosong/bolong dari atas): bukit-bukit landai sampai z=-780.
(function(){var s=20261105;function r(){s=(s*1664525+1013904223)>>>0;return s/4294967296}
  for(var i=0;i<34;i++){var rx=24+r()*34;MOUNDS.push([(r()*2-1)*430,-230-r()*540,rx,rx*(.7+r()*.6),0,3+r()*11,.75+r()*.25])}})();
K.MOUNDS=MOUNDS;

function moundH(m,x,z){var dx=(x-m[0])/m[2];if(dx>1||dx<-1)return-1e9;var dz=(z-m[1])/m[3];if(dz>1||dz<-1)return-1e9;
  var d2=dx*dx+dz*dz;if(d2>=1)return-1e9;
  // sedikit riak di tepi supaya tidak terlalu sempurna bulatnya
  var p=Math.pow(1-d2,m[6]);return m[4]+(m[5]-m[4])*p*(.94+.12*n2(x*.05+m[0],z*.05))}

function floorH(x,z){return(n2(x*.045+5,z*.045)-.5)*.16-.03}   // riak halus lantai lembah: -0.11 .. +0.05

K.H=function(x,z){
  var d=Math.hypot(x/54,(z<-30?(z+30)/50:(z+30)/130)),   // v9: lembah memanjang ke depan sampai z=+74 (1 = tepi lembah)
      wall=ss(.8,1.45,d),                       // 0 di dalam lembah -> 1 di luar
      far=ss(58,125,-z),                        // makin jauh, tanah turun ke lautan awan
      side=ss(135,235,Math.abs(x)),
      fall=Math.max(far,side);
  var roll=fbm(x*.017+3,z*.017+1)*22+ss(.8,1.8,d)*5;   // lereng bergulung di luar lembah
  var bump=(fbm(x*.035+7,z*.035+3)-.5)*3*ss(2,24,z);   // v9: permukaan bergelombang di depan (0 di arena)
  var land=floorH(x,z)+bump+wall*roll,farH=2.5+(fbm(x*.014+11,z*.014+5)-.5)*16,h=land+(farH-land)*fall;   // v10: makin jauh tanah menjadi dataran bergelombang (-5..+10), bukan jurang ke awan
  for(var i=0;i<MOUNDS.length;i++){var v=moundH(MOUNDS[i],x,z);if(v>h)h=v}
  return h};
// true bila tanah di titik ini cukup rata untuk tempat benda mendarat / diseret
K.isFlat=function(x,z){return K.H(x,z)<.22};

var LIN=function(h){return new THREE.Color(h).convertSRGBToLinear()};

// tekstur halus: bercak lembut + goresan rumput + titik bunga kecil warna-warni (1 gambar kecil yang diulang)
function groundTex(R){var c=document.createElement('canvas');c.width=c.height=256;var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,256,256);
  var i,a;for(i=0;i<46;i++){var cx=Math.random()*256,cy=Math.random()*256,r=14+Math.random()*30,g=x.createRadialGradient(cx,cy,0,cx,cy,r);
    a=Math.random()<.5?'0,40,60,':'255,255,255,';g.addColorStop(0,'rgba('+a+'.07)');g.addColorStop(1,'rgba('+a+'0)');x.fillStyle=g;x.fillRect(cx-r,cy-r,r*2,r*2)}
  x.lineWidth=1.4;x.lineCap='round';for(i=0;i<900;i++){var px=Math.random()*256,py=Math.random()*256,l=3+Math.random()*5;
    x.strokeStyle=Math.random()<.55?'rgba(0,30,50,.09)':'rgba(255,255,200,.14)';x.beginPath();x.moveTo(px,py);x.lineTo(px+(Math.random()-.5)*2,py-l);x.stroke()}
  var dots=['rgba(255,150,200,.55)','rgba(255,230,110,.6)','rgba(255,255,255,.55)','rgba(200,170,255,.5)'];
  for(i=0;i<0;i++){x.fillStyle=dots[i%4];x.beginPath();x.arc(Math.random()*256,Math.random()*256,1.3+Math.random()*1.2,0,6.3);x.fill()}
  var t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;
  t.anisotropy=Math.min(4,R&&R.capabilities?R.capabilities.getMaxAnisotropy():1);return t}

K.createTerrain=function(scene,R){
  // --- jala titik tidak seragam: rapat di dekat kamera & tengah, jarang di kejauhan (±34 ribu titik, 1 mesh) ---
  var NX=260,NZ=320,XM=900,Z0=100,Z1=-780,   // v10: terrain sampai z=-780 & x=±900   // v9: terrain diperluas ke depan (Z0 30 -> 100)
      nv=(NX+1)*(NZ+1),pos=new Float32Array(nv*3),uv=new Float32Array(nv*2),i,j,k=0;
  for(j=0;j<=NZ;j++){var z=Z0+(Z1-Z0)*Math.pow(j/NZ,1.55);
    for(i=0;i<=NX;i++){var u=i/NX*2-1,x=(u<0?-1:1)*Math.pow(Math.abs(u),1.8)*XM,h=K.H(x,z);
      pos[k*3]=x;pos[k*3+1]=h;pos[k*3+2]=z;uv[k*2]=x/7;uv[k*2+1]=z/7;k++}}
  var idx=new (nv>65535?Uint32Array:Uint16Array)(NX*NZ*6),q=0;
  for(j=0;j<NZ;j++)for(i=0;i<NX;i++){var a=j*(NX+1)+i,b=a+1,c=a+NX+1,d=c+1;idx[q++]=a;idx[q++]=b;idx[q++]=c;idx[q++]=b;idx[q++]=d;idx[q++]=c}
  var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setIndex(new THREE.BufferAttribute(idx,1));
  g.computeVertexNormals();
  // --- warna: hijau toska -> hijau muda -> kuning di puncak; lereng curam makin biru-toska (seperti sisi bayangan bukit di Sky) ---
  var nrm=g.attributes.normal,cols=new Float32Array(nv*3),
      g0=LIN('#69b957'),g1=LIN('#78c75f'),g2=LIN('#8bd36c'),g3=LIN('#9bd87a'),sh=LIN('#559c70'),dp=LIN('#4e9290'),hz=LIN('#a9c9e8'),c3=new THREE.Color();
  for(i=0;i<nv;i++){var X=pos[i*3],H=pos[i*3+1],Z=pos[i*3+2],n1=fbm(X*.05,Z*.05),nn=fbm(X*.18+9,Z*.18),sl=1-nrm.getY(i);
    c3.copy(g0).lerp(g1,n1*.9+.1).lerp(g2,ss(.45,.8,nn)*.55).lerp(g3,ss(2,26,H)*.35);
    c3.lerp(sh,ss(.1,.5,sl)*.85).lerp(dp,ss(.45,.85,sl)*.7);
    c3.lerp(hz,ss(-1.5,-14,H));
    cols[i*3]=c3.r;cols[i*3+1]=c3.g;cols[i*3+2]=c3.b}
  g.setAttribute('color',new THREE.BufferAttribute(cols,3));
  var map=groundTex(R),mat=new THREE.MeshStandardMaterial({vertexColors:true,map:map,roughness:1,emissive:new THREE.Color(0,0,0)});
  var ground=new THREE.Mesh(g,mat);ground.receiveShadow=true;ground.frustumCulled=false;scene.add(ground);
  K.terrain={mesh:ground,mat:mat};
  // flora (bunga, rumput, kristal) ada di flowers.js, grass.js, rocks.js; awan di cloudsea.js; pulau & puncak cahaya di landmarks.js
  return{update:function(S,t){var n=1-S.day;   // malam: sedikit cahaya sendiri berwarna biru-nila supaya bayangan tidak pernah hitam pekat
    }}};
})();
