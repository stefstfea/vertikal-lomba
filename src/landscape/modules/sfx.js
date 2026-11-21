// Efek suara (SFX) disintesis langsung dengan WebAudio: tanpa file audio, tanpa unduhan, tetap jalan offline.
// Browser baru mengizinkan suara setelah ada sentuhan/ketukan pertama; intro "Ketuk untuk lanjut" sudah menjadi sentuhan itu,
// jadi modul ini memasang pendengar sendiri dan membuat AudioContext saat ketukan pertama.
//
// Dipanggil oleh modul lain lewat K.sfx.*:
//   tap()            : ketukan di layar pembuka (denting + embusan angin langit)
//   charge(dur)      : tegangan naik sebelum ledakan (pulsar menguat)
//   pulsar(k)        : satu denyut pulsar, k = 0..1 (makin lama makin tinggi & rapat)
//   boom()           : ledakan galaksi
//   portalOpen()     : portal terbentuk (akor magis + kilau)
//   humStart()/humStop(dur) : dengung portal selama terbuka
//   spawn(idx)       : benda ke-idx keluar dari portal (whoosh + denting nada pentatonik)
//   impact(m,v,type) : benda menumbuk tanah/benda lain (m = massa, v = kecepatan tumbukan, type = jenis benda)
//   grab()           : benda diangkat dengan kursor/jari
//   portalClose(dur) : portal menyedot lalu menutup;  pop() : letupan kecil penutup
//   setVolume(0..1), mute(true/false/undefined=toggle)  (tombol keyboard M juga menyalakan/mematikan suara)
(function(){var K=window.KAIH=window.KAIH||{};
var AC=window.AudioContext||window.webkitAudioContext,ctx=null,master=null,bus=null,send=null,noiseBuf=null,vol=.85,muted=false,humNodes=null,voices=0,lastImpact=0;

// ---------- dasar ----------
function build(){ctx=new AC();
  master=ctx.createGain();master.gain.value=muted?0:vol;
  var comp=ctx.createDynamicsCompressor();comp.threshold.value=-14;comp.knee.value=18;comp.ratio.value=5;comp.attack.value=.004;comp.release.value=.22;
  master.connect(comp);comp.connect(ctx.destination);
  bus=ctx.createGain();bus.gain.value=1;bus.connect(master);
  // gema ruang (reverb) dari derau yang meluruh: memberi kesan langit yang luas
  var len=Math.floor(ctx.sampleRate*2.6),ir=ctx.createBuffer(2,len,ctx.sampleRate);
  for(var ch=0;ch<2;ch++){var d=ir.getChannelData(ch),lp=0;for(var i=0;i<len;i++){var u=i/len;lp+=((Math.random()*2-1)-lp)*(.55-.4*u);d[i]=lp*Math.pow(1-u,2.8)*1.6}}
  var conv=ctx.createConvolver();conv.buffer=ir;var wet=ctx.createGain();wet.gain.value=.55;conv.connect(wet);wet.connect(master);
  send=ctx.createGain();send.gain.value=1;send.connect(conv);
  // derau putih 2 detik (dipakai berulang untuk whoosh, ledakan, dll.)
  var nl=ctx.sampleRate*2,nb=ctx.createBuffer(1,nl,ctx.sampleRate),nd=nb.getChannelData(0);for(var j=0;j<nl;j++)nd[j]=Math.random()*2-1;noiseBuf=nb}
function ensure(){if(!AC)return null;if(!ctx)build();if(ctx.state==='suspended'){try{ctx.resume()}catch(e){}}return ctx}
function out(node,wetAmt){node.connect(bus);if(wetAmt){var g=ctx.createGain();g.gain.value=wetAmt;node.connect(g);g.connect(send)}}
function T(){return ctx.currentTime}
function clamp(x,a,b){return Math.min(b,Math.max(a,x))}
function rnd(a,b){return a+Math.random()*(b-a)}
// selubung volume: naik cepat lalu meluruh eksponensial
function envG(g,t,a,peak,d){g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d)}
// nada tunggal: f0 -> f1 (opsional), attack a, puncak peak, meluruh d
function tone(type,f0,f1,t,a,peak,d,wet){var o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);
  if(f1)o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+a+d);envG(g,t,a,peak,d);o.connect(g);out(g,wet||0);o.start(t);o.stop(t+a+d+.05);return o}
