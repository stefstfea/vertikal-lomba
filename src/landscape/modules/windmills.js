// Kincir angin (windmill) di punggung gunung latar belakang; bilah berputar pelan, warna berkabut mengikuti jam seperti gunung (perspektif atmosfer).
// Letak mengikuti rumus punggung gunung di sky.js (lapisan z -215 & -280). Atur: LAY (jumlah n, ukuran S, batas lebar lim).
(function(){var K=window.KAIH,X=K.ctx,scene=X.scene,LIN=function(h){return new THREE.Color(h).convertSRGBToLinear()};
var LAY=[{z:-215,a:40,f:.0095,s:4,lim:215,n:4,sep:95,S:6,mix:.22},{z:-280,a:64,f:.0072,s:3,lim:285,n:2,sep:170,S:8,mix:.38}];
function ridge(l,x){var q=K.fbm(x*l.f+l.s*9,l.s);return Math.pow(1-Math.abs(2*q-1),1.5)*l.a+K.fbm(x*.03,l.s)*l.a*.18}
var BASE={tower:LIN('#e8dcc8'),roof:LIN('#d9763c'),blade:LIN('#f4ecdc'),beam:LIN('#7a5a3a')},ALL=[];
function build(m){var g=new THREE.Group(),tw=new THREE.Mesh(new THREE.CylinderGeometry(.7,1.05,3,10),m.tower),rf=new THREE.Mesh(new THREE.ConeGeometry(1.05,1.2,10),m.roof),
  hub=new THREE.Mesh(new THREE.BoxGeometry(.3,.3,.5),m.beam),rotor=new THREE.Group();tw.position.y=1.5;rf.position.y=3.6;hub.position.set(0,2.8,.85);rotor.position.set(0,2.8,1.1);
  for(var i=0;i<4;i++){var arm=new THREE.Group(),b=new THREE.Mesh(new THREE.BoxGeometry(.5,2.6,.05),m.blade),sp=new THREE.Mesh(new THREE.BoxGeometry(.08,2.7,.08),m.beam);
    b.position.set(.28,1.6,0);sp.position.set(0,1.45,0);arm.add(b,sp);arm.rotation.z=i*Math.PI/2;rotor.add(arm)}
  g.add(tw,rf,hub,rotor);return{g:g,rotor:rotor}}
LAY.forEach(function(l){var m={};for(var k in BASE)m[k]=new THREE.MeshBasicMaterial({color:BASE[k]});ALL.push({l:l,m:m,w:[]});
  var pk=[],x;for(x=-l.lim;x<=l.lim;x+=6){var h=ridge(l,x);if(h>ridge(l,x-6)&&h>ridge(l,x+6))pk.push({x:x,h:h})}
  pk.sort(function(a,b){return b.h-a.h});var ch=[];pk.forEach(function(p){if(ch.length<l.n&&ch.every(function(c){return Math.abs(c.x-p.x)>l.sep}))ch.push(p)});
  ch.forEach(function(p,i){var w=build(m);w.g.scale.setScalar(l.S*(.9+Math.random()*.25));w.g.position.set(p.x,p.h-2,l.z+.5);w.rotor.rotation.z=Math.random()*6.28;w.sp=.3+Math.random()*.15;scene.add(w.g);ALL[ALL.length-1].w.push(w)})});
K.hooks.push(function(dt){var S=K.time.S;ALL.forEach(function(a){for(var k in BASE)a.m[k].color.copy(BASE[k]).multiplyScalar(S.lum).lerp(S.fog,a.l.mix);a.w.forEach(function(w){w.rotor.rotation.z-=dt*w.sp})})});
})();
