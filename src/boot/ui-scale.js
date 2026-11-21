/* KAIH UI additions: global interface sizing */
(function(){
  var styleEl = document.createElement('style');
  styleEl.textContent = ''
    + '#kx-ui-scale-row{display:flex;align-items:center;gap:10px;margin:12px 0 4px;font-size:13px}#kx-ui-scale-row input{flex:1;min-width:0;accent-color:#d3bc8e}#kx-ui-scale-row output{min-width:42px;text-align:right;color:#f6e6b4}'
    + '#kx-gear,#kx-set,#edit-btn,#edit-panel,#cam-btn,#time-btn,#dash-btn,#kaih-dash{zoom:var(--kx-ui-scale,1)}'
    + '#edit-btn,#time-btn,#cam-btn{position:fixed!important;left:-10000px!important;top:-10000px!important;opacity:0!important;pointer-events:none!important}';
  document.head.appendChild(styleEl);

  function addScale(){
    var panel = document.getElementById('kx-set');
    if (!panel || document.getElementById('kx-ui-scale-row')) return;
    var row = document.createElement('div');
    row.id = 'kx-ui-scale-row';
    row.innerHTML = '<span>Ukuran UI</span><input id="kx-ui-scale" type="range" min="80" max="120" step="5"><output id="kx-ui-scale-value"></output>';
    var close = panel.querySelector('.ks-close');
    panel.insertBefore(row, close || null);
    var input = row.querySelector('input');
    var out = row.querySelector('output');
    var saved = 100;
    try { saved = Number(localStorage.getItem('kaih-ui-scale')) || 100; } catch(e){}
    function apply(v){
      v = Math.max(80, Math.min(120, Number(v) || 100));
      document.documentElement.style.setProperty('--kx-ui-scale', String(v / 100));
      input.value = v;
      out.textContent = v + '%';
      try { localStorage.setItem('kaih-ui-scale', String(v)); } catch(e){}
    }
    input.addEventListener('input', function(){ apply(this.value); });
    apply(saved);
  }

  var mo = new MutationObserver(function(){
    addScale();
    if (document.getElementById('kx-ui-scale-row')) {
      mo.disconnect();
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
  addScale();
})();
