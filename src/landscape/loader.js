(function(){
  var switched=false;
  function progress(d,t){try{window.dispatchEvent(new CustomEvent('kaih-landscape-progress',{detail:{done:d,total:t}}))}catch(e){}}   // FIX (Fase 2.3): untuk layar loading
  function loadLandscape(){
    if(switched)return; switched=true;
    // kedatangan di Ladang Langit (petir+langit terbelah+Guide) hanya sekali per sesi; kunjungan berikutnya langsung dilewati
    window.__kaihLadangSeen = !!(window.KaihSeen && window.KaihSeen.has('ladang'));
    if(window.__kaihLadangSeen) window.__kaihFast = true;
    setTimeout(function(){
      try {
        // Hentikan React/WebGL Pulau Awan sebelum canvas dan DOM-nya diganti.
        try {
          if (window.__kaihRoot && typeof window.__kaihRoot.unmount === 'function') {
            window.__kaihRoot.unmount();
          }
        } catch (disposeError) {
          console.warn('[7 KAIH] Pembersihan renderer Pulau Awan:', disposeError);
        }
        window.__kaihRoot = null;
        document.title='7 KAIH · Ladang Langit';
        document.body.className='';
        document.body.innerHTML=window.__LANDSCAPE_BODY__;
        var style=document.getElementById('runtime-style');
        if(!style){ style=document.createElement('style'); style.id='runtime-style'; document.head.appendChild(style); }
        style.textContent=window.__LANDSCAPE_CSS__;

        var names=window.__LANDSCAPE_SCRIPT_NAMES__||[];
        var paths=window.__LANDSCAPE_MODULE_PATHS__||{};
        var i=0;
        function next(){
          progress(Math.min(i,names.length),names.length);
          if(i>=names.length){ window.__landscapeLoaded=true; return; }
          var name=names[i++];
          var src=paths[name];
          if(typeof src !== 'string'){
            console.error('[7 KAIH] Path modul tidak ditemukan:',name);
            next();
            return;
          }
          var sc=document.createElement('script');
          sc.dataset.landscapeScript=name;
          sc.src=src;
          sc.async=false;
          sc.onload=next;
          sc.onerror=function(err){
            console.error('[7 KAIH] Gagal memuat modul:',name,err);
            next();
          };
          document.body.appendChild(sc);
        }
        next();
      } catch(err) {
        console.error('[7 KAIH] Gagal memuat Landscape:',err);
        document.body.innerHTML='<div style="position:fixed;inset:0;display:grid;place-items:center;background:#0b153b;color:white;font:16px system-ui;text-align:center;padding:24px"><div><h2>Landscape belum dapat dimuat</h2><p>Silakan muat ulang halaman dan pastikan koneksi internet aktif untuk pustaka 3D.</p><small>'+String(err.message||err)+'</small></div></div>';
      }
    },180);
  }
  // Fase 3.6: cutscene keluar Pulau Awan mengirim 'kaih-ladang-go'. Timer cadangan jika event tidak datang.
  var fallbackTimer = null;
  window.addEventListener('kaih-ladang-go', loadLandscape, { once: true });
  window.addEventListener('kaih-finale', function () {
    if (fallbackTimer) clearTimeout(fallbackTimer);
    fallbackTimer = setTimeout(loadLandscape, 14000);
  }, { once: true });
  window.__loadKaihLandscape = loadLandscape;
})();
