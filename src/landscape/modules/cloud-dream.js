// KULIT AWAN (v6) untuk cutscene easter egg bola Tidur: seluruh landscape berubah menjadi awan menggembung, lalu kembali normal.
// Memakai ulang geometri terrain (K.terrain.mesh) sebagai mesh kedua dengan shader: tiap titik digeser mengikuti normal (menggelembung
// seperti kumulus) di dalam lingkaran yang meluas dari titik asal. API: K.cloudDream.set(x, z, radius)  (radius 0 = sembunyi).
// Warna mengikuti jam (K.time.S.cloud / hor / lightDir) seperti lautan awan di cloudsea.js.
(function(){var K=window.KAIH,X=K.ctx,scene=X.scene;
if(!K.terrain||!K.terrain.mesh){console.warn('[7 KAIH] cloud-dream: terrain belum tersedia');K.cloudDream={set:function(){}};return}
var NOISE='float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}'+
 'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p*=2.03;a*=.5;}return v;}';
var U={uTime:{value:0},uO:{value:new THREE.Vector2(0,-27)},uR:{value:0},uEdge:{value:34},uLift:{value:2.3},uBump:{value:2.6},
  uLit:{value:new THREE.Color()},uShade:{value:new THREE.Color()},uSun:{value:new THREE.Vector3(0,1,0)}};
var mat=new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:true,
  vertexShader:'uniform float uTime,uR,uEdge,uLift,uBump;uniform vec2 uO;varying vec3 vW;varying vec3 vN;varying float vM;varying float vL;'+NOISE+
   'void main(){vec3 p=position;float d=distance(p.xz,uO);float m=1.-smoothstep(uR-uEdge,uR,d);'+
   'float n=fbm(p.xz*.16+vec2(uTime*.05,0.))*.65+fbm(p.xz*.43-vec2(0.,uTime*.07))*.35;float l=smoothstep(.25,.85,n);'+
   'float zf=mix(.25,1.,1.-smoothstep(-14.,4.,p.z));p+=normal*m*(uLift+uBump*l)*zf;vM=m;vL=l;vW=(modelMatrix*vec4(p,1.)).xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.);}',
  fragmentShader:'uniform vec3 uLit,uShade,uSun;varying vec3 vW;varying vec3 vN;varying float vM;varying float vL;'+
   'void main(){if(vM<.01)discard;float lam=dot(normalize(vN),normalize(uSun))*.5+.5;float tone=clamp(.2+.5*lam+.55*vL,0.,1.);'+
   'vec3 col=mix(uShade,uLit,smoothstep(.12,.95,tone));gl_FragColor=vec4(col,smoothstep(0.,.2,vM));\n#include <encodings_fragment>\n}'});
var mesh=new THREE.Mesh(K.terrain.mesh.geometry,mat);mesh.frustumCulled=false;mesh.renderOrder=3;mesh.visible=false;scene.add(mesh);
K.hooks.push(function(dt,t){if(!mesh.visible)return;var S=K.time.S,n=1-S.day;U.uTime.value=t;
  U.uLit.value.copy(S.cloud).multiplyScalar(.98+.14*n);U.uShade.value.copy(S.cloud).lerp(S.hor,.15).multiplyScalar(.72);U.uSun.value.copy(S.lightDir)});
K.cloudDream={set:function(x,z,r){U.uO.value.set(x,z);U.uR.value=r;mesh.visible=r>.5}};
})();
