(function(){
  var $=function(i){return document.getElementById(i)},b=document.body,busy=false;

  // ---- SFX sintetis (WebAudio, terpisah dari audio dunia) ----
  var ac;function C(){if(!ac)ac=new (window.AudioContext||window.webkitAudioContext)();if(ac.resume)ac.resume();return ac}
  function tone(f0,f1,d,ty,g0,dl){var c=C(),o=c.createOscillator(),g=c.createGain(),t=c.currentTime+(dl||0);o.type=ty;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+d);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(g0,t+Math.min(.05,d/4));g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+d+.05)}
  function noise(d,g0,fc,dl){var c=C(),n=c.sampleRate*d|0,bf=c.createBuffer(1,n,c.sampleRate),a=bf.getChannelData(0),i;for(i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);
    var s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=bf;f.type='lowpass';f.frequency.value=fc;g.gain.value=g0;s.connect(f);f.connect(g);g.connect(c.destination);s.start(c.currentTime+(dl||0))}
  // pita derau dengan sapuan frekuensi (angin / whoosh)
  function sweep(d,g0,f0,f1,q,dl,peak){var c=C(),n=c.sampleRate*d|0,bf=c.createBuffer(1,n,c.sampleRate),a=bf.getChannelData(0),i;for(i=0;i<n;i++)a[i]=Math.random()*2-1;
    var s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(),t=c.currentTime+(dl||0);s.buffer=bf;f.type='bandpass';f.Q.value=q||1.2;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(40,f1),t+d);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(g0,t+d*(peak||.35));g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f);f.connect(g);g.connect(c.destination);s.start(t)}
  // Fase 3.6 (dibuat ulang): semua SFX lama (ledakan bintang jatuh) dihapus. Daftar suara:
  //  Pulau Awan : dissolve (Guide melebur) · wind (angin badai) · thunder (petir) · gust (embusan meniup bola) · fall (jatuh) · swell (awan memutih)
  //  Ladang     : crack (langit retak) · split (langit terbelah) · arrive (cahaya hangat)
  window.kxSfx=function(k){try{
    if(k==='dissolve'){for(var i=0;i<9;i++){var f=1568-i*95+Math.random()*60;tone(f,f*1.25,.5,'sine',.045,i*.22)}tone(392,784,2.2,'sine',.05);sweep(2.2,.04,2400,900,1.6,0,.3)}
    if(k==='wind'){sweep(8,.2,260,820,2.4,0,.55);sweep(8,.12,700,1700,1.8,1.2,.55);noise(7,.08,500)}
    if(k==='thunder'){noise(.12,.45,7000);noise(2.4,.55,380);tone(62,30,2.6,'sine',.5,.05)}
    if(k==='gust'){sweep(1.6,.26,350,2600,1.2,0,.45);tone(180,520,1.2,'sine',.05)}
    if(k==='fall'){sweep(4,.16,800,5600,.9,0,.7);tone(1100,150,3.4,'sine',.045,0)}
    if(k==='swell'){[262,330,392,523].forEach(function(f,i){tone(f,f,2.4,'sine',.06,i*.12)});sweep(2.2,.08,400,3400,.7,0,.8)}
    if(k==='crack'){noise(.07,.3,5200);noise(.05,.3,6200,.22);noise(.06,.34,4200,.5);tone(70,45,1.2,'sine',.22)}
    if(k==='split'){tone(90,28,2.4,'sine',.5);sweep(2.2,.22,200,2600,.7,0,.5);noise(.5,.25,1800,.1)}
    if(k==='arrive'){[262,330,392,494,659].forEach(function(f,i){tone(f,f,3,'sine',.07,i*.1);tone(f*2,f*2,2,'sine',.02,i*.1)})}}catch(e){}};

  // ---- tombol + konfirmasi (latar diburamkan selama dialog tampil) ----
  addEventListener('kaih-ready',function(){$('kx-btn').classList.add('on')});
  $('kx-btn').onclick=function(){if(!busy)$('kx-dlg').classList.add('on')};   // tombol asli disembunyikan; pintu (guide-map.js) memanggil .click() ini
  $('kx-no').onclick=function(){$('kx-dlg').classList.remove('on')};
  $('kx-yes').onclick=function(){if(busy)return;busy=true;$('kx-dlg').classList.remove('on');b.classList.add('kx-fin');$('kx-block').classList.add('on');
    dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));
    // cutscene keluar (Guide + teman jatuh + badai) hanya sekali per sesi: kunjungan berikutnya langsung memuat Ladang Langit
    if(window.KaihSeen&&KaihSeen.has('exit')&&window.__loadKaihLandscape){
      try{if(window.kaihStopWorldMusic)window.kaihStopWorldMusic(1.4)}catch(e){}
      if(window.KaihSkip)KaihSkip.loading(true,{text:'Memuat Ladang Langit…',until:function(){return document.body.classList.contains('intro-done')},max:45000});
      window.__loadKaihLandscape();return}
    if(window.KaihSeen)KaihSeen.mark('exit');
    setTimeout(function(){dispatchEvent(new Event('kaih-finale'))},80)};

  // Fase 3.6: dashboard, impact frame, dan portal DIHAPUS. 'kaih-finale' kini memulai cutscene keluar di bundle Pulau Awan
  // (Guide mengajak 7 teman, mereka jatuh) lalu bundle mengirim 'kaih-ladang-go' -> loader.js memuat Ladang Langit.
  window.KAIH={};
})();
