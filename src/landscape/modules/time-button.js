// Tombol untuk melihat tampilan di waktu lain. Ketuk untuk berganti: Jam perangkat -> Pagi -> Siang -> Sore (golden hour) -> Senja (twilight) -> Malam.
// Hanya berbicara lewat API KAIH.time (set / live / onChange), jadi mudah dipindah atau diganti.
(function(){
  var P=[{k:'live',i:'🕒',n:'Jam perangkat'},{k:7.5,i:'🌅',n:'Pagi'},{k:12.5,i:'☀️',n:'Siang'},{k:17.6,i:'🌇',n:'Sore'},{k:19.5,i:'🌆',n:'Senja'},{k:21.5,i:'🌙',n:'Malam'}],idx=0;
  var b=document.createElement('button');b.id='time-btn';b.type='button';b.setAttribute('aria-label','Ganti waktu tampilan');document.body.appendChild(b);
  var pad=function(n){return(n<10?'0':'')+n};
  function clock(h){h=h%24;var H=Math.floor(h);return pad(H)+':'+pad(Math.floor((h-H)*60))}
  function render(){var T=window.KAIH&&KAIH.time;if(!T)return;var p=P[idx],h=p.k==='live'?new Date().getHours()+new Date().getMinutes()/60:p.k;
    b.innerHTML='<span class="ic">'+p.i+'</span><span>'+p.n+'<small>'+clock(h)+(p.k==='live'?' · waktu setempat':'')+'</small></span>'}
  b.onclick=function(){idx=(idx+1)%P.length;var p=P[idx];p.k==='live'?KAIH.time.live():KAIH.time.set(p.k);render()};
  render();setInterval(render,20000);
})();