// derau tersaring: tipe filter, frekuensi awal -> akhir, Q
function nz(t,dur,ftype,f0,f1,q,peak,a,wet){var s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=noiseBuf;s.loop=true;
  f.type=ftype;f.Q.value=q||1;f.frequency.setValueAtTime(f0,t);if(f1)f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
  envG(g,t,a||.01,peak,Math.max(.02,dur-(a||.01)));s.connect(f);f.connect(g);out(g,wet||0);s.start(t,Math.random()*1.4);s.stop(t+dur+.05);return g}
var PENTA=[0,2,4,7,9];   // nada pentatonik (selalu enak didengar berurutan)
function hz(base,semi){return base*Math.pow(2,semi/12)}

// ---------- layar pembuka ----------
function tap(){if(!ensure())return;var t=T();
  [0,7,12,16].forEach(function(s,i){tone('sine',hz(523.25,s),0,t+i*.06,.01,.09,1.4,.7);tone('triangle',hz(1046.5,s),0,t+i*.06,.01,.025,.9,.8)});
  nz(t,5.5,'bandpass',300,2400,.7,.07,2.2,.35)}   // embusan angin saat kamera menengadah lalu menunduk

// ---------- pulsar & ledakan ----------
function charge(dur){if(!ensure())return;var t=T();dur=dur||1.9;
  var o=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain();o.type='sawtooth';o.frequency.setValueAtTime(48,t);o.frequency.exponentialRampToValueAtTime(420,t+dur);
  f.type='lowpass';f.frequency.setValueAtTime(160,t);f.frequency.exponentialRampToValueAtTime(3400,t+dur);f.Q.value=5;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.2,t+dur*.96);g.gain.linearRampToValueAtTime(.0001,t+dur+.05);
  o.connect(f);f.connect(g);out(g,.25);o.start(t);o.stop(t+dur+.1);
  nz(t,dur,'highpass',900,7000,1.5,.14,dur*.9,.2);          // desis naik
  tone('sine',34,90,t,dur*.9,.22,.1,0)}                      // dengung sub yang menegang
function pulsar(k){if(!ensure())return;k=clamp(k||0,0,1);var t=T();
  tone('sine',120+60*k,44,t,.004,.5+.25*k,.16,.15);                    // denyut jantung
  tone('sine',1500+1900*k,1200+1600*k,t,.002,.07+.07*k,.12+.1*k,.9);   // ping tajam pulsar
  if(k>.6)tone('square',620+900*k,300,t,.002,.03,.07,.3)}
function boom(){if(!ensure())return;var t=T();
  tone('sine',92,24,t,.006,1.0,2.6,.2);                               // dentuman sub
  tone('sine',170,46,t,.004,.5,.9,.2);
  nz(t,2.4,'lowpass',7500,140,.8,.9,.004,.55);                        // semburan ledakan
  nz(t,.28,'highpass',2400,0,1,.7,.002,.3);                           // retakan tajam di awal
  nz(t+.05,2.2,'bandpass',260,5200,.9,.38,.7,.6);                     // whoosh galaksi mengembang
  // kilau bintang yang berhamburan (turun beruntun)
  for(var i=0;i<14;i++){var s=PENTA[i%5]+12*Math.floor(i/5);tone('sine',hz(784,s),0,t+.12+i*.06+rnd(0,.03),.004,.05,1.6,.9)}
  tone('sawtooth',55,110,t+.04,.5,.12,1.8,.3)}
function portalOpen(){if(!ensure())return;var t=T();
  // akor megah naik perlahan: D mayor add9 (D3 A3 D4 F#4 A4 E5)
  [[146.83,0],[220,.05],[293.66,.1],[369.99,.16],[440,.22],[659.25,.3]].forEach(function(n){
    tone('sine',n[0],0,t+n[1],1.1,.17,3.6,.8);tone('triangle',n[0]*2.003,0,t+n[1]+.05,1.2,.045,3.2,.9)});
  nz(t,2.6,'bandpass',500,5200,1.1,.2,1.2,.7);                         // kilau udara naik
  for(var i=0;i<9;i++){tone('sine',hz(1046.5,PENTA[i%5]+12*Math.floor(i/5)),0,t+.5+i*.11,.003,.07,1.5,.95)}   // arpeggio lonceng
  tone('sine',60,38,t,.05,.45,1.5,.1)}
