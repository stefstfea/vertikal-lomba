// Atmosfer: (1) pita kabut cakrawala + cahaya hangat di sisi matahari (kubah tambahan di atas langit lama),
// (2) kabut kedalaman berlapis (cyan siang -> lavender senja -> nila malam) di dasar tiap lapis pegunungan,
// (3) sinar matahari volumetrik (god rays) yang menembus sela awan & pegunungan. Semua mengikuti jam lewat K.time.S.
(function(){var K=window.KAIH,X=K.ctx,scene=X.scene,cam=X.cam,LIN=function(h){return new THREE.Color(h).convertSRGBToLinear()},ss=K.ss;
// ---------- 1. kubah kabut cakrawala ----------
var HU={uHaze:{value:new THREE.Color()},uSunC:{value:new THREE.Color()},uSun:{value:new THREE.Vector3()},uDay:{value:1},uWarm:{value:0}};
var dome=new THREE.Mesh(new THREE.SphereGeometry(990,32,16),new THREE.ShaderMaterial({uniforms:HU,side:THREE.BackSide,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,
  vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 uHaze,uSunC,uSun;uniform float uDay,uWarm;varying vec3 vD;void main(){vec3 d=normalize(vD);float y=d.y;'+
  'float band=exp(-pow(max(y,0.)*7.5,1.1))*smoothstep(-.25,0.,y)*.5;float sd=max(dot(d,uSun),0.);float warm=pow(sd,3.)*exp(-max(y,0.)*3.5);'+
  'vec3 c=uHaze*band+uSunC*warm*.4*uWarm+uHaze*.05*smoothstep(0.,.6,y)*(1.-uDay*.6);gl_FragColor=vec4(c,1.);}'}));
dome.renderOrder=-9;dome.frustumCulled=false;dome.visible=false;scene.add(dome); // kabut cakrawala dinonaktifkan
// ---------- 2. kabut kedalaman ----------
var fc=document.createElement('canvas');fc.width=4;fc.height=128;var fx=fc.getContext('2d'),fg=fx.createLinearGradient(0,0,0,128);
fg.addColorStop(0,'rgba(255,255,255,0)');fg.addColorStop(.35,'rgba(255,255,255,.35)');fg.addColorStop(.64,'rgba(255,255,255,.9)');fg.addColorStop(1,'rgba(255,255,255,1)');fx.fillStyle=fg;fx.fillRect(0,0,4,128);
var ftex=new THREE.CanvasTexture(fc),FOG=[[-425,.5],[-345,.5],[-275,.5],[-210,.45],[-150,.32]].map(function(r){   // tepat di depan tiap lapis gunung (z -430,-350,-280,-215)
  var m=new THREE.Mesh(new THREE.PlaneGeometry(1800,110),new THREE.MeshBasicMaterial({map:ftex,transparent:true,depthWrite:false,fog:false,opacity:r[1]}));
  m.position.set(0,15,r[0]);m.visible=false;scene.add(m);return{m:m,o:0}});
var C_GOLD=LIN('#ffcf5a'),C_DAY=LIN('#a6ecff'),C_DUSK=LIN('#b9a4ff'),C_NIGHT=LIN('#3a3f86'),haze=new THREE.Color();
// ---------- 3. god rays ----------
var RU={uTime:{value:0},uI:{value:0},uCol:{value:new THREE.Color()}};
var rays=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({uniforms:RU,transparent:true,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float uTime,uI;uniform vec3 uCol;varying vec2 vUv;void main(){vec2 p=(vUv-.5)*2.;float r=length(p),a=atan(p.y,p.x);'+
  'float s=pow(.5+.5*sin(a*23.+uTime*.05+sin(a*7.+uTime*.03)*1.6),5.)+.7*pow(.5+.5*sin(a*41.-uTime*.04+1.3+sin(a*13.+uTime*.07)*1.2),7.)+.5*pow(.5+.5*sin(a*11.+uTime*.03+2.),3.);'+
  's*=.55+.45*sin(a*5.-uTime*.06+r*2.);float fade=pow(1.-smoothstep(0.,.85,r),1.8);gl_FragColor=vec4(uCol*s*fade*uI*.26,1.);}'}));
rays.scale.setScalar(2000);rays.renderOrder=20;rays.frustumCulled=false;scene.add(rays);
var tc=new THREE.Color(),WHITE=new THREE.Color(1,1,1);
K.hooks.push(function(dt,t){var S=K.time.S,e=S.sunDir.y,d=S.day;
  // 1
  haze.copy(C_NIGHT).lerp(C_DUSK,ss(0,.5,d)).lerp(C_DAY,ss(.55,1,d)).lerp(S.fog,.2);var gd=K.portal&&K.portal.fx?K.portal.fx.gold:0;if(gd>.001)haze.lerp(C_GOLD,gd*.8);
  HU.uHaze.value.copy(haze);HU.uSunC.value.copy(S.sun);HU.uSun.value.copy(S.sunDir);HU.uDay.value=d;HU.uWarm.value=((1-ss(.05,.65,e))*.85+.15)*ss(0,.15,d);
  // 2
  FOG.forEach(function(f){f.m.material.color.copy(haze);f.m.material.opacity=f.o*(.55+.45*d)});
  // 3: bidang sinar mengikuti arah matahari (selalu menghadap kamera)
  var on=false;rays.visible=on;if(!on)return; // sinar siang dinonaktifkan agar tidak mengaburkan awan
  rays.position.copy(cam.position).addScaledVector(S.sunDir,700);rays.lookAt(cam.position);
  tc.copy(S.sun).lerp(WHITE,.35).convertLinearToSRGB();RU.uCol.value.copy(tc);RU.uTime.value=t;
  RU.uI.value=d*(.055+.11*(1-ss(.08,.6,e)))*(.96+.04*Math.sin(t*.4))*(1-gd*.7)});
})();
