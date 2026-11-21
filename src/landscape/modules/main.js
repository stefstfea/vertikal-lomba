// Menyatukan semua komponen: renderer, kamera diam, cahaya mengikuti waktu, loop animasi.
// Fase 3: debounce resize, pixel ratio clamp per device, deltaTime sudah diclamping di frame()
(function(){var K=window.KAIH,A=K.ARENA;
var canvas=document.getElementById('scene'),
  isSmall=window.matchMedia('(max-width: 700px)').matches||(window.KaihSettings&&KaihSettings.device==='phone'),
  // Fase 3: pixel ratio maks 2 desktop / 1.5 mobile – cegah GPU overdraw
  MAX_DPR=isSmall?1.5:2,
  R=new THREE.WebGLRenderer({canvas:canvas,antialias:true,powerPreference:'high-performance',stencil:false,depth:true});
// Fase 3: touch-action:none pada canvas agar pointer events tidak bentrok dengan scroll bawaan
canvas.style.touchAction='none';
R.outputEncoding=THREE.sRGBEncoding;R.physicallyCorrectLights=false;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=0.92;R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
var scene=new THREE.Scene();scene.fog=null; // Fog dinonaktifkan: awan dan pegunungan tetap jernih.
var cam=new THREE.PerspectiveCamera(58,1,.1,1600);
// KAMERA DIAM: agak tinggi, menatap landscape luas; benda jatuh di latar belakang, langit & awan di atasnya.
var CAMZ=8;cam.position.set(0,3.2,CAMZ);cam.lookAt(0,6,A.zc);
// pose kamera 'asli' (tampilan dashboard). Intro memulai dari langit lalu bergerak mulus ke pose ini.
K.camHome={pos:cam.position.clone(),quat:cam.quaternion.clone(),z:CAMZ};K.hooks=[];

var hemi=new THREE.HemisphereLight(0xffffff,0x888888,1),sun=new THREE.DirectionalLight(0xffffff,1);
sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.bias=-.0006;
Object.assign(sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:1,far:130});sun.target.position.set(0,0,A.zc);
scene.add(hemi,sun,sun.target);

var terrain=K.createTerrain(scene,R),sky=K.createSky(scene),rocks=K.createRocks(scene),phys=K.createPhysics(scene);

function layout(){var w=innerWidth,h=innerHeight,a=w/h;
  // Fase 3: pixel ratio dibatasi MAX_DPR (1.5 mobile, 2 desktop)
  var dpr=Math.min(window.devicePixelRatio||1,window.KaihSettings?KaihSettings.pixelRatio():MAX_DPR);
  R.setPixelRatio(dpr);
  R.setSize(w,h,false);
  var vf=Math.min(78,Math.max(58,2*Math.atan(Math.tan(35*Math.PI/180)/a)*180/Math.PI));cam.fov=vf;cam.aspect=a;cam.updateProjectionMatrix();
  // lebar arena mengikuti lebar layar di tepi depan arena (makin lebar layar, makin luas landscape-nya)
  var hf=2*Math.atan(Math.tan(vf*Math.PI/360)*a),half=Math.tan(hf/2)*(CAMZ-A.zmax),wx=Math.max(6,Math.min(26,half-2.5));
  var sr=Math.max(22,wx+6);Object.assign(sun.shadow.camera,{left:-sr,right:sr,top:sr,bottom:-sr});sun.shadow.camera.updateProjectionMatrix();
  rocks.setArena(wx);phys.setArena(wx)}
// Fase 3: debounce resize 120ms – stabil di orientasi flip mobile/tablet
var layoutTimer=0;
addEventListener('resize',function(){clearTimeout(layoutTimer);layoutTimer=setTimeout(layout,120)});
layout();

var clock=new THREE.Clock(),t=0;
function frame(){
  requestAnimationFrame(frame);
  // Fase 3: deltaTime diclamping 50ms – animasi tidak melompat saat tab tidak aktif
  var rdt=Math.min(clock.getDelta(),.05);K.realDt=rdt;var dt=rdt*(K.timeScale==null?1:K.timeScale);t+=dt;
  K.time.update(dt);var S=K.time.S;
  if(scene.fog&&scene.fog.color)scene.fog.color.copy(S.fog);hemi.color.copy(S.hemiS);hemi.groundColor.copy(S.hemiG);hemi.intensity=S.hemiI;
  sun.color.copy(S.sun);sun.intensity=S.sunI;sun.position.copy(sun.target.position).addScaledVector(S.lightDir,60);
  sky.update(S,t);terrain.update(S,t);K.r3f.tick(t,dt);for(var hi=0;hi<K.hooks.length;hi++)K.hooks[hi](dt,t);
  // Fase 3: Cannon.js fixed timestep 1/60 (max 3 substep) – fisika stabil di semua framerate
  phys.step(dt);
  R.render(scene,cam)}
K.ctx={R:R,scene:scene,cam:cam,canvas:canvas,phys:phys,hemi:hemi,sun:sun};
// Fase 3: cleanup WebGL – dipanggil saat berpindah layar (listener dari loader)
K.dispose=function(){
  try{
    R.setAnimationLoop(null);
    scene.traverse(function(obj){
      if(obj.geometry)obj.geometry.dispose();
      if(obj.material){var mats=Array.isArray(obj.material)?obj.material:[obj.material];
        mats.forEach(function(m){if(m.map)m.map.dispose();if(m.envMap)m.envMap.dispose();m.dispose()})}
    });
    R.dispose();
  }catch(e){console.warn('[7KAIH] dispose error',e)}
};
frame();setTimeout(function(){canvas.classList.add('ready')},50);
})();
