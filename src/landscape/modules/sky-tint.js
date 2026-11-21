// WARNA LANGIT SEMENTARA (v7). Dipakai easter egg bola Makanan: langit berubah oranye cerah.
// Membungkus K.time.update: setelah jam->warna dihitung, warna langit/cahaya digeser ke oranye, sehingga langit, cahaya, kabut
// dan awan (yang membaca K.time.S tiap frame) ikut berubah. K.skyTint.a = 0..1 (0 = normal, 1 = oranye penuh).
(function(){var K=window.KAIH,T=K.time,S=T.S,C=function(h){return new THREE.Color(h)},
  O={top:C('#ff8a2e'),hor:C('#ffd05a'),sun:C('#fff2b8'),hemiS:C('#ffc878'),hemiG:C('#d98a3a'),fog:C('#ffb454'),cloud:C('#ffe2a8')},
  KEYS=['top','hor','sun','hemiS','hemiG','fog','cloud'],u0=T.update;
K.skyTint={a:0};
T.update=function(dt){u0.call(T,dt);var a=K.skyTint.a;if(a<=.001)return;
  KEYS.forEach(function(k){S[k].lerp(O[k],a)});
  S.stars*=1-a;S.day+=(1-S.day)*a;S.lum=.5+.55*S.day;S.sunI+=(Math.max(S.sunI,1)-S.sunI)*a;S.hemiI+=(Math.max(S.hemiI,1)-S.hemiI)*a};
})();
