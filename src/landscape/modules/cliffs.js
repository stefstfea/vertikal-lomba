// Tebing latar hanya di sisi kiri/kanan untuk membingkai lembah; mesa tengah dihapus agar pegunungan tetap terlihat.
// 2 lapis tebing (z -470 & -458). Atur bentuk di MESAS_A/MESAS_B (c = pusat x, w = setengah lebar puncak, h = tinggi, sl = kemiringan sisi),
// air terjun di WF (x, tinggi atas/bawah, lebar atas/bawah). Warna ikut jam & berkabut (S.fog); menguning saat langit emas (K.portal.fx.gold).
(function(){var K=window.KAIH,X=K.ctx,scene=X.scene,ss=K.ss,LIN=function(h){return new THREE.Color(h).convertSRGBToLinear()};
var NOISE='float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}';
var MESAS_A=[{c:-430,w:90,h:250,sl:35},{c:-250,w:50,h:170,sl:30},{c:330,w:60,h:210,sl:30},{c:520,w:80,h:285,sl:36}];
var MESAS_B=[{c:-120,w:40,h:205,sl:30},{c:420,w:50,h:165,sl:28},{c:-330,w:45,h:150,sl:26}];
function prof(M,base,seed,x){var h=base+K.fbm(x*.01,seed)*50;M.forEach(function(m){var d=Math.abs(x-m.c),f=m.h*(1-ss(m.w,m.w+m.sl,d));if(f>4)f+=K.fbm(x*.04,m.c)*10;h=Math.max(h,f)});return h}
var VS='varying vec3 vP;varying float vT;attribute float aT;void main(){vP=position;vT=aT;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
var FS='uniform vec3 uFog,uR1,uR2,uTint;uniform float uLum,uMix,uTK;varying vec3 vP;varying float vT;'+NOISE+
'void main(){float st=sin(vP.y*.42+noise(vec2(vP.x*.03,vP.y*.06))*5.)*.5+.5;float er=noise(vec2(vP.x*.16,vP.y*.012));vec3 c=mix(uR1,uR2,st*.6+er*.5);c*=.72+.4*smoothstep(-50.,330.,vP.y);'+
'c=mix(c,vec3(.14,.34,.18),smoothstep(.955,.985,vT));c*=uLum;c=mix(c,uTint*(.6+.4*st),uTK);c=mix(c,uFog,uMix);gl_FragColor=vec4(c,1.);\n#include <encodings_fragment>\n}';
var mats=[];
function layer(M,base,seed,z,mix){var n=300,pos=[],tt=[],idx=[],i;for(i=0;i<=n;i++){var x=-900+1800*i/n,h=prof(M,base,seed,x);pos.push(x,h,z,x,-60,z);tt.push(1,0);if(i<n){var k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2)}}
  var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('aT',new THREE.Float32BufferAttribute(tt,1));g.setIndex(idx);
  var m=new THREE.ShaderMaterial({vertexShader:VS,fragmentShader:FS,side:THREE.DoubleSide,uniforms:{uFog:{value:new THREE.Color()},uR1:{value:LIN('#59607f')},uR2:{value:LIN('#8b8fb0')},uTint:{value:LIN('#ffcf5a')},uLum:{value:1},uMix:{value:mix},uTK:{value:0}}});
  var o=new THREE.Mesh(g,m);o.frustumCulled=false;scene.add(o);mats.push(m)}
layer(MESAS_A,60,7,-470,.6);layer(MESAS_B,40,9,-458,.5);
// ---------- air terjun ----------
var WF_V='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
WF_F='uniform float uTime;uniform vec3 uFog;varying vec2 vUv;'+NOISE+'void main(){float x=vUv.x,y=vUv.y;float edge=smoothstep(0.,.2,x)*smoothstep(0.,.2,1.-x);'+
'float s=noise(vec2(x*14.,y*2.2+uTime*1.6))*.6+noise(vec2(x*31.+3.,y*5.+uTime*2.6))*.4;float a=edge*(.55+.45*s)*smoothstep(1.,.94,y)*smoothstep(0.,.04,y);'+
'vec3 c=mix(vec3(.72,.9,1.),vec3(1.),s*.6);c=mix(c,uFog,.2);gl_FragColor=vec4(c,a*.9);\n#include <encodings_fragment>\n}';
var WF=[{x:-380,top:null,bot:125,wt:14,wb:20,M:MESAS_A,base:60,seed:7,z:-468}],wfs=[];
var mc=document.createElement('canvas');mc.width=mc.height=128;var mx=mc.getContext('2d'),mg=mx.createRadialGradient(64,64,0,64,64,64);mg.addColorStop(0,'rgba(255,255,255,.85)');mg.addColorStop(.5,'rgba(235,248,255,.35)');mg.addColorStop(1,'rgba(235,248,255,0)');mx.fillStyle=mg;mx.fillRect(0,0,128,128);var mt=new THREE.CanvasTexture(mc);
WF.forEach(function(w){var top=prof(w.M,w.base,w.seed,w.x)-6,u={uTime:{value:0},uFog:{value:new THREE.Color()}},g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute([w.x-w.wt/2,top,w.z,w.x+w.wt/2,top,w.z,w.x-w.wb/2,w.bot,w.z,w.x+w.wb/2,w.bot,w.z],3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,1,1,1,0,0,1,0],2));g.setIndex([0,2,1,1,2,3]);
  var m=new THREE.Mesh(g,new THREE.ShaderMaterial({uniforms:u,vertexShader:WF_V,fragmentShader:WF_F,transparent:true,depthWrite:false,side:THREE.DoubleSide}));m.frustumCulled=false;scene.add(m);
  var mist=new THREE.Sprite(new THREE.SpriteMaterial({map:mt,transparent:true,depthWrite:false,fog:false,opacity:.5}));mist.scale.set(w.wb*3.2,w.wb*1.6,1);mist.position.set(w.x,w.bot+w.wb*.3,w.z+1);scene.add(mist);wfs.push({u:u,mist:mist,w:w})});
K.hooks.push(function(dt,t){var S=K.time.S,fx=K.portal&&K.portal.fx,gd=fx?fx.gold:0;
  mats.forEach(function(m){var u=m.uniforms;u.uFog.value.copy(S.fog);u.uLum.value=S.lum;u.uTK.value=gd*.5});
  wfs.forEach(function(o,i){o.u.uTime.value=t;o.u.uFog.value.copy(S.fog);o.mist.material.opacity=(.4+.1*Math.sin(t*1.3+i))*(.45+.55*S.day);o.mist.material.color.copy(S.cloud)})});
})();
