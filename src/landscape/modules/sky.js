// Langit (gradasi, bintang, matahari, bulan), awan kumulus berlapis, dan pegunungan berlapis dengan perspektif atmosfer.
(function(){var K=window.KAIH=window.KAIH||{};
var VS='varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
var FS='uniform vec3 uTop;uniform vec3 uHor;uniform vec3 uSun;uniform vec3 uMoon;uniform vec3 uSunC;uniform float uStars;uniform float uDay;uniform float uTime;varying vec3 vD;\n'+
'float hh(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}\n'+
'float star(vec3 d,float s){vec3 p=d*s,i=floor(p),f=fract(p)-.5;float h=hh(i);vec3 o=(vec3(hh(i+1.7),hh(i+3.1),hh(i+5.3))-.5)*.6;return step(.985,h)*(1.-smoothstep(0.,.28,length(f-o)))*(.6+.4*sin(uTime*(1.5+h*3.)+h*40.));}\n'+
'void main(){vec3 d=normalize(vD);float y=d.y;vec3 c=mix(uHor,uTop,pow(clamp(y,0.,1.),.55));c=mix(c,uHor*.55,1.-smoothstep(-.4,0.,y));\n'+
'float sd=max(dot(d,uSun),0.);c+=uSunC*(pow(sd,6.)*.28+pow(sd,80.)*.8)*uDay;c+=uSunC*smoothstep(.9991,.9995,dot(d,uSun))*3.*uDay;\n'+
'float md=dot(d,uMoon);c+=vec3(.85,.92,1.)*(smoothstep(.9975,.9979,md)*1.5+pow(max(md,0.),40.)*.22)*(1.-uDay)*step(0.,d.y+.05);\n'+
'if(uStars>.01){c+=(star(d,70.)+star(d,150.)*.7)*uStars*smoothstep(0.,.3,y)*1.6;}gl_FragColor=vec4(c,1.);\n#include <encodings_fragment>\n}';

function rng(s){return function(){s|=0;s=s+0x6D2B79F5|0;var t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function tex(c){var t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t}
function disc(x,cx,cy,r,rgb,a0,a1,mid){var g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,'rgba('+rgb+','+a0+')');g.addColorStop(.55,'rgba('+rgb+','+mid+')');g.addColorStop(1,'rgba('+rgb+','+a1+')');x.fillStyle=g;x.beginPath();x.arc(cx,cy,r,0,6.3);x.fill()}
// awan kumulus: dasar rata, puncak membulat, sisi bawah berbayang biru keabuan
function cumulus(seed){var W=512,H=256,c=document.createElement('canvas');c.width=W;c.height=H;var x=c.getContext('2d'),R=rng(seed),base=H*.74,P=[],i,n=24;
  for(i=0;i<n;i++){var u=(i+.3+R()*.5)/n,dome=Math.sin(Math.PI*u),r=H*(.07+.17*dome*(.55+R()*.6));P.push([W*(.1+.8*u),base-r*.62-dome*H*.16*R(),r])}
  for(i=0;i<9;i++){var u2=.22+R()*.56,dm=Math.sin(Math.PI*u2),r2=H*(.1+.07*R())*(.6+.5*dm);P.push([W*(.1+.8*u2),base-H*(.2+.2*dm*R())-r2*.3,r2])}
  P.forEach(function(p){disc(x,p[0]+p[2]*.08,p[1]+p[2]*.28,p[2]*1.05,'150,160,205',.85,0,.55)});
  P.forEach(function(p){disc(x,p[0]-p[2]*.14,p[1]-p[2]*.26,p[2]*.95,'255,255,255',1,0,.95)});
  x.globalCompositeOperation='destination-out';var m=x.createLinearGradient(0,base-H*.03,0,base+H*.07);m.addColorStop(0,'rgba(0,0,0,0)');m.addColorStop(1,'rgba(0,0,0,1)');x.fillStyle=m;x.fillRect(0,base-H*.03,W,H);
  x.globalCompositeOperation='source-atop';var l=x.createLinearGradient(0,H*.3,0,base);l.addColorStop(0,'rgba(255,255,255,0)');l.addColorStop(1,'rgba(140,150,205,.5)');x.fillStyle=l;x.fillRect(0,0,W,H);
  return tex(c)}
// awan tipis memanjang di ketinggian (cirrus)
function wisp(seed){var W=512,H=128,c=document.createElement('canvas');c.width=W;c.height=H;var x=c.getContext('2d'),R=rng(seed);
  for(var i=0;i<16;i++){var cx=W*(.12+.76*R()),cy=H*(.3+.4*R()),rx=Math.min(60+R()*110,cx*.95,(W-cx)*.95),ry=5+R()*9;
    x.save();x.translate(cx,cy);x.rotate((R()-.5)*.1);x.scale(1,ry/rx);disc(x,0,0,rx,'255,255,255',.55,0,.28);x.restore()}
  return tex(c)}

K.createSky=function(scene){
  var U={uTop:{value:new THREE.Color()},uHor:{value:new THREE.Color()},uSun:{value:new THREE.Vector3()},uMoon:{value:new THREE.Vector3()},uSunC:{value:new THREE.Color()},uStars:{value:0},uDay:{value:1},uTime:{value:0}};
  var dome=new THREE.Mesh(new THREE.SphereGeometry(1000,32,16),new THREE.ShaderMaterial({uniforms:U,vertexShader:VS,fragmentShader:FS,side:THREE.BackSide,depthWrite:false,fog:false}));dome.renderOrder=-10;dome.frustumCulled=false;scene.add(dome);

  // awan: 4 lapisan kedalaman (ditempatkan menurut sudut pandang kamera: azimut & elevasi), melayang pelan
  var CT=[cumulus(11),cumulus(23),cumulus(37),cumulus(53)],WT=[wisp(5),wisp(9)],clouds=[],D2R=Math.PI/180;
  var rr=function(a,b){return a+Math.random()*(b-a)};
  function layer(n,tx,d0,d1,e0,e1,w0,w1,op,haze,spd,b0){
    for(var i=0;i<n;i++){var d=rr(d0,d1),az=((i+.5)/n*2-1)*65*D2R+rr(-.5,.5)*(130*D2R/n),el=rr(e0,e1)*D2R,w=rr(w0,w1),
        m=new THREE.SpriteMaterial({map:tx[i%tx.length],transparent:true,depthWrite:false,fog:false,opacity:op}),sp=new THREE.Sprite(m);
      sp.position.set(Math.tan(az)*d,Math.tan(el)*d,-d);sp.scale.set(w,w*(tx===WT?.25:.5),1);
      sp.userData={v:spd*d*rr(.7,1.3),b:b0+Math.random()*(1-b0),h:haze,xm:d*2.05+w*.5};scene.add(sp);clouds.push(sp)}}
  layer(5,WT,600,660,24,36,700,1000,.5,.1,.0007,.9);      // awan tipis di ketinggian
  layer(10,CT,560,680,3.5,10,380,560,.96,.35,.0010,.85);  // deretan awan jauh di balik gunung
  layer(8,CT,300,380,11,24,200,300,.96,.15,.0018,.88);    // awan menengah
  layer(4,CT,130,180,22,34,90,140,.95,0,.0030,.92);       // awan dekat yang besar

  // pegunungan: 4 lapis, makin jauh makin tinggi dan makin berkabut
  var L=[{z:-430,a:125,f:.0042,mix:.74,c:'#5a6fb5',s:1},{z:-350,a:92,f:.0055,mix:.56,c:'#4a7fa8',s:2},{z:-280,a:64,f:.0072,mix:.38,c:'#3f8a8a',s:3},{z:-215,a:40,f:.0095,mix:.22,c:'#3d8a55',s:4}],mts=[];
  L.forEach(function(l){var n=160,pos=[],col=[],idx=[],hs=[];
    for(var i=0;i<=n;i++){var x=-800+1600*i/n,q=K.fbm(x*l.f+l.s*9,l.s),h=Math.pow(1-Math.abs(2*q-1),1.5)*l.a+K.fbm(x*.03,l.s)*l.a*.18;hs.push(h)}
    for(i=0;i<=n;i++){var x2=-800+1600*i/n,h=hs[i],sl=(hs[Math.max(0,i-1)]-hs[Math.min(n,i+1)])*.02,snow=h>l.a*.6?1:0,sh=Math.min(1.1,Math.max(.62,.88+sl));
      pos.push(x2,h,l.z,x2,-40,l.z);var t=snow?1:.82*sh,b=.55;col.push(t,t,snow?1.02:t*1.05,b,b,b*1.05);if(i<n){var k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2)}}
    var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);
    var m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,fog:false,side:THREE.DoubleSide}));m.userData={base:new THREE.Color(l.c).convertSRGBToLinear(),mix:l.mix};scene.add(m);mts.push(m)});

  var lastT=0;
  return{update:function(S,t){U.uTop.value.copy(S.top);U.uHor.value.copy(S.hor);U.uSun.value.copy(S.sunDir);U.uMoon.value.copy(S.moonDir);U.uSunC.value.copy(S.sun);U.uStars.value=S.stars;U.uDay.value=S.day;U.uTime.value=t;
    var dt=Math.min(.1,Math.max(0,t-lastT));lastT=t;clouds.forEach(function(s){var u=s.userData;s.material.color.copy(S.cloud).multiplyScalar(u.b).lerp(S.hor,u.h);s.position.x+=u.v*dt;if(s.position.x>u.xm)s.position.x=-u.xm});
    mts.forEach(function(m){m.material.color.copy(m.userData.base).multiplyScalar(S.lum).lerp(S.fog,m.userData.mix)})}}};
})();
