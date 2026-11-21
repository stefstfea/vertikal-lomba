// Lighting & color grading untuk dunia Landscape 7 KAIH.
// File terpisah supaya intensitas, warna ambient, exposure, dan softness mudah diubah.
(function(){
  'use strict';
  var K=window.KAIH;
  if(!K || !K.ctx || !window.THREE) return;
  var X=K.ctx, R=X.R, scene=X.scene;
  var CFG={
    exposure:0.92,
    ambientBoost:0.06,
    ambientSky:'#8faeea',
    ambientGround:'#4e629b',
    sunWarm:'#b9d9ff',
    sunBoost:0.78,
    fogTint:'#273c78',
    fogBlend:0.0,
    shadowBias:-0.00045
  };
  // Filmic tonemapping mempertahankan highlight cerah tanpa putih yang terlalu menyilaukan.
  R.toneMapping=THREE.ACESFilmicToneMapping;
  R.toneMappingExposure=CFG.exposure;
  R.shadowMap.enabled=true;
  R.shadowMap.type=THREE.PCFSoftShadowMap;
  if(X.sun && X.sun.shadow){
    X.sun.shadow.bias=CFG.shadowBias;
    X.sun.shadow.radius=3;
    X.sun.shadow.mapSize.set(512,512);
  }
  var sky=new THREE.Color(CFG.ambientSky).convertSRGBToLinear();
  var ground=new THREE.Color(CFG.ambientGround).convertSRGBToLinear();
  var warm=new THREE.Color(CFG.sunWarm).convertSRGBToLinear();
  var fogTint=new THREE.Color(CFG.fogTint).convertSRGBToLinear();
  // Terapkan setelah pembaruan time-of-day agar cahaya tetap mengikuti waktu perangkat.
  K.hooks.push(function(){
    if(X.hemi){
      X.hemi.color.lerp(sky,0.22);
      X.hemi.groundColor.lerp(ground,0.18);
      var day=K.time.S.day;
      X.hemi.intensity=(K.time.S.hemiI*(1-0.18*day))+CFG.ambientBoost;
    }
    if(X.sun){
      X.sun.color.lerp(warm,0.18);
      var day=K.time.S.day;
      // Redam matahari siang agar vertex-color rumput tidak tampak menyala; malam tetap hampir sama.
      var daylightScale=0.70+0.30*(1-day);
      X.sun.intensity=K.time.S.sunI*CFG.sunBoost*daylightScale;
    }
    // Tidak mewarnai scene fog karena fog sengaja dinonaktifkan.
  });
  K.lighting={settings:CFG,renderer:R};
})();
