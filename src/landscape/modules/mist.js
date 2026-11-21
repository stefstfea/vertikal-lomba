// KABUT TIPIS (v10) di Ladang Langit: gumpalan kabut lembut yang melayang pelan DI BAWAH awan.
//  Lapis A: kabut tipis dekat tanah (1-3.5 di atas permukaan) menyebar di luar arena bola, di lembah, kaki bukit & kejauhan.
//  Lapis B: kabut lebar di bawah permukaan lautan awan (y -9..-5) yang tampak lewat celah awan & cekungan.
// Warna mengikuti jam (K.time.S.cloud). Arena bola (|x|<48, z -60..8) dijaga bersih supaya bola tetap jelas.
(function(){var K=window.KAIH,X=K.ctx,scene=X.scene,rr=function(a,b){return a+Math.random()*(b-a)},small=matchMedia('(max-width: 700px)').matches;
function soft(){var c=document.createElement('canvas');c.width=c.height=128;var g=c.getContext('2d'),r=g.createRadialGradient(64,64,0,64,64,64);
  r.addColorStop(0,'rgba(255,255,255,.95)');r.addColorStop(.35,'rgba(255,255,255,.5)');r.addColorStop(.7,'rgba(255,255,255,.12)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)}
var tex=soft(),N=small?80:150,list=[],i,ss=K.ss;
for(i=0;i<N;i++){var A=i<N*.62,x,z,y,size,tries=0;
  do{x=rr(-300,300);z=rr(-360,70);tries++}while(A&&Math.abs(x)<56&&z>-62&&z<10&&tries<20);
  if(A){y=Math.max(0,K.H(x,z))+rr(1,3.5);size=rr(28,64)}else{y=rr(-9,-5);size=rr(70,140)}
  var m=new THREE.SpriteMaterial({map:tex,color:0xffffff,transparent:true,opacity:0,depthWrite:false,fog:false}),sp=new THREE.Sprite(m);
  sp.scale.set(size,size*(A?.3:.26),1);sp.position.set(x,y,z);sp.renderOrder=2;scene.add(sp);
  list.push({sp:sp,m:m,A:A,vx:rr(.3,1.1)*(Math.random()<.5?-1:1),base:A?rr(.1,.17):rr(.14,.22),ph:rr(0,6.28)})}
var col=new THREE.Color(),white=new THREE.Color(1,1,1);
K.hooks.push(function(dt,t){var S=K.time.S,dayK=.6+.4*S.day;col.copy(S.cloud).lerp(white,.3);
  for(var j=0;j<list.length;j++){var o=list[j],p=o.sp.position;p.x+=o.vx*dt;if(p.x>300)p.x-=600;else if(p.x<-300)p.x+=600;
    var edge=1-ss(230,300,Math.abs(p.x)),arena=o.A&&p.z>-62&&p.z<10?ss(48,72,Math.abs(p.x)):1;
    o.m.opacity=o.base*dayK*edge*arena*(.8+.2*Math.sin(t*.25+o.ph));o.m.color.copy(col)}});
})();
