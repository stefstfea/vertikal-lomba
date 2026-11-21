// LAUTAN AWAN seperti di Sky: lantai awan bergelombang di bawah dataran (menutupi tanah yang turun), gumpalan awan
// kumulus yang melayang di antara bukit-bukit jauh, dan dinding awan besar di kiri/kanan lembah.
// Warna mengikuti jam (K.time.S.cloud / hor / fog). Malam: awan berwarna lavender-biru yang diterangi bulan.
// Setel: PUFFS / WALLS (jumlah), K.CLOUD_Y (tinggi permukaan awan, di terrain.js).
(function(){var K=window.KAIH,X=K.ctx,scene=X.scene,cam=X.cam,rr=function(a,b){return a+Math.random()*(b-a)},
  small=matchMedia('(max-width: 700px)').matches,Y=K.CLOUD_Y;
var NOISE='float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}'+
 'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p*=2.03;a*=.5;}return v;}';

// ---------- 1. lantai awan ----------
var U={uTime:{value:0},uLit:{value:new THREE.Color()},uShade:{value:new THREE.Color()},uFog:{value:new THREE.Color()},uCam:{value:new THREE.Vector3()}};
var floor=new THREE.Mesh(new THREE.PlaneGeometry(2600,1100),new THREE.ShaderMaterial({uniforms:U,
  vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:'uniform float uTime;uniform vec3 uLit,uShade,uFog,uCam;varying vec3 vW;'+NOISE+
  'void main(){vec2 p=vW.xz;float n=fbm(p*.011+vec2(uTime*.003,0.))*1.1+fbm(p*.036-vec2(uTime*.006,uTime*.002))*.45;float puff=smoothstep(.55,1.05,n);'+
  'vec3 col=mix(uShade,uLit,puff);gl_FragColor=vec4(col,1.);\n#include <encodings_fragment>\n}'}));
floor.rotation.x=-Math.PI/2;floor.position.set(0,Y,-240);floor.frustumCulled=false;scene.add(floor);

// ---------- 2. gumpalan awan (sprite) ----------
function rng(s){return function(){s|=0;s=s+0x6D2B79F5|0;var t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function disc(x,cx,cy,r,rgb,a0,a1,mid){var g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,'rgba('+rgb+','+a0+')');g.addColorStop(.55,'rgba('+rgb+','+mid+')');g.addColorStop(1,'rgba('+rgb+','+a1+')');x.fillStyle=g;x.beginPath();x.arc(cx,cy,r,0,6.3);x.fill()}
// awan menggunung: dasar rata & lembut, puncak bulat bertumpuk, sisi bawah berbayang biru-lavender
function puffTex(seed){var W=512,H=320,c=document.createElement('canvas');c.width=W;c.height=H;var x=c.getContext('2d'),R=rng(seed),base=H*.74,P=[],i,n=26;
  for(i=0;i<n;i++){var u=(i+.3+R()*.5)/n,dome=Math.sin(Math.PI*u),r=H*(.09+.2*dome*(.5+R()*.6));P.push([W*(.1+.8*u),base-r*.55-dome*H*.2*R(),r])}
  for(i=0;i<10;i++){var u2=.2+R()*.6,dm=Math.sin(Math.PI*u2),r2=H*(.12+.08*R())*(.6+.5*dm);P.push([W*(.1+.8*u2),base-H*(.22+.24*dm*R())-r2*.3,r2])}
  P.forEach(function(p){disc(x,p[0]+p[2]*.08,p[1]+p[2]*.3,p[2]*1.05,'150,160,215',.85,0,.55)});
  P.forEach(function(p){disc(x,p[0]-p[2]*.14,p[1]-p[2]*.26,p[2]*.95,'255,255,255',1,0,.95)});
  x.globalCompositeOperation='destination-out';var m=x.createLinearGradient(0,base-H*.05,0,base+H*.1);m.addColorStop(0,'rgba(0,0,0,0)');m.addColorStop(1,'rgba(0,0,0,1)');x.fillStyle=m;x.fillRect(0,base-H*.05,W,H);
  x.globalCompositeOperation='source-atop';var l=x.createLinearGradient(0,H*.25,0,base);l.addColorStop(0,'rgba(255,255,255,0)');l.addColorStop(1,'rgba(140,150,215,.5)');x.fillStyle=l;x.fillRect(0,0,W,H);
  var t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t}
var TX=[puffTex(101),puffTex(202),puffTex(303),puffTex(404),puffTex(505)],puffs=[],PUFFS=small?24:42,WALLS=small?2:3,i;
function add(x,y,z,w,op,b,h,v){var m=new THREE.SpriteMaterial({map:TX[puffs.length%TX.length],transparent:true,depthWrite:false,fog:false,opacity:op}),s=new THREE.Sprite(m);
  s.position.set(x,y,z);s.scale.set(w,w*.62,1);s.userData={b:b,h:h,v:v,xm:520};scene.add(s);puffs.push(s)}
// gumpalan di atas lautan awan, di sela bukit jauh
for(i=0;i<PUFFS;i++){var s1=Math.random()<.5?-1:1;add(s1*rr(285,455),Y+rr(-4,-1.5),rr(-85,-245),rr(65,145),rr(.16,.30),rr(.84,.96),.10,rr(.10,.28))}
// lapisan awan pinggir yang rendah dan transparan; tidak melintasi pusat lembah
for(i=0;i<WALLS;i++){var s2=i%2?-1:1;add(s2*rr(260,430),rr(0,10),rr(-75,-175),rr(90,165),rr(.18,.28),rr(.88,.98),.035,rr(.08,.20))}

var tmp=new THREE.Color();
K.hooks.push(function(dt,t){var S=K.time.S,n=1-S.day;
  U.uTime.value=t;U.uCam.value.copy(cam.position);
  // Lantai awan tanpa fog/depth haze: warna awan murni supaya lembah dan gunung tetap jelas.
  U.uLit.value.copy(S.cloud).multiplyScalar(.92+.18*n);U.uShade.value.copy(S.cloud).lerp(S.hor,.12).multiplyScalar(.78);U.uFog.value.copy(S.hor);
  for(var k=0;k<puffs.length;k++){var s=puffs[k],u=s.userData;s.material.color.copy(S.cloud).multiplyScalar(u.b*(1+.2*n)).lerp(S.hor,u.h);
    s.position.x+=u.v*dt;if(s.position.x>u.xm)s.position.x=-u.xm}});
})();