function humStart(){if(!ensure()||humNodes)return;var t=T(),g=ctx.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.07,t+1.4);
  var f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=520;f.Q.value=2;
  var o1=ctx.createOscillator(),o2=ctx.createOscillator(),o3=ctx.createOscillator();o1.type='sawtooth';o2.type='sawtooth';o3.type='sine';
  o1.frequency.value=73.4;o2.frequency.value=73.9;o3.frequency.value=146.8;   // dua gelombang sedikit berbeda -> bergetar pelan
  var lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=.22;lg.gain.value=170;lfo.connect(lg);lg.connect(f.frequency);   // filter menyapu pelan
  var og=ctx.createGain();og.gain.value=.5;o1.connect(f);o2.connect(f);o3.connect(og);og.connect(g);f.connect(g);out(g,.5);
  var s=ctx.createBufferSource(),nf=ctx.createBiquadFilter(),ng=ctx.createGain();s.buffer=noiseBuf;s.loop=true;nf.type='bandpass';nf.frequency.value=900;nf.Q.value=.6;ng.gain.value=.22;s.connect(nf);nf.connect(ng);ng.connect(g);
  [o1,o2,o3,lfo,s].forEach(function(n){n.start(t)});humNodes={g:g,nodes:[o1,o2,o3,lfo,s]}}
function humStop(dur){if(!ctx||!humNodes)return;dur=dur||1.5;var t=T(),h=humNodes;humNodes=null;h.g.gain.cancelScheduledValues(t);h.g.gain.setValueAtTime(Math.max(.0002,h.g.gain.value),t);h.g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  h.nodes.forEach(function(n){try{n.stop(t+dur+.05)}catch(e){}})}

// ---------- benda keluar dari portal ----------
function spawn(idx){if(!ensure())return;var t=T(),n=PENTA[(idx||0)%5]+12*Math.floor((idx||0)/5);
  nz(t,.7,'bandpass',3200,520,1.4,.32,.02,.5);                         // whoosh turun
  tone('sine',hz(659.25,n)*2,hz(659.25,n),t,.004,.12,.5,.9);           // denting luncur turun ke nada tujuan
  tone('triangle',hz(659.25,n),0,t+.02,.006,.07,1.1,.9);
  tone('sine',hz(1318.5,n+12),0,t+.08,.003,.04,.9,1);
  tone('sine',150,70,t,.01,.22,.3,.2)}                                  // "buk" halus pembuka

// ---------- benda jatuh / bertumbukan ----------
// m = massa, v = kecepatan tumbukan sepanjang normal, type = jenis benda (menentukan bahan suaranya)
function impact(m,v,type){if(!ctx||ctx.state!=='running')return;var t=T();v=Math.abs(v||0);if(v<1.1||t-lastImpact<.045||voices>26)return;lastImpact=t;
  var k=clamp((v-1)/11,.06,1),mm=clamp(m||4,1,12),low=clamp(150-mm*7,70,140),vol=.18+.7*k;voices++;setTimeout(function(){voices--},700);
  // dasar: dentum benda berat + debu
  tone('sine',low*(1+.4*k),low*.38,t,.003,vol*.9,.12+.2*k+mm*.012,.12);
  nz(t,.1+.12*k,'lowpass',900+1800*k,160,.7,vol*.5,.002,.1);
  switch(type){
    case 'treadmill':   // logam + karet: dentang berongga
      tone('square',rnd(340,380),0,t,.002,vol*.07,.25*k+.08,.4);tone('sine',rnd(780,860),0,t,.002,vol*.08*k,.5,.5);tone('sine',1330,0,t,.002,vol*.05*k,.35,.5);break;
    case 'bed':         // kasur: empuk, memantul pegas
      nz(t,.26,'lowpass',420,120,.6,vol*.5,.004,.1);tone('sine',rnd(115,135),rnd(80,100),t+.02,.01,vol*.28,.5,.2);
      if(k>.3){var sp=tone('sine',95,0,t+.03,.01,vol*.12,.7,.2);var vb=ctx.createOscillator(),vg=ctx.createGain();vb.frequency.value=17;vg.gain.value=12;vb.connect(vg);vg.connect(sp.frequency);vb.start(t);vb.stop(t+.8)}break;
    case 'angel':       // patung batu: benturan padat + retak tipis
      nz(t,.05,'highpass',2800,0,1,vol*.4,.001,.2);tone('sine',rnd(220,260),rnd(160,190),t,.002,vol*.25,.3,.35);tone('sine',rnd(1650,1900),0,t,.001,vol*.04,.18,.5);break;
    case 'food':        // piring & gelas: denting keramik beruntun
      for(var i=0;i<4;i++)tone('sine',rnd(1800,3900),0,t+i*rnd(.02,.05),.001,vol*.07,.22+k*.2,.7);nz(t,.04,'highpass',4000,0,1,vol*.25,.001,.3);break;
    case 'book':        // buku/kayu: ketukan kering
      nz(t,.07,'bandpass',1400,700,1.5,vol*.5,.001,.1);tone('triangle',rnd(190,230),rnd(120,150),t,.002,vol*.22,.14,.15);break;
    case 'people':      // kumpulan orang: debam kecil lembut
      tone('sine',rnd(110,150),70,t,.006,vol*.2,.22,.1);nz(t,.12,'lowpass',700,200,.6,vol*.3,.004,.1);break;
    case 'clock':       // jam weker: berdering logam
      tone('sine',1210,0,t,.001,vol*.09,.9+.5*k,.7);tone('sine',1820,0,t,.001,vol*.07,.7+.4*k,.7);tone('sine',2580,0,t+.01,.001,vol*.04,.5,.7);
      if(k>.25){tone('sine',1210,0,t+.11,.001,vol*.05,.7,.7);tone('sine',1820,0,t+.11,.001,vol*.04,.6,.7)}break;
    default:break}}
