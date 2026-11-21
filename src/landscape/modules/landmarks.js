// LANDMARK dunia bergaya Sky:
//  (1) puncak gunung jauh dengan PILAR CAHAYA (seperti gunung di foto referensi),
//  (2) PULAU MELAYANG berumput dengan lengkung batu kuno, kristal, bunga bercahaya, dan air terjun kecil,
//  (3) LINGKARAN BATU (trilithon) di puncak bukit tengah — seperti formasi Stonehenge di foto malam.
// Rune/kristal/bunga menyala lembut saat malam (mengikuti K.time.S.day). Setel: ISLANDS, PEAK.
(function(){var K=window.KAIH,X=K.ctx,scene=X.scene,LIN=function(h){return new THREE.Color(h).convertSRGBToLinear()},ss=K.ss,rr=function(a,b){return a+Math.random()*(b-a)};
var small=matchMedia('(max-width: 700px)').matches,NOISE='float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}';
function glowTex(){var c=document.createElement('canvas');c.width=c.height=128;var x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.3,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)}
var GT=glowTex(),glowMats=[],runeMats=[],crystalMats=[],flowerMats=[],bobs=[],wfU=[];

// =========================================================================================================
// (1) PUNCAK + PILAR CAHAYA
// =========================================================================================================
var PEAK={x:80,z:-300,top:135,base:-40,R:125};
(function(){var NA=34,NH=15,P=[],i,j,seed=3.7,L=new THREE.Vector3(-.5,.5,.65).normalize(),pos=[],col=[];
  for(j=0;j<=NH;j++){var t=j/NH;for(i=0;i<NA;i++){var a=i/NA*6.2832,rid=1+.3*Math.sin(a*5+seed)*(1-t)+.14*Math.sin(a*11+seed*2)*(1-t*.7),
      nz=(K.n2(Math.cos(a)*3+seed+t*2,Math.sin(a)*3+t*3)-.5)*.34,r=Math.max(2.4,PEAK.R*Math.pow(1-t,1.18)*(rid+nz));
    P.push(new THREE.Vector3(PEAK.x+Math.cos(a)*r,PEAK.base+(PEAK.top-PEAK.base)*t,PEAK.z+Math.sin(a)*r))}}
  function tri(a,b,c,t){var n=new THREE.Vector3().subVectors(b,a).cross(new THREE.Vector3().subVectors(c,a)).normalize(),
      out=new THREE.Vector3((a.x+b.x+c.x)/3-PEAK.x,0,(a.z+b.z+c.z)/3-PEAK.z);if(n.dot(out)<0)n.negate();
    var v=(.55+.55*Math.max(0,n.dot(L)))*(.82+.3*t)+(t>.74?(t-.74)*1.4:0);[a,b,c].forEach(function(p){pos.push(p.x,p.y,p.z);col.push(v,v,v*1.05)})}
  for(j=0;j<NH;j++)for(i=0;i<NA;i++){var i2=(i+1)%NA,A=P[j*NA+i],B=P[j*NA+i2],C=P[(j+1)*NA+i],D=P[(j+1)*NA+i2],t=(j+.5)/NH;tri(A,C,B,t);tri(B,C,D,t)}
  var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  var m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,fog:false,side:THREE.DoubleSide}));m.frustumCulled=false;scene.add(m);
  var base=LIN('#6f8fd6');
  K.hooks.push(function(){var S=K.time.S;m.material.color.copy(base).multiplyScalar(S.lum).lerp(S.fog,.5)})})();

