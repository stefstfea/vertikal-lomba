// Efek partikel (GPU, 1 draw call, ~200 titik, gerakan dihitung di shader): debu bercahaya yang naik pelan, kelopak bunga tertiup angin,
// dan kunang-kunang ajaib yang mengitari area tengah (lebih terang saat senja/malam). Jumlah: MOTES / PETALS / FLIES.
(function(){var K=window.KAIH,X=K.ctx,scene=X.scene,cam=X.cam,MOTES=90,PETALS=55,FLIES=55,N=MOTES+PETALS+FLIES,pos=new Float32Array(N*3),at=new Float32Array(N*4),i,r=Math.random;
for(i=0;i<N;i++){var T=i<MOTES?0:i<MOTES+PETALS?1:2,o=i*3;
  if(T<2){pos[o]=(r()*2-1)*34;pos[o+1]=r()*13;pos[o+2]=-62+r()*68}else{pos[o]=5+r()*15;pos[o+1]=r()*3.2;pos[o+2]=0}   // kunang-kunang: x = jari-jari orbit, y = tinggi
  at[i*4]=T;at[i*4+1]=r();at[i*4+2]=T===0?.22+r()*.3:T===1?.34+r()*.2:.3+r()*.2;at[i*4+3]=r()}
var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('aA',new THREE.BufferAttribute(at,4));
var U={uTime:{value:0},uScale:{value:600},uDay:{value:1}};
var VS='attribute vec4 aA;uniform float uTime,uScale,uDay;varying vec4 vV;\n'+
'void main(){float T=aA.x,ph=aA.y,sp=aA.w;vec3 p=position;vec3 col;float al,ang=0.;\n'+
'if(T<.5){p.y=.5+mod(position.y+uTime*(.25+sp*.25),13.);p.x+=sin(uTime*.2+ph*6.28)*1.8;p.z+=cos(uTime*.17+ph*6.28)*1.5;col=mix(vec3(1.,.93,.7),vec3(.7,.9,1.),1.-uDay);al=.35+.4*(1.-uDay)+.25*sin(uTime*.8+ph*20.);}\n'+
'else if(T<1.5){p.x=-36.+mod(position.x+36.+uTime*(2.4+sp*1.6),72.);p.y=.8+mod(position.y-uTime*(.55+sp*.4),13.)+sin(uTime*2.+ph*10.)*.35;p.z+=sin(uTime*1.3+ph*9.)*.9;col=mix(vec3(1.,.62,.8),vec3(.8,.7,1.),sp);al=.3+.6*uDay;ang=ph*6.28+uTime*(1.+sp*2.);}\n'+
'else{float a=ph*6.283+uTime*(.12+sp*.18)*(ph>.5?1.:-1.);p=vec3(cos(a)*position.x,1.2+position.y+sin(uTime*.6+ph*20.)*.7,-27.+sin(a)*position.x*.55);col=vec3(.7,1.,.5);al=(.3+.7*(1.-uDay))*pow(.5+.5*sin(uTime*(1.2+sp*2.)+ph*40.),2.);}\n'+
'vec4 mv=viewMatrix*vec4(p,1.);gl_PointSize=aA.z*uScale/max(.1,-mv.z);gl_Position=projectionMatrix*mv;vV=vec4(al,ang,T,0.);vC=col;}';
VS=VS.replace('varying vec4 vV;','varying vec4 vV;varying vec3 vC;');
var FS='varying vec4 vV;varying vec3 vC;void main(){vec2 c=gl_PointCoord-.5;float a;\n'+
'if(vV.z<.5){a=smoothstep(.5,0.,length(c));a*=a;}\n'+
'else if(vV.z<1.5){float ca=cos(vV.y),sa=sin(vV.y);vec2 q=vec2(c.x*ca-c.y*sa,c.x*sa+c.y*ca);a=smoothstep(1.,.6,length(q*vec2(1.,2.6))*2.)*.9;}\n'+
'else{float r=length(c)*2.;a=exp(-r*r*7.)+.25*exp(-r*2.5);}\n'+
'gl_FragColor=vec4(vC,a*vV.x);}';
var pts=new THREE.Points(g,new THREE.ShaderMaterial({uniforms:U,vertexShader:VS,fragmentShader:FS,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
pts.frustumCulled=false;scene.add(pts);
K.hooks.push(function(dt,t){U.uTime.value=t;U.uDay.value=K.time.S.day;U.uScale.value=X.canvas.height/(2*Math.tan(cam.fov*Math.PI/360))});
})();