function grab(){if(!ensure())return;var t=T();tone('sine',260,520,t,.01,.07,.14,.5);nz(t,.18,'bandpass',900,2600,1,.035,.03,.3)}

// ---------- portal menutup ----------
function portalClose(dur){if(!ensure())return;var t=T();dur=dur||2.4;humStop(dur*.9);
  nz(t,dur,'bandpass',4200,160,1.1,.32,dur*.55,.5);                    // tersedot masuk
  var o=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain();o.type='sawtooth';o.frequency.setValueAtTime(440,t);o.frequency.exponentialRampToValueAtTime(36,t+dur);
  f.type='lowpass';f.frequency.setValueAtTime(3000,t);f.frequency.exponentialRampToValueAtTime(110,t+dur);f.Q.value=4;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.15,t+dur*.45);g.gain.exponentialRampToValueAtTime(.0001,t+dur+.05);
  o.connect(f);f.connect(g);out(g,.3);o.start(t);o.stop(t+dur+.1);
  [0,4,7,12].forEach(function(s,i){tone('sine',hz(1318.5,-s),0,t+.1+i*.2,.01,.04,1.1,.9)})}
function pop(){if(!ensure())return;var t=T();tone('sine',130,34,t,.003,.7,.55,.2);nz(t,.45,'lowpass',5200,260,.8,.35,.002,.5);
  for(var i=0;i<6;i++)tone('sine',hz(2093,PENTA[i%5]),0,t+.03+i*.05,.002,.045,.8,1)}

// ---------- pengendali ----------
function setVolume(v){vol=clamp(v,0,1);if(master)master.gain.value=muted?0:vol}
function mute(m){muted=(m===undefined)?!muted:!!m;if(master)master.gain.setTargetAtTime(muted?0:vol,ctx.currentTime,.03);return muted}
K.sfx={ensure:ensure,tap:tap,charge:charge,pulsar:pulsar,boom:boom,portalOpen:portalOpen,humStart:humStart,humStop:humStop,spawn:spawn,impact:impact,grab:grab,portalClose:portalClose,pop:pop,setVolume:setVolume,mute:mute};
// buka kunci audio pada sentuhan pertama (aturan autoplay browser)
function unlock(){ensure();if(ctx&&ctx.state==='running'){['pointerdown','touchend','keydown','click'].forEach(function(e){removeEventListener(e,unlock,true)})}}
['pointerdown','touchend','keydown','click'].forEach(function(e){addEventListener(e,unlock,true)});
addEventListener('keydown',function(e){if((e.key==='m'||e.key==='M')&&!e.ctrlKey&&!e.metaKey&&!e.altKey)mute()});
// suara dimatikan saat tab disembunyikan, supaya tidak berbunyi di latar belakang
document.addEventListener('visibilitychange',function(){if(!ctx)return;if(document.hidden)ctx.suspend().catch(function(){});else if(!muted)ctx.resume().catch(function(){})});
})();