// pilar cahaya: silinder transparan bergradasi (terang di tengah, lembut di tepi), nyala api di puncak, halo bercahaya
(function(){var U={uTime:{value:0},uI:{value:1},uCol:{value:new THREE.Color()}},H=230,
  m=new THREE.Mesh(new THREE.CylinderGeometry(1.7,5.2,H,20,1,true),new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:false,
  vertexShader:'varying vec2 vUv;varying float vE;void main(){vUv=uv;vec3 n=normalize(normalMatrix*normal);vec3 v=normalize(-(modelViewMatrix*vec4(position,1.)).xyz);vE=pow(abs(dot(n,v)),1.4);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float uTime,uI;uniform vec3 uCol;varying vec2 vUv;varying float vE;'+NOISE+
  'void main(){float y=vUv.y;float a=pow(1.-y,1.5)*smoothstep(0.,.03,1.-y)*vE;float f=.82+.18*noise(vec2(vUv.x*6.,y*14.-uTime*1.4));vec3 c=mix(uCol,vec3(1.,.95,.8),(1.-y)*.6);gl_FragColor=vec4(c*a*f*uI,a*f);\n#include <encodings_fragment>\n}'}));
  m.position.set(PEAK.x,PEAK.top+H/2-4,PEAK.z);m.frustumCulled=false;scene.add(m);
  function halo(sz,op,col){var s=new THREE.Sprite(new THREE.SpriteMaterial({map:GT,color:col,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,opacity:op}));s.scale.set(sz,sz,1);s.position.set(PEAK.x,PEAK.top+4,PEAK.z+2);scene.add(s);return s}
  var h1=halo(70,.8,LIN('#ffb45a')),h2=halo(210,.28,LIN('#ffd9a0'));
  K.hooks.push(function(dt,t){var S=K.time.S,n=1-S.day,gd=K.portal&&K.portal.fx?K.portal.fx.gold:0;
    U.uTime.value=t;U.uI.value=(.5+.15*n)*(.95+.05*Math.sin(t*1.7));U.uCol.value.copy(LIN('#ffb85e')).lerp(LIN('#ffe9b8'),n*.6);
    h1.material.opacity=(.55+.5*n)*(.9+.1*Math.sin(t*2.3));h2.material.opacity=(.18+.3*n)*(1-gd*.5)})})();

// =========================================================================================================
// (2) PULAU MELAYANG
// =========================================================================================================
var ISLANDS=[[64,24,-80,10,1,1],[-72,31,-98,13,1,0],[30,47,-142,17,1,1],[-26,41,-172,21,1,0],[112,21,-126,14,1,0],[-124,27,-134,15,0,1]];   // [x,y,z,ukuran,lengkung,air terjun]
if(small)ISLANDS.length=4;
var rockCol=[LIN('#5f8cb4'),LIN('#2c4768')],tmpC=new THREE.Color();
var stoneM=new THREE.MeshStandardMaterial({color:LIN('#93a3c4'),roughness:1,flatShading:true});
var grassM=new THREE.MeshStandardMaterial({color:LIN('#5fcf72'),roughness:1,emissive:new THREE.Color(0,0,0)});
var moundM=new THREE.MeshStandardMaterial({color:LIN('#8fe06c'),roughness:1});
var rockM=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true});
var runeM=new THREE.MeshBasicMaterial({color:LIN('#7ff1ff'),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:false});
var WF_F='uniform float uTime;uniform vec3 uFog;varying vec2 vUv;'+NOISE+'void main(){float x=vUv.x,y=vUv.y;float e=smoothstep(0.,.25,x)*smoothstep(0.,.25,1.-x);float s=noise(vec2(x*8.,y*3.-uTime*1.8))*.6+noise(vec2(x*19.,y*7.-uTime*2.9))*.4;'+
  'float a=e*(.5+.5*s)*smoothstep(0.,.45,y);vec3 c=mix(vec3(.75,.92,1.),vec3(1.),s*.5);gl_FragColor=vec4(mix(c,uFog,.25),a*.85);\n#include <encodings_fragment>\n}';
