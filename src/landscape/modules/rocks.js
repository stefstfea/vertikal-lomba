// Flora kristal bercahaya yang membingkai landscape: gugus kristal (cyan/emas/violet) di kiri/kanan/belakang + bunga kristal kecil. TANPA jamur
// (versi dengan jamur: js/rocks_mushroom_old.js). Pengganti batuan gelap lama (js/rocks_old.js) dan bola bunga warna-warni (js/terrain_old.js).
// Menyala makin terang saat senja/malam (mengikuti KAIH.time.S.day). API sama dengan versi lama: K.createRocks(scene) -> {setArena(wx)}.
// Fase 3: shared geometry & shared material untuk InstancedMesh – mengurangi draw call & VRAM
(function(){var K=window.KAIH=window.KAIH||{};
var LIN=function(h){return new THREE.Color(h).convertSRGBToLinear()},rr=function(a,b){return a+Math.random()*(b-a)};
var PAL=[['#59e8ff','#0f6f8c'],['#ffc45a','#8a4f12'],['#a58cff','#40308a']];   // [warna cahaya, warna badan]
// Fase 3: glowTex di-cache – satu tekstur dipakai semua sprite halo
var _glowTex=null;
function glowTex(){if(_glowTex)return _glowTex;var c=document.createElement('canvas');c.width=c.height=128;var x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,255,255,.4)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);_glowTex=new THREE.CanvasTexture(c);return _glowTex}
// susunan (posisi) sama dengan versi batu lama: sisi kiri/kanan [keluar,naik,posisi 0..1,-,tinggi], belakang [melintang,mundur,-,tinggi], depan [melintang,maju,ukuran]
var SIDE=[[0,.08,5.5],[1.2,.24,4],[.4,.4,5.2],[2,.58,3.8],[.8,.76,6],[2.2,.93,4],[4.5,.15,8.5],[5.5,.5,6.2],[7.5,.82,11],[10,.3,16],[12,.7,13]];
var BACK=[[-.92,2,4.6],[-.62,5,6.5],[-.3,1.5,3.4],[.05,6,7.5],[.3,2,3.6],[.6,5,5.8],[.9,1.5,5]];
var FRONT=[[-.85,1.4,1.5],[-.5,3.2,.9],[-.15,1.2,1.1],[.3,2.8,.8],[.62,1.5,1.4],[.92,3.4,1]];
// Fase 3: shared geometry untuk OctahedronGeometry kristal (1 instance per ukuran)
var _octGeo=null;function octGeo(){if(!_octGeo)_octGeo=new THREE.OctahedronGeometry(1);return _octGeo}
K.createRocks=function(scene){var A=K.ARENA,items=[],GT=glowTex(),n=0,i,m4=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(),ps=new THREE.Vector3();
  var M=PAL.map(function(p){var c=LIN(p[0]),b=LIN(p[1]);return{
    cap:new THREE.MeshStandardMaterial({color:b,emissive:c,emissiveIntensity:1,roughness:.6,flatShading:true}),
    cry:new THREE.MeshStandardMaterial({color:b,emissive:c,emissiveIntensity:1,roughness:.25,metalness:.1,transparent:true,opacity:.88,flatShading:true}),
    halo:new THREE.SpriteMaterial({map:GT,color:c,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,opacity:.4})}});
  // Fase 3: stemM shared – satu material batang untuk seluruh InstancedMesh scatter
  var stemM=new THREE.MeshStandardMaterial({color:LIN('#d9cdf5'),emissive:LIN('#6a5aa8'),emissiveIntensity:.25,roughness:.8});
  function crystals(p,s){var g=new THREE.Group(),k=4+(Math.random()*3|0),h=new THREE.Sprite(M[p].halo);
    for(var j=0;j<k;j++){var l=s*(j?rr(.35,.8):1),m=new THREE.Mesh(octGeo(),M[p].cry),a=j/k*6.28+rr(0,1);
      m.scale.set(.2*s*rr(.8,1.2),l*.55,.2*s*rr(.8,1.2));m.position.set(j?Math.cos(a)*s*.22:0,l*.55-.1,j?Math.sin(a)*s*.22:0);
      m.rotation.set(j?Math.sin(a)*.3:0,a,j?Math.cos(a)*.3:0);g.add(m)}
    h.scale.setScalar(s*2.6);h.position.y=s*.5;g.add(h);return g}
  function add(k,m,p){scene.add(m);items.push({k:k,m:m,p:p})}

  // --- bunga kristal kecil (batang + kristal + aura) dan jamur kecil, masing-masing 3 draw call ---
  // Fase 3: shared stemG & headG geometry untuk scatter InstancedMesh
  function scatter(N,stemG,headG,headMat,hmin,hmax,cap){
    var st=new THREE.InstancedMesh(stemG,new THREE.MeshLambertMaterial({color:LIN('#2f8f78')}),N),hd=new THREE.InstancedMesh(headG,headMat,N),
        au=new THREE.InstancedMesh(new THREE.SphereGeometry(.2,8,6),new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.3}),N);
    for(var j=0;j<N;j++){var z=6-90*Math.pow(Math.random(),1.2),x=(Math.random()*2-1)*(22+(6-z)*.55),h=rr(hmin,hmax),k=rr(.8,1.4),c=LIN(PAL[j%3][0]);
      ps.set(x,K.H(x,z)+.02,z);sc.set(1,h,1);m4.compose(ps,q,sc);st.setMatrixAt(j,m4);
      ps.y+=h*cap;sc.setScalar(k);m4.compose(ps,q,sc);hd.setMatrixAt(j,m4);hd.setColorAt(j,c);
      sc.setScalar(k*2.6);m4.compose(ps,q,sc);au.setMatrixAt(j,m4);au.setColorAt(j,c)}
    scene.add(st,hd,au);return{hd:hd,au:au}}
  var fl=scatter(0,new THREE.CylinderGeometry(.02,.035,1,5).translate(0,.5,0),octGeo().clone().scale(1,1.7,1),new THREE.MeshBasicMaterial(),.5,1.4,1);
  function update(dt,t){var S=K.time.S,nt=1-S.day;
    M.forEach(function(m,j){m.cap.emissiveIntensity=m.cry.emissiveIntensity=.35+1.9*nt+.15*Math.sin(t*1.5+j*1.7);m.halo.opacity=.16+.5*nt});
    [fl].forEach(function(o){o.hd.material.color.setScalar(.8+.4*nt);o.au.material.opacity=.12+.34*nt+.04*Math.sin(t*2)})}
  K.hooks.push(update);
  return{setArena:function(wx){items.forEach(function(it){var p=it.p,x,z=p.z;
    if(it.k==='s')x=p.s*(wx+p.d);else if(it.k==='b')x=p.u*(wx+8);else x=p.u*(wx+1);
    it.m.position.set(x,p.y+K.H(x,z),z)})}}};
})();
