// Menu v2: sambungan tombol SETTINGS & CREDITS, dialog Credits, dan memunculkan ⚙ kiri atas SETELAH Play.
(function(){
  var html=document.documentElement,$=function(i){return document.getElementById(i)};

  // ---- ⚙ baru muncul setelah Play ditekan (juga saat dunia dimuat lewat "Skip ke dashboard") ----
  function showGear(){
    html.classList.add('kx-played');
    html.classList.remove('kx-from-menu');
    var S=window.KaihSettings;if(S&&S.toggle)S.toggle(false);   // tutup panel yang dibuka dari menu
  }
  ['kaih-play-start','kaih-finale','kaih-landscape-progress'].forEach(function(ev){addEventListener(ev,showGear)});

  // ---- SETTINGS (dari menu) ----
  var bs=$('mi-settings');
  if(bs)bs.addEventListener('click',function(e){
    e.stopPropagation();
    var S=window.KaihSettings;if(!S||!S.toggle)return;
    if(!html.classList.contains('kx-played'))html.classList.add('kx-from-menu');
    S.toggle();
  });

  // ---- CREDITS ----
  var dlg=document.createElement('div');dlg.id='kx-credits';dlg.setAttribute('role','dialog');dlg.setAttribute('aria-modal','true');dlg.setAttribute('aria-labelledby','kx-credits-h');
  dlg.innerHTML='<div class="cc"><h2 id="kx-credits-h">CREDITS</h2>'+
    '<p>7 KAIH</p><p class="cc-sub">Kebiasaan Anak Indonesia Hebat</p>'+
    '<p>Team WFH (Wajib Fast Hand) Productions</p>'+
    '<button type="button" class="cc-close">TUTUP</button></div>';
  html.appendChild(dlg);
  function open(v){dlg.classList.toggle('on',v)}
  var bc=$('mi-credits');if(bc)bc.addEventListener('click',function(e){e.stopPropagation();open(true)});
  dlg.addEventListener('click',function(e){if(e.target===dlg||(e.target.closest&&e.target.closest('.cc-close')))open(false)});
  addEventListener('keydown',function(e){if(e.key==='Escape'&&dlg.classList.contains('on'))open(false)});
  addEventListener('kaih-play-start',function(){open(false)});
})();
