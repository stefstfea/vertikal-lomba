// Burung hitam yang terbang melintas: 4 kawanan formasi V, ~22 ekor, 1 draw call. Gerak & kepakan dihitung di shader (GPU), kadang meluncur.
// Atur kawanan di FLOCKS: n = jumlah, z = kedalaman, y = ketinggian, sp = kecepatan (negatif = terbang ke kiri).
(function(){var K=window.KAIH,X=K.ctx,scene=X.scene,FLOCKS=[{n:7,z:-85,y:36,sp:11},{n:5,z:-130,y:52,sp:-9},{n:6,z:-60,y:24,sp:13},{n:4,z:-170,y:70,sp:-7.5}],r=Math.random;
var A=[],B=[];FLOCKS.forEach(function(f){var x0=r()*1120,sg=f.sp>0?1:-1;for(var i=0;i<f.n;i++){var row=Math.ceil(i/2),side=i%2?1:-1;
  A.push(i?-row*3.6*sg:0,i?-row*.5+r()*.6:0,i?side*row*2.7:0,r());B.push(x0,f.sp*(.92+r()*.16),f.y,f.z)}});
var N=A.length/4,pos=new Float32Array([.5,0,0,-.15,0,-1.25,-.45,0,0, .5,0,0,-.45,0,0,-.15,0,1.25]),g=new THREE.InstancedBufferGeometry();
g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('aA',new THREE.InstancedBufferAttribute(new Float32Array(A),4));g.setAttribute('aB',new THREE.InstancedBufferAttribute(new Float32Array(B),4));g.instanceCount=N;
var U={uTime:{value:0},uFog:{value:new THREE.Color()},uSize:{value:1.8}};
var VS='attribute vec4 aA,aB;uniform float uTime,uSize;varying float vD;void main(){vec3 p=position;p.x*=sign(aB.y);'+
'float fl=sin(uTime*(7.+aA.w*3.)+aA.w*30.)*(.5+.5*sin(uTime*.6+aA.w*9.));p.y+=fl*abs(position.z)*.55;p*=uSize;'+
'float x=mod(aB.x+uTime*aB.y+560.,1120.)-560.;p+=vec3(x+aA.x,aB.z+aA.y+sin(uTime*.5+aA.w*6.)*1.5,aB.w+aA.z);'+
'vec4 mv=viewMatrix*vec4(p,1.);vD=-mv.z;gl_Position=projectionMatrix*mv;}';
var FS='uniform vec3 uFog;varying float vD;void main(){vec3 c=mix(vec3(.02,.02,.035),uFog,smoothstep(150.,420.,vD)*.85);gl_FragColor=vec4(c,1.);\n#include <encodings_fragment>\n}';
var m=new THREE.Mesh(g,new THREE.ShaderMaterial({uniforms:U,vertexShader:VS,fragmentShader:FS,side:THREE.DoubleSide}));m.frustumCulled=false;scene.add(m);
K.hooks.push(function(dt,t){U.uTime.value=t;U.uFog.value.copy(K.time.S.fog)});
})();
