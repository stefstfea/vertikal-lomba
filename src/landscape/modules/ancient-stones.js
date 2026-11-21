// Formasi batu besar dan lingkaran batu kuno terinspirasi monumen megalitik.
// Mesh sederhana, berbagi material, tanpa tekstur berat; tidak menggantikan objek lain.
(function(){
  var K=window.KAIH, scene=K.ctx.scene;
  var LIN=function(h){return new THREE.Color(h).convertSRGBToLinear()};
  var stoneMat=new THREE.MeshStandardMaterial({color:LIN('#687d78'),roughness:1,metalness:0,flatShading:true});
  var capMat=new THREE.MeshStandardMaterial({color:LIN('#81968b'),roughness:1,flatShading:true});
  var mossMat=new THREE.MeshStandardMaterial({color:LIN('#3f765c'),roughness:1,flatShading:true});
  var geo=new THREE.IcosahedronGeometry(1,1);
  // Siluet batu raksasa di kiri dan kanan seperti pulau batu berlumut.
  var boulders=[
    [-20, -48, 8.5, 7.2, 6.5],[-15.5,-58,6.2,5.2,5.5],[-23,-66,7.4,8,6.8],
    [20,-52,8.2,7.6,6.5],[16,-64,6.4,5.8,5.6],[24,-72,8,8.8,7.2],
    [-31,-94,10,10,8],[31,-98,11,9,8.5]
  ];
  boulders.forEach(function(a,i){
    var m=new THREE.Mesh(geo,i%3===0?capMat:stoneMat);m.position.set(a[0],K.H(a[0],a[1])+a[3]*.52,a[1]);
    m.scale.set(a[2],a[3],a[4]);m.rotation.set((i%3)*.13,i*.71,(i%4)*.08);m.castShadow=false;m.receiveShadow=true;scene.add(m);
    // lapisan lumut kecil di sisi atas, satu mesh sederhana per gugus
    if(i%2===0){var moss=new THREE.Mesh(geo,mossMat);moss.position.set(a[0]-.2,K.H(a[0],a[1])+a[3]*.91,a[1]-.3);moss.scale.set(a[2]*.72,.55,a[4]*.7);moss.rotation.y=i*.6;scene.add(moss)}
  });
  // Lingkaran batu bergaya Stonehenge di tengah-jauh: 7 pilar + 3 batu lintel.
  var ring=new THREE.Group();scene.add(ring);
  var pillarGeo=new THREE.BoxGeometry(1,1,1), lintelGeo=new THREE.BoxGeometry(1,1,1);
  var count=7,radius=5.8,baseZ=-31;
  for(var i=0;i<count;i++){
    var a=i*Math.PI*2/count, x=Math.cos(a)*radius, z=baseZ+Math.sin(a)*radius*.55;
    var h=3.5+(i%3)*.42,w=.9+(i%2)*.16;
    var p=new THREE.Mesh(pillarGeo,stoneMat);p.position.set(x,K.H(x,z)+h*.5,z);p.scale.set(w,h,.9);p.rotation.z=(i%3-1)*.035;p.rotation.y=-a*.18;p.castShadow=false;p.receiveShadow=true;ring.add(p);
  }
  // Batu mendatar menghubungkan beberapa pilar; sengaja tidak membentuk cincin tertutup sempurna.
  for(var j=0;j<3;j++){
    var a=j*Math.PI*2/3, x=Math.cos(a)*radius, z=baseZ+Math.sin(a)*radius*.55;
    var lx=-Math.sin(a)*radius*.8,lz=Math.cos(a)*radius*.44;
    var y=K.H(x,z)+3.85;
    var lintel=new THREE.Mesh(lintelGeo,capMat);lintel.position.set(x,y,z);lintel.scale.set(5.1,.72,1.05);lintel.rotation.y=a;lintel.rotation.z=.025*(j-1);lintel.castShadow=false;ring.add(lintel);
  }
  // Batu-batu kecil di kaki monumen, menambah kesan alami tanpa banyak poligon.
  for(var k=0;k<5;k++){
    var a=k*1.26,x=Math.cos(a)*8.1,z=baseZ+Math.sin(a)*4.8;
    var m=new THREE.Mesh(geo,stoneMat);m.position.set(x,K.H(x,z)+.55,z);m.scale.set(1.2,.7,1);m.rotation.y=a;ring.add(m);
  }
})();
