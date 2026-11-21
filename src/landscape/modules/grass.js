// Rumput bergaya (stylized grass shader): ribuan helai (1 draw call, GPU instancing) yang bergoyang tertiup angin,
// gradasi warna dari pangkal ke ujung (hijau -> keemasan), mengikuti jam (K.time.S.base/tip) + kabut. ~7% helai lebih tinggi & bercahaya (ilalang bercahaya).
(function(){var K=window.KAIH,X=K.ctx,scene=X.scene,LIN=function(h){return new THREE.Color(h).convertSRGBToLinear()};
var N=3200,off=new Float32Array(N*3),sd=new Float32Array(N*4),i;
for(i=0;i<N;i++){var z=5.5-84*Math.pow(Math.random(),1.35),x=(Math.random()*2-1)*(16+(5.5-z)*.75),far=1+Math.max(0,5.5-z)*.012,glow=Math.random()<.07;
  off[i*3]=x;off[i*3+1]=K.H(x,z);off[i*3+2]=z;
  sd[i*4]=Math.random()*3.1416;sd[i*4+1]=(.09+Math.random()*.09)*far*(glow?1.25+Math.random()*.22:1);sd[i*4+2]=(.09+Math.random()*.04)*far;sd[i*4+3]=glow?1:0}
var pg=new THREE.PlaneGeometry(1,1,1,3),g=new THREE.InstancedBufferGeometry();g.index=pg.index;g.setAttribute('position',pg.attributes.position);g.setAttribute('uv',pg.attributes.uv);
g.setAttribute('aOff',new THREE.InstancedBufferAttribute(off,3));g.setAttribute('aS',new THREE.InstancedBufferAttribute(sd,4));g.instanceCount=N;
var VS='attribute vec3 aOff;attribute vec4 aS;uniform float uTime;varying float vY,vG,vR,vD;\n'+
'void main(){float y=uv.y,h=aS.y,tp=1.,lx=(uv.x-.5)*aS.z*tp;vec3 p=vec3(aOff.x+cos(aS.x)*lx,aOff.y+y*h,aOff.z+sin(aS.x)*lx);\n'+
// angin: gelombang pelan + riak cepat + hembusan yang bergerak melintasi padang
'float w=sin(uTime*1.25+aOff.x*.11+aOff.z*.07)*.55+sin(uTime*2.1+aOff.x*.33+aOff.z*.2)*.2+sin(aOff.x*.045-uTime*.8+aOff.z*.03)*.45;float b=y*y*h*.42;\n'+
'p.x+=w*b;p.z+=w*b*.35+sin(uTime*1.7+aOff.x)*b*.06;p.y-=abs(w)*b*.18;\n'+
'vec4 mv=viewMatrix*vec4(p,1.);vY=y;vG=aS.w;vR=fract(aS.x*7.31+aOff.x);vD=-mv.z;gl_Position=projectionMatrix*mv;}';
var FS='uniform vec3 uBase,uTip,uGlow,uFog,uSun;uniform float uLum,uNight,uNear,uFar,uTime;varying float vY,vG,vR,vD;\n'+
'void main(){vec3 c=mix(uBase*.8,uTip,smoothstep(0.,1.,vY));c=mix(c,c*vec3(1.1,1.05,.8)+uSun*.06,vR*.5);c*=uLum*(.7+.3*vY);\n'+
'float gl=vG*smoothstep(.3,1.,vY);c=mix(c,uGlow*(.9+.7*uNight)*(.85+.15*sin(uTime*2.+vR*30.)),gl*(.28+.32*uNight));\n'+
'c=mix(c,uFog,smoothstep(uNear,uFar,vD));gl_FragColor=vec4(c,1.);\n#include <encodings_fragment>\n}';
var U={uTime:{value:0},uBase:{value:new THREE.Color()},uTip:{value:new THREE.Color()},uGlow:{value:LIN('#7af6ff')},uFog:{value:new THREE.Color()},uSun:{value:new THREE.Color()},uLum:{value:1},uNight:{value:0},uNear:{value:70},uFar:{value:420}};
var mesh=new THREE.Mesh(g,new THREE.ShaderMaterial({uniforms:U,vertexShader:VS,fragmentShader:FS,side:THREE.DoubleSide}));mesh.frustumCulled=false;scene.add(mesh);
var GOLD=LIN('#ffd45a'),LAV=LIN('#b9a4ff'),CYAN=LIN('#7af6ff');
K.hooks.push(function(dt,t){var S=K.time.S,warm=Math.min(1,Math.max(0,(1-S.sunI/3.4)*1.6))*S.day;   // warm: tinggi saat golden hour
  U.uTime.value=t;U.uBase.value.copy(S.base);U.uTip.value.copy(S.tip).lerp(GOLD,.25+.4*warm);U.uFog.value.copy(S.fog);U.uSun.value.copy(S.sun);
  U.uLum.value=.55+.6*S.day;U.uNight.value=1-S.day;U.uGlow.value.copy(LAV).lerp(CYAN,S.day)});
})();
