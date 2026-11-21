// LANGIT MALAM BERPENDAR (hanya langit; TIDAK mengubah lighting/ambient): bulan dengan halo lembut, ±900 bintang berkelip, sinar bulan tipis.
// "Bloom" dibuat dari halo additive (bukan post-processing layar penuh) sehingga tidak menyilaukan. Muncul bertahap saat senja -> malam
// (mengikuti 1 - K.time.S.day). Setel: CFG. Arah bulan tetap sendiri (CFG.dir) agar selalu terlihat di kanan atas.
(function(){var K=window.KAIH,X=K.ctx,R=X.R,scene=X.scene,cam=X.cam,ss=K.ss,LIN=function(h){return new THREE.Color(h).convertSRGBToLinear()},r=Math.random,small=matchMedia('(max-width: 700px)').matches;
var CFG={dir:new THREE.Vector3(.25,.46,-.86).normalize(),stars:small?500:900,halo:.23,halo2:.055,rays:.035};
function glowTex(){var c=document.createElement('canvas');c.width=c.height=256;var x=c.getContext('2d'),g=x.createRadialGradient(128,128,0,128,128,128);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.2,'rgba(255,255,255,.5)');g.addColorStop(.5,'rgba(255,255,255,.14)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,256,256);return new THREE.CanvasTexture(c)}
function moonTex(){var c=document.createElement('canvas');c.width=c.height=512;var x=c.getContext('2d'),g=x.createRadialGradient(256,256,0,256,256,128);
  g.addColorStop(0,'rgb(255,252,238)');g.addColorStop(.9,'rgb(228,238,255)');g.addColorStop(1,'rgba(228,238,255,0)');x.fillStyle=g;x.beginPath();x.arc(256,256,128,0,6.3);x.fill();
  x.save();x.beginPath();x.arc(256,256,124,0,6.3);x.clip();
  for(var i=0;i<18;i++){var a=r()*6.28,d=Math.sqrt(r())*108,cx=256+Math.cos(a)*d,cy=256+Math.sin(a)*d,rad=8+r()*26,cg=x.createRadialGradient(cx,cy,0,cx,cy,rad);
    cg.addColorStop(0,'rgba(150,170,215,.30)');cg.addColorStop(1,'rgba(150,170,215,0)');x.fillStyle=cg;x.fillRect(cx-rad,cy-rad,rad*2,rad*2)}x.restore();
  var t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t}
var GT=glowTex(),moon=new THREE.Sprite(new THREE.SpriteMaterial({map:moonTex(),transparent:true,depthWrite:false,fog:false,opacity:0})),
  halo=new THREE.Sprite(new THREE.SpriteMaterial({map:GT,color:LIN('#9fd4ff'),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,opacity:0})),
  halo2=new THREE.Sprite(new THREE.SpriteMaterial({map:GT,color:LIN('#c9b8ff'),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,opacity:0}));
moon.scale.set(290,290,1);halo.scale.set(760,760,1);halo2.scale.set(1500,1500,1);[moon,halo,halo2].forEach(function(s,i){s.renderOrder=-7+i*.01;scene.add(s)});
var SN=CFG.stars,sp=new Float32Array(SN*3),sa=new Float32Array(SN*3),i;
for(i=0;i<SN;i++){var az=r()*6.2832,y=.07+.93*Math.pow(r(),.8),rd=Math.sqrt(1-y*y);sp[i*3]=Math.cos(az)*rd*950;sp[i*3+1]=y*950;sp[i*3+2]=Math.sin(az)*rd*950;sa[i*3]=r();sa[i*3+1]=r();sa[i*3+2]=r()}
var sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(sp,3));sg.setAttribute('aS',new THREE.BufferAttribute(sa,3));
var SU={uTime:{value:0},uVis:{value:0},uPx:{value:1}};
var stars=new THREE.Points(sg,new THREE.ShaderMaterial({uniforms:SU,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,
  vertexShader:'attribute vec3 aS;uniform float uTime,uPx;varying float vT;varying float vH;void main(){vec3 p=position+cameraPosition;float tw=.5+.5*sin(uTime*(.8+aS.x*2.2)+aS.y*60.);vT=.55+.45*tw;vH=aS.z;gl_PointSize=(1.5+aS.y*aS.y*3.4)*uPx*(.75+.4*tw);gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}',
  fragmentShader:'uniform float uVis;varying float vT;varying float vH;void main(){vec2 c=gl_PointCoord-.5;float rr=length(c)*2.;float a=exp(-rr*rr*4.5)*vT*uVis;vec3 col=mix(vec3(.8,.9,1.),vec3(1.,.9,.75),vH);gl_FragColor=vec4(col*1.2,a);\n#include <encodings_fragment>\n}'}));
stars.frustumCulled=false;stars.renderOrder=-8;scene.add(stars);
var RU={uTime:{value:0},uI:{value:0},uCol:{value:LIN('#bfe6ff')}};
var rays=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({uniforms:RU,transparent:true,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float uTime,uI;uniform vec3 uCol;varying vec2 vUv;void main(){vec2 p=(vUv-.5)*2.;float r=length(p),a=atan(p.y,p.x);'+
  'float s=pow(.5+.5*sin(a*19.+uTime*.04+sin(a*6.+uTime*.03)*1.5),4.)+.6*pow(.5+.5*sin(a*33.-uTime*.035+1.1+sin(a*11.+uTime*.05)*1.2),6.);s*=.55+.45*sin(a*4.-uTime*.05+r*2.);float fade=pow(1.-smoothstep(0.,.8,r),1.9);gl_FragColor=vec4(uCol*s*fade*uI,1.);\n#include <encodings_fragment>\n}'}));
rays.scale.setScalar(2000);rays.renderOrder=19;rays.frustumCulled=false;scene.add(rays);
K.hooks.push(function(dt,t){var S=K.time.S,vis=ss(.04,.96,1-S.day);
  moon.position.copy(cam.position).addScaledVector(CFG.dir,900);halo.position.copy(moon.position);halo2.position.copy(moon.position);
  moon.material.opacity=ss(.1,.8,vis);halo.material.opacity=CFG.halo*ss(.05,.8,vis)*(.92+.08*Math.sin(t*.5));halo2.material.opacity=CFG.halo2*ss(.05,.8,vis);
  stars.visible=vis>.01;SU.uTime.value=t;SU.uVis.value=Math.min(1,S.stars)*vis;SU.uPx.value=R.getPixelRatio();
  var on=vis>.05;rays.visible=on;if(on){rays.position.copy(cam.position).addScaledVector(CFG.dir,700);rays.lookAt(cam.position);RU.uTime.value=t;RU.uI.value=vis*CFG.rays}});
K.skyGlow={cfg:CFG};
})();