function mkIsland(o){var x=o[0],y=o[1],z=o[2],s=o[3],G=new THREE.Group(),i;
  // bagian bawah: kerucut terbalik bergerigi
  var rg=new THREE.ConeGeometry(1,1.7,11,4,true);rg.rotateX(Math.PI);rg.translate(0,-.85,0);var rp=rg.attributes.position,rc=new Float32Array(rp.count*3),c=new THREE.Color();
  for(i=0;i<rp.count;i++){var px=rp.getX(i),py=rp.getY(i),pz=rp.getZ(i),k=1+.2*(Math.sin(px*7.3+pz*5.1+x)*.5+Math.sin(py*9.1+px*3.7)*.5);
    if(py<-.01){rp.setXYZ(i,px*k,py*(.8+.35*Math.abs(Math.sin(px*5.7+pz*4.3+z))),pz*k)}
    c.copy(rockCol[0]).lerp(rockCol[1],ss(0,-1.7,py));rc[i*3]=c.r;rc[i*3+1]=c.g;rc[i*3+2]=c.b}
  rg.setAttribute('color',new THREE.BufferAttribute(rc,3));rg.computeVertexNormals();
  var rock=new THREE.Mesh(rg,rockM);rock.scale.set(s,s,s);G.add(rock);
  // permukaan rumput + gundukan kecil
  var top=new THREE.Mesh(new THREE.CylinderGeometry(1.03,.99,.15,22),grassM);top.scale.set(s,s,s);top.position.y=.02*s;top.receiveShadow=true;G.add(top);
  for(i=0;i<5;i++){var mo=new THREE.Mesh(new THREE.IcosahedronGeometry(.3,1),moundM),ang=i/5*6.28+rr(0,1),rad=rr(.25,.8);mo.scale.set(s*rr(.8,1.4),s*.2,s*rr(.8,1.3));mo.position.set(Math.cos(ang)*rad*s,.08*s,Math.sin(ang)*rad*s);G.add(mo)}
  // lengkung batu kuno + rune yang menyala malam hari
  if(o[4]){var pw=.12*s,ph=.74*s,L1=new THREE.Mesh(new THREE.BoxGeometry(pw,ph,pw*1.15),stoneM),L2=L1.clone(),Lt=new THREE.Mesh(new THREE.BoxGeometry(.8*s,.12*s,.19*s),stoneM);
    L1.position.set(-.3*s,ph/2+.08*s,0);L2.position.set(.3*s,ph/2+.08*s,0);Lt.position.set(0,ph+.14*s,0);[L1,L2,Lt].forEach(function(m){m.castShadow=true;G.add(m)});
    [-1,1].forEach(function(sd){var r=new THREE.Mesh(new THREE.PlaneGeometry(.035*s,.42*s),runeM);r.position.set(sd*(.3*s-pw/2-.002*s),ph*.55,0);r.rotation.y=sd*Math.PI/2;G.add(r)});
    var r2=new THREE.Mesh(new THREE.PlaneGeometry(.5*s,.03*s),runeM);r2.position.set(0,ph+.06*s,.1*s+.002*s);G.add(r2)}
  // kristal bercahaya
  for(i=0;i<3;i++){var cm=new THREE.MeshStandardMaterial({color:LIN(['#2f8aa6','#a35bb0','#b8862a'][i]),emissive:LIN(['#59e8ff','#ff8fe0','#ffc45a'][i]),emissiveIntensity:.5,roughness:.3,flatShading:true,transparent:true,opacity:.92});
    crystalMats.push(cm);var cr=new THREE.Mesh(new THREE.OctahedronGeometry(1),cm),a2=1+i*2.1+x;cr.scale.set(.05*s,.16*s*(1+i*.2),.05*s);cr.position.set(Math.cos(a2)*.72*s,.2*s,Math.sin(a2)*.72*s);cr.rotation.y=a2;G.add(cr)}
  // bunga kecil bercahaya (titik)
  var N=0,fp=new Float32Array(N*3),fc=new Float32Array(N*3),pal=['#ff9bd0','#ffe56a','#ffffff','#b9a4ff','#7ff1ff'];
  for(i=0;i<N;i++){var a3=rr(0,6.28),r3=Math.sqrt(Math.random())*.9;fp[i*3]=Math.cos(a3)*r3*s;fp[i*3+1]=.1*s;fp[i*3+2]=Math.sin(a3)*r3*s;var cc=LIN(pal[i%5]);fc[i*3]=cc.r;fc[i*3+1]=cc.g;fc[i*3+2]=cc.b}
  var fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.BufferAttribute(fp,3));fg.setAttribute('color',new THREE.BufferAttribute(fc,3));
  var fm=new THREE.PointsMaterial({size:.07*s,sizeAttenuation:true,vertexColors:true,transparent:true,depthWrite:false,fog:false});flowerMats.push(fm);G.add(new THREE.Points(fg,fm));
  // air terjun kecil dari tepi pulau
  if(o[5]){var wu={uTime:{value:0},uFog:{value:new THREE.Color()}},wg=new THREE.PlaneGeometry(.2*s,2.4*s),wm=new THREE.ShaderMaterial({uniforms:wu,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:WF_F,transparent:true,depthWrite:false,side:THREE.DoubleSide}),
      wf=new THREE.Mesh(wg,wm);wf.position.set(.5*s,-1.2*s+.02*s,.86*s);wf.rotation.y=.5;G.add(wf);wfU.push(wu)}
  G.position.set(x,y,z);G.userData={y:y,ph:rr(0,6.28),amp:.35+s*.02};scene.add(G);bobs.push(G)}
ISLANDS.forEach(mkIsland);

// =========================================================================================================
// (3) LINGKARAN BATU DI BUKIT TENGAH (Stonehenge)
// =========================================================================================================
(function(){var cx=0,cz=-94,R=10.5,ring=new THREE.Group(),hs=K.H(cx,cz);scene.add(ring);
  var pil=new THREE.BoxGeometry(1.5,6.4,1.5),lin=new THREE.BoxGeometry(5.6,1.3,1.8),sm=new THREE.MeshStandardMaterial({color:LIN('#7f93b8'),roughness:1,flatShading:true});
  for(var i=0;i<5;i++){var a=i/5*6.2832+.35,px=cx+Math.cos(a)*R,pz=cz+Math.sin(a)*R*.72,g=new THREE.Group(),h0=K.H(px,pz);
    var p1=new THREE.Mesh(pil,sm),p2=new THREE.Mesh(pil,sm),lt=new THREE.Mesh(lin,sm);p1.position.set(-2.1,3.2,0);p2.position.set(2.1,3.2,0);lt.position.set(0,6.9,0);
    [p1,p2,lt].forEach(function(m){m.castShadow=true;m.receiveShadow=true;g.add(m)});
    [-1,1].forEach(function(sd){var r=new THREE.Mesh(new THREE.PlaneGeometry(.22,3.2),runeM);r.position.set(sd*2.1,3.3,.76);g.add(r)});
    g.position.set(px,h0-.3,pz);g.rotation.y=-a+Math.PI/2+(Math.random()-.5)*.1;g.rotation.z=(Math.random()-.5)*.03;ring.add(g)}
  // batu berdiri tunggal di antara trilithon
  for(var j=0;j<4;j++){var a4=j*1.57+.9,bx=cx+Math.cos(a4)*(R*.45),bz=cz+Math.sin(a4)*R*.3,b=new THREE.Mesh(pil,sm);b.scale.set(.8,.5+j*.12,.8);b.position.set(bx,K.H(bx,bz)+1.6,bz);b.rotation.y=j;b.castShadow=true;ring.add(b)}})();

// ---------- animasi & warna ----------
var CRY=[.3,.5];
K.hooks.push(function(dt,t){var S=K.time.S,n=1-S.day,pulse=.78+.22*Math.sin(t*1.3);
  bobs.forEach(function(g,i){var u=g.userData;g.position.y=u.y+Math.sin(t*.45+u.ph)*u.amp;g.rotation.y=Math.sin(t*.1+u.ph)*.3;g.rotation.z=Math.sin(t*.3+u.ph)*.012});
  runeM.opacity=(.04+.2*n)*pulse;
  crystalMats.forEach(function(m,i){m.emissiveIntensity=CRY[0]+CRY[1]*n*(.85+.15*Math.sin(t*1.6+i*2))});
  flowerMats.forEach(function(m){m.opacity=.85+.15*n});
  
  wfU.forEach(function(u){u.uTime.value=t;u.uFog.value.copy(S.fog)})});
})();
